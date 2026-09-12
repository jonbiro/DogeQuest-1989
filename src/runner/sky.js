import * as THREE from 'three';

// One fixed mesh, no texture or animation: retain a light, readable horizon.
export function createSky() {
  const geometry=new THREE.SphereGeometry(1,24,16);
  const positions=geometry.getAttribute('position');
  const colors=new Float32Array(positions.count*3);
  for(let i=0;i<positions.count;i++){
    const height=Math.max(0,positions.getY(i));
    const rise=Math.sqrt(height);
    colors.set([1-.44*rise,1-.22*rise,1-.06*rise],i*3);
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,
    depthWrite:false,fog:false,toneMapped:false});
  const sky=new THREE.Mesh(geometry,material);
  sky.scale.setScalar(170);
  sky.renderOrder=-1;
  sky.frustumCulled=false;
  const sun=new THREE.Mesh(new THREE.SphereGeometry(.024,16,12),
    new THREE.MeshBasicMaterial({color:'#fff0ca',fog:false,toneMapped:false,depthWrite:false}));
  sun.position.set(-.48,.35,-.75);
  sun.name='distant-sun';
  sky.add(sun);
  return sky;
}
