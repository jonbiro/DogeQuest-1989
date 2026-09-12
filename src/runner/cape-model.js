import * as THREE from 'three';

export function createCapeGeometry(){
  const geometry=new THREE.PlaneGeometry(1.05,1.4,6,8),positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),along=positions.getY(i)/1.4+.5;
    positions.setXYZ(i,x*(.8+.2*along),-.12*along*along+.035*Math.cos(x*14)*along,along*1.4-.7);
  }
  geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
