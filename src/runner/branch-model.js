import * as THREE from 'three';

// Grounded ends distinguish a duck-under branch from a low jump-over log.
// Builders reuse the renderer's shared geometry and material cache.
export function createBranchModel(box,ball) {
  const branch=new THREE.Group();
  for(const x of [-1.06,1.06]) {
    const support=box(branch,'#493526',x,1.1,0,.16,2.2,.32);
    support.name='branch-support';
  }
  box(branch,'#6c4b2e',0,1.7,0,2.3,.8,.8);
  for(const x of [-.9,.6])ball(branch,'#4e744f',x,2.13,0,.35,.22,.32);
  box(branch,'#102b36',0,1.28,.43,1.8,.2,.08);
  for(const x of [-.72,.72])box(branch,'#b3ffe7',x,1.3,.48,.2,.15,.04);
  return branch;
}
