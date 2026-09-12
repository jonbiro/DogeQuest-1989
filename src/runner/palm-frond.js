import * as THREE from 'three';

// A thin curved leaf with a raised central rib and gently scalloped edges.
// Top and underside keep correct lighting without making every scenery material
// double-sided. All palm trees share this single small geometry.
export function createPalmFrondGeometry(){
  const positions=[],uvs=[],indices=[],rows=9;
  for(const side of [1,-1])for(let row=0;row<rows;row++){
    const t=row/(rows-1),width=.015+Math.pow(Math.sin(Math.PI*t),.7)*(.43+.035*Math.cos(t*Math.PI*8));
    for(const cross of [-1,0,1]){
      positions.push(t*2-1,.3*Math.sin(Math.PI*t)-.6*t*t+(1-Math.abs(cross))*.09+side*.012,cross*width);
      uvs.push(t,(cross+1)/2);
    }
  }
  for(let side=0;side<2;side++)for(let row=0;row<rows-1;row++)for(let cross=0;cross<2;cross++){
    const a=side*rows*3+row*3+cross,b=a+1,c=a+3,d=c+1;
    indices.push(...(side===0?[a,b,c,b,d,c]:[a,c,b,b,c,d]));
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}
