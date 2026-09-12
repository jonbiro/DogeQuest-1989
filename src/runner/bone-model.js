import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function createBoneGeometry(){
  const shaft=new THREE.CylinderGeometry(.105,.105,.72,12,1);
  shaft.rotateZ(Math.PI/2);
  const parts=[shaft];
  for(const side of [-1,1])for(const lobe of [-1,1]){
    const end=new THREE.SphereGeometry(1,16,10);
    end.scale(.17,.16,.16);end.translate(side*.38,lobe*.10,0);parts.push(end);
  }
  const geometry=mergeGeometries(parts,false);
  for(const part of parts)part.dispose();
  const normal=geometry.attributes.normal,colors=new Float32Array(normal.count*3);
  const ivory=new THREE.Color('#fff2ca'),edge=new THREE.Color('#a86d2f'),color=new THREE.Color();
  for(let i=0;i<normal.count;i++){
    const face=.38+.62*Math.abs(normal.getZ(i));
    color.copy(edge).lerp(ivory,face).toArray(colors,i*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geometry.computeBoundingSphere();return geometry;
}
