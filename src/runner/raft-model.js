import * as THREE from 'three';

// Shared scene geometries keep the new vehicle inexpensive. Seven rounded logs
// sit below cross-planks; contrasting lashings explain how the raft is joined.
export function createRaftModel(mesh,boxGeometry,trunkGeometry){
  const group=new THREE.Group();group.name='river-raft';
  for(let i=0;i<7;i++){
    const log=mesh(group,trunkGeometry,i%2?'#976b42':'#ba8b55',(i-3)*.31,-.32,0,.19,2.9,.19);
    log.rotation.x=Math.PI/2;
  }
  for(const z of [-.95,0,.95])mesh(group,boxGeometry,'#cfa66c',0,-.075,z,2.25,.15,.35);
  for(const z of [-.95,.95])mesh(group,boxGeometry,'#594f3a',0,.015,z,2.32,.045,.085);
  group.traverse(part=>{if(part.isMesh)part.castShadow=true;});
  group.visible=false;
  return group;
}
