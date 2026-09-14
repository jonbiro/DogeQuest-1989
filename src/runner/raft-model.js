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
  // Two compact paddles make the sailor painting feel grounded in the ride.
  // Each paddle is a tiny articulated group so the renderer can stroke it
  // without allocating meshes or changing the raft's collision footprint.
  const oars=[];
  for(const side of [-1,1]){
    const oar=new THREE.Group();
    oar.name=`raft-oar-${side<0?'left':'right'}`;
    // Keep the handles on the near edge of the raft so they remain readable
    // in the low chase camera instead of disappearing behind the puppy.
    oar.position.set(side*1.14,.16,.30);
    oar.rotation.set(0,side*.20,side*.035);
    oar.userData.side=side;
    oar.userData.baseRotation={x:oar.rotation.x,y:oar.rotation.y,z:oar.rotation.z};
    mesh(oar,boxGeometry,'#6d4a2c',0,0,.36,.075,.075,.98);
    mesh(oar,boxGeometry,'#e0b56c',0,0,.90,.23,.09,.38);
    group.add(oar);oars.push(oar);
  }
  group.userData.oars=oars;
  group.traverse(part=>{if(part.isMesh)part.castShadow=true;});
  group.visible=false;
  return group;
}
