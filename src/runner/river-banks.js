import * as THREE from 'three';

// Low shoreline stones stay well outside playable lanes. Reuse the hazard's
// sculpted geometry, but use muted earth colors and no hazard markings.
export function createRiverBanks(scene,geometry){
  const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1}),36);
  mesh.name='river-shore-stones';mesh.frustumCulled=false;mesh.visible=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.receiveShadow=true;
  const pose=new THREE.Object3D(),color=new THREE.Color();
  scene.add(mesh);
  return {mesh,update(distance,frameAt,section){
    mesh.visible=Boolean(section);mesh.count=0;
    if(!section)return;
    for(let i=0;i<18;i++)for(const side of [-1,1]){
      const station=section.start+3+i*(section.end-section.start-6)/17;
      if(station<distance-12||station>distance+170)continue;
      const frame=frameAt(distance-station),offset=side*(8.7+.35*Math.sin(i*2.3));
      pose.position.set(frame.x+offset*Math.cos(frame.yaw),frame.y-.42,frame.z-offset*Math.sin(frame.yaw));
      pose.rotation.set(frame.pitch,frame.yaw+side*.2,side*.06,'YXZ');
      pose.scale.set(1.6+.3*Math.sin(i*1.7),.55+.2*Math.cos(i*2.1),2.6+.35*Math.sin(i));
      pose.updateMatrix();mesh.setMatrixAt(mesh.count,pose.matrix);
      color.set(i%3===0?'#809281':i%3===1?'#78877d':'#8e9688');
      mesh.setColorAt(mesh.count++,color);
    }
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  }};
}
