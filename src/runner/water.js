import * as THREE from 'three';
import {BRIDGE_PERIOD,BRIDGE_START,BRIDGE_END} from './bridges.js';

const ROWS=21,ACROSS=[-35,-12,0,12,35];

// One indexed ribbon per visible crossing, with genuinely shared edges. The old
// overlapping coplanar slabs fought in the depth buffer along every tile seam.
export function createWaterSurface(scene) {
  const geometry=new THREE.BufferGeometry();
  const positions=new THREE.BufferAttribute(new Float32Array(ROWS*ACROSS.length*3),3);
  positions.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position',positions);
  const normals=new Float32Array(positions.count*3),colors=new Float32Array(positions.count*3);
  const deep=new THREE.Color('#286b82'),shore=new THREE.Color('#7aafa7'),color=new THREE.Color();
  for(let row=0;row<ROWS;row++)for(let column=0;column<ACROSS.length;column++){
    const index=row*ACROSS.length+column;
    normals[index*3+1]=1;
    const bank=Math.pow(Math.abs(row/(ROWS-1)*2-1),6);
    color.copy(deep).lerp(shore,bank*.6+Math.abs(ACROSS[column])/35*.12).toArray(colors,index*3);
  }
  geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const indices=[];
  for(let row=0;row<ROWS-1;row++)for(let column=0;column<ACROSS.length-1;column++){
    const a=row*ACROSS.length+column,b=a+1,c=a+ACROSS.length,d=c+1;
    indices.push(a,b,c,b,d,c);
  }
  geometry.setIndex(indices);
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.12}));
  mesh.name='continuous-river';mesh.frustumCulled=false;mesh.visible=false;mesh.receiveShadow=true;
  scene.add(mesh);
  return {
    mesh,
    update(distance,frameAt,menu=false){
      mesh.visible=false;
      if(menu||!Number.isFinite(distance)||distance<0)return;
      // The visible window is shorter than a bridge repeat; at most one river.
      let cycle=Math.floor((distance-12-BRIDGE_END)/BRIDGE_PERIOD)+1;
      cycle=Math.max(0,cycle);
      const start=cycle*BRIDGE_PERIOD+BRIDGE_START-2.5;
      const end=cycle*BRIDGE_PERIOD+BRIDGE_END-2.5;
      if(end<distance-12||start>distance+175)return;
      for(let row=0;row<ROWS;row++){
        const station=start+(end-start)*row/(ROWS-1);
        const frame=frameAt(distance-station);
        const cosine=Math.cos(frame.yaw),sine=Math.sin(frame.yaw);
        for(let column=0;column<ACROSS.length;column++){
          const across=ACROSS[column];
          positions.setXYZ(row*ACROSS.length+column,
            frame.x+across*cosine,frame.y-1.08,frame.z-across*sine);
        }
      }
      positions.needsUpdate=true;mesh.visible=true;
      return {start,end};
    },
  };
}
