import * as THREE from 'three';

// One shared, weathered stone mesh. Coordinate-based deformation keeps duplicated
// face vertices together and preserves the former boulder's collision silhouette.
export function createBoulderGeometry(){
  const geometry=new THREE.DodecahedronGeometry(1,1);
  geometry.computeBoundingBox();
  const original=geometry.boundingBox.clone(),positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const weather=1+.075*Math.sin(x*7+z*3)+.045*Math.cos(y*9-z*5);
    positions.setXYZ(i,
      x*weather+.08*y*z,
      Math.max(-.78,Math.min(.76,y*weather))+.055*x-.035*z,
      z*weather+.06*x*y);
  }
  geometry.computeBoundingBox();
  const shaped=geometry.boundingBox.clone();
  for(let i=0;i<positions.count;i++)for(let axis=0;axis<3;axis++){
    const low=shaped.min.getComponent(axis),high=shaped.max.getComponent(axis);
    const t=(positions.getComponent(i,axis)-low)/(high-low);
    positions.setComponent(i,axis,THREE.MathUtils.lerp(original.min.getComponent(axis),original.max.getComponent(axis),t));
  }
  positions.needsUpdate=true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
