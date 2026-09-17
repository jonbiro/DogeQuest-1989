import * as THREE from 'three';

// One fixed mesh, no texture or animation: retain a light, readable horizon.
export function createSky() {
  const geometry=new THREE.SphereGeometry(1,24,16);
  const positions=geometry.getAttribute('position');
  const colors=new Float32Array(positions.count*3);
  for(let i=0;i<positions.count;i++){
    const height=Math.max(0,positions.getY(i));
    const rise=Math.sqrt(height);
    // Give the upper sky a stronger blue lift while keeping the horizon nearly
    // white. The old, almost-flat gradient made every destination inherit the
    // same pale wash; this restrained separation lets each area's authored
    // colour and landmark silhouette read without another texture or draw.
    colors.set([1-.48*rise,1-.27*rise,1-.015*rise],i*3);
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
