import * as THREE from 'three';

export function createLogModel(mesh,box){
  const log=new THREE.Group();
  const timber=mesh(log,new THREE.CylinderGeometry(.46,.48,1.95,18),'#683a20',0,.48,0,1,1,1);
  timber.name='log-body';timber.rotation.z=Math.PI/2;
  const endGeometry=new THREE.CylinderGeometry(.4,.4,.015,18);
  const ringGeometry=new THREE.TorusGeometry(.25,.018,4,18);
  for(const x of [-.98,.98]){
    const end=mesh(log,endGeometry,'#e4ba7a',x,.48,0,1,1,1);end.rotation.z=Math.PI/2;
    const ring=mesh(log,ringGeometry,'#9b6636',x*1.01,.48,0,1,1,1);ring.rotation.y=Math.PI/2;
  }
  box(log,'#ad7b43',0,.82,.3,1.8,.08,.07);
  box(log,'#3f291b',0,.4,.47,1.7,.045,.025);
  // Rings and surface trim remain fully lit, but the solid body supplies their
  // shared ground silhouette. Avoid six duplicate shadow draws per visible log.
  for(const part of log.children)part.userData.shadowDetail=part!==timber;
  return log;
}
