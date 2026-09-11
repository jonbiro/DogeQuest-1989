import * as THREE from 'three';

// One fixed mesh, no texture or animation: retain a light, readable horizon.
export function createSky() {
  const geometry=new THREE.SphereGeometry(1,24,16);
  const positions=geometry.getAttribute('position');
  const colors=new Float32Array(positions.count*3);
  for(let i=0;i<positions.count;i++){
    const height=Math.max(0,positions.getY(i));
    const shade=1-.48*Math.sqrt(height);
    colors.set([shade,shade,shade],i*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,
    depthWrite:false,fog:false,toneMapped:false});
  const sky=new THREE.Mesh(geometry,material);
  sky.scale.setScalar(170);
  sky.renderOrder=-1;
  sky.frustumCulled=false;
  return sky;
}
