import * as THREE from 'three';

// Grounded ends distinguish a duck-under branch from a low jump-over log.
// Builders reuse the renderer's shared geometry and material cache.
export function createBranchModel(box,ball) {
  const branch=new THREE.Group();
  for(const x of [-1.06,1.06]) {
    const support=ball(branch,'#493526',x,1.1,0,.10,1.1,.22);
    support.name='branch-support';
  }
  // Overlapping tapered limbs give this hazard a natural silhouette while
  // retaining the same clear duck-under opening and collision envelope.
  for(const [x,y,angle] of [[-.65,1.74,-.1],[0,1.78,.08],[.65,1.73,-.08]]){
    const limb=ball(branch,'#6c4b2e',x,y,0,.61,.4,.4);
    limb.rotation.z=angle;limb.name='branch-limb';
  }
  for(const x of [-.9,.6]){
    const foliage=ball(branch,'#4e744f',x,2.13,0,.35,.22,.32);
    foliage.userData.shadowDetail=true;
  }
  const band=box(branch,'#102b36',0,1.28,.43,1.8,.2,.08);
  band.userData.shadowDetail=true;
  for(const x of [-.72,.72]){
    const cue=box(branch,'#b3ffe7',x,1.3,.48,.2,.15,.04);
    cue.userData.shadowDetail=true;
  }
  return branch;
}
