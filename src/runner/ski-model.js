import * as THREE from 'three';

// A light-weight ski rig that sits under the painted puppy. The skis and poles
// give the new pose a clear silhouette without turning the dog into another
// procedural character. Everything uses the renderer's shared rounded box
// geometry, so mobile devices get one small, reusable model.
export function createSkiModel(mesh, boxGeometry) {
  const group = new THREE.Group();
  group.name = 'frostpeak-skis';

  const skis = [];
  const skiTips = [];
  const bindings = [];
  for (const side of [-1, 1]) {
    const ski = mesh(group, boxGeometry, '#eaf8ff', side * .46, .07, .06, .16, .07, 2.35);
    ski.userData.side = side;
    ski.userData.baseY = .07;
    ski.castShadow = true;
    skis.push(ski);
    const binding = mesh(group, boxGeometry, '#3f7190', side * .46, .15, -.1, .24, .10, .42);
    binding.userData.side = side;
    binding.userData.baseY = .15;
    bindings.push(binding);
    const tip = mesh(group, boxGeometry, '#b9e8f3', side * .46, .105, -1.16, .17, .09, .28);
    tip.rotation.x = side * .05;
    tip.userData.side = side;
    tip.userData.baseRotation = tip.rotation.x;
    tip.name = 'ski-tip';
    tip.castShadow = true;
    skiTips.push(tip);
    // A thin colored runner along each ski makes the two boards readable
    // against the white slope and gives the player a clear bank reference.
    const runner = mesh(group, boxGeometry, '#4e9db0', side * .46, .115, .05, .055, .025, 2.1);
    runner.name = 'ski-runner';
  }

  const poles = [];
  for (const side of [-1, 1]) {
    const pole = mesh(group, boxGeometry, '#d9eff5', side * .82, .64, -.08, .055, .055, 1.1);
    pole.rotation.x = side * .16;
    pole.userData.side = side;
    pole.userData.baseRotation = pole.rotation.x;
    poles.push(pole);
    mesh(group, boxGeometry, '#ec9e64', side * .82, 1.2, -.14, .16, .08, .18);
  }

  // A few translucent powder flecks animate behind the skis on a descent.
  const spray = [];
  for (let index = 0; index < 5; index++) {
    const flake = mesh(group, boxGeometry, '#c8efff', (index - 2) * .28, .11, .92 + index * .18,
      .06, .035, .12);
    flake.userData.index = index;
    flake.material = flake.material.clone();
    flake.material.transparent = true;
    flake.material.opacity = .62;
    flake.material.depthWrite = false;
    spray.push(flake);
  }

  group.userData.skis = skis;
  group.userData.skiTips = skiTips;
  group.userData.bindings = bindings;
  group.userData.poles = poles;
  group.userData.spray = spray;
  group.traverse(part => {
    if (part.isMesh) part.receiveShadow = true;
  });
  group.visible = false;
  return group;
}
