import * as THREE from 'three';

// Shared deterministic ridge mesh: broad irregular slopes, not perfect pyramids.
export function createMountainGeometry() {
  const geometry=new THREE.ConeGeometry(1,1,12,4);
  const positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const angle=Math.atan2(z,x);
    const ridge=1+.13*Math.sin(angle*3)+.07*Math.cos(angle*5);
    const height=y+.5;
    const shoulder=1+.18*Math.sin(height*Math.PI);
    positions.setXYZ(i,x*ridge*shoulder,y,z*ridge*shoulder);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
