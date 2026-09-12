import * as THREE from 'three';

// Broad eroded ridges with rounded summits, rather than repeated pointed cones.
export function createMountainGeometry() {
  const geometry=new THREE.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2);
  const positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const angle=Math.atan2(z,x);
    const ridge=1+.16*Math.sin(angle*3)+.09*Math.cos(angle*5);
    const height=y;
    const crest=.11*Math.sin(x*4+z*3)*Math.sin(height*Math.PI);
    positions.setXYZ(i,x*ridge+.14*height*height,height-.5+crest,z*ridge);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
