function RoundEdgedBox(w, h, d, r, wSegs, hSegs, dSegs, rSegs) {

   w = w || 1;
   h = h || 1;
   d = d || 1;
   let minimum = Math.min(Math.min(w, h), d);
   r = r || minimum * .25;
   r = r > minimum * .5 ? minimum * .5 : r;
   wSegs = Math.floor(wSegs) || 1;
   hSegs = Math.floor(hSegs) || 1;
   dSegs = Math.floor(dSegs) || 1;
   rSegs = Math.floor(rSegs) || 1;

   let fullGeometry = new THREE.BufferGeometry();

   let fullPosition = [];
   let fullUvs = [];
   let fullIndex = [];
   let fullIndexStart = 0;

   let groupStart = 0;

   bendedPlane(w, h, r, wSegs, hSegs, rSegs, d * .5, 'y', 0, 0);
   bendedPlane(w, h, r, wSegs, hSegs, rSegs, d * .5, 'y', Math.PI, 1);
   bendedPlane(d, h, r, dSegs, hSegs, rSegs, w * .5, 'y', Math.PI * .5, 2);
   bendedPlane(d, h, r, dSegs, hSegs, rSegs, w * .5, 'y', Math.PI * -.5, 3);
   bendedPlane(w, d, r, wSegs, dSegs, rSegs, h * .5, 'x', Math.PI * -.5, 4);
   bendedPlane(w, d, r, wSegs, dSegs, rSegs, h * .5, 'x', Math.PI * .5, 5);

   fullGeometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(fullPosition), 3));
   fullGeometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(fullUvs), 2));
   fullGeometry.setIndex(fullIndex);

   fullGeometry.computeVertexNormals();

   return fullGeometry;

   function bendedPlane(width, height, radius, widthSegments, heightSegments, smoothness, offset, axis, angle, materialIndex) {

     let halfWidth = width * .5;
     let halfHeight = height * .5;
     let widthChunk = width / (widthSegments + smoothness * 2);
     let heightChunk = height / (heightSegments + smoothness * 2);

     let planeGeom = new THREE.PlaneBufferGeometry(width, height, widthSegments + smoothness * 2, heightSegments + smoothness * 2);

     let v = new THREE.Vector3(); // current vertex
     let cv = new THREE.Vector3(); // control vertex for bending
     let cd = new THREE.Vector3(); // vector for distance
     let position = planeGeom.attributes.position;
     let uv = planeGeom.attributes.uv;
     let widthShrinkLimit = widthChunk * smoothness;
     let widthShrinkRatio = radius / widthShrinkLimit;
     let heightShrinkLimit = heightChunk * smoothness;
     let heightShrinkRatio = radius / heightShrinkLimit;
     let widthInflateRatio = (halfWidth - radius) / (halfWidth - widthShrinkLimit);
     let heightInflateRatio = (halfHeight - radius) / (halfHeight - heightShrinkLimit);
     for (let i = 0; i < position.count; i++) {
       v.fromBufferAttribute(position, i);
       if (Math.abs(v.x) >= halfWidth - widthShrinkLimit) {
         v.setX((halfWidth - (halfWidth - Math.abs(v.x)) * widthShrinkRatio) * Math.sign(v.x));
       } else {
         v.x *= widthInflateRatio;
       }// lr
       if (Math.abs(v.y) >= halfHeight - heightShrinkLimit) {
         v.setY((halfHeight - (halfHeight - Math.abs(v.y)) * heightShrinkRatio) * Math.sign(v.y));
       } else {
         v.y *= heightInflateRatio;
       }// tb

       //re-calculation of uvs
       uv.setXY(
         i,
         (v.x - (-halfWidth)) / width,
         1 - (halfHeight - v.y) / height
       );


       // bending
       let widthExceeds = Math.abs(v.x) >= halfWidth - radius;
       let heightExceeds = Math.abs(v.y) >= halfHeight - radius;
       if (widthExceeds || heightExceeds) {
         cv.set(
           widthExceeds ? (halfWidth - radius) * Math.sign(v.x) : v.x,
           heightExceeds ? (halfHeight - radius) * Math.sign(v.y) : v.y, -radius);
         cd.subVectors(v, cv).normalize();
         v.copy(cv).addScaledVector(cd, radius);
       };

       position.setXYZ(i, v.x, v.y, v.z);
     }

     planeGeom.translate(0, 0, offset);
     switch (axis) {
       case 'y':
         planeGeom.rotateY(angle);
         break;
       case 'x':
         planeGeom.rotateX(angle);
     }

     // merge positions
     position.array.forEach(function(p){
       fullPosition.push(p);
     });

     // merge uvs
     uv.array.forEach(function(u){
       fullUvs.push(u);
     });

     // merge indices
     planeGeom.index.array.forEach(function(a) {
       fullIndex.push(a + fullIndexStart);
     });
     fullIndexStart += position.count;

     // set the groups
     fullGeometry.addGroup(groupStart, planeGeom.index.count, materialIndex);
     groupStart += planeGeom.index.count;
   }
 }
