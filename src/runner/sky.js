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
  // A seeded star dome for the starlit mood. Positions are pure index math
  // (no RNG import, no coupling), the material starts fully transparent, and
  // the renderer drives opacity from the starlit blend only. Stars are sky
  // dressing: fog-exempt points that never touch gameplay lighting.
  const starCount=140;
  const starPositions=new Float32Array(starCount*3);
  for(let i=0;i<starCount;i++){
    const a=((i*137.5)%360)*Math.PI/180;
    const e=(0.18+((i*89)%70)/100)*Math.PI/2;
    const r=.94;
    starPositions[i*3]=Math.cos(a)*Math.cos(e)*r;
    starPositions[i*3+1]=Math.sin(e)*r;
    starPositions[i*3+2]=-Math.abs(Math.sin(a)*Math.cos(e)*r)-.02;
  }
  const starGeometry=new THREE.BufferGeometry();
  starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
  const starMaterial=new THREE.PointsMaterial({color:'#f4f1de',size:1.6,sizeAttenuation:false,
    transparent:true,opacity:0,fog:false,toneMapped:false,depthWrite:false});
  const stars=new THREE.Points(starGeometry,starMaterial);
  stars.name='mood-stars';
  stars.frustumCulled=false;
  stars.renderOrder=-.5;
  sky.add(stars);
  return sky;
}
