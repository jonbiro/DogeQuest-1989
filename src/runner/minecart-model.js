import * as THREE from 'three';

// A compact, rounded cart keeps the mine-cart beat visually distinct without
// adding another texture or a second renderer. The rails and four wheels give
// the puppy a clear place to sit, while the warm lantern reads at the small
// chase-camera scale used on phones.
export function createMinecartModel(mesh, boxGeometry, trunkGeometry) {
  const group = new THREE.Group();
  group.name = 'mine-cart';

  const body = mesh(group, boxGeometry, '#6d4934', 0, -.20, 0, 5.7, .72, 2.25);
  body.castShadow = true;
  mesh(group, boxGeometry, '#9a6a3f', 0, .20, -.08, 5.15, .18, 2.02);
  mesh(group, boxGeometry, '#f2c56d', 0, .43, -.92, 5.25, .10, .14);
  mesh(group, boxGeometry, '#f2c56d', 0, .43, .92, 5.25, .10, .14);
  // A low front lip and two chunky corner guards make the silhouette readable
  // from the elevated camera without hiding the dog's legs.
  mesh(group, boxGeometry, '#4c342b', 0, .12, -1.12, 5.35, .55, .16);
  for (const x of [-2.55, 2.55]) {
    mesh(group, boxGeometry, '#d3954e', x, .28, -.98, .24, .48, .20);
    mesh(group, boxGeometry, '#d3954e', x, .28, .98, .24, .48, .20);
  }

  const wheels = [];
  for (const x of [-2.85, 2.85]) {
    for (const z of [-.78, .78]) {
      const wheel = mesh(group, trunkGeometry, '#302a2b', x, -.62, z, .30, .26, .30);
      wheel.rotation.z = Math.PI / 2;
      wheel.userData.baseRotation = wheel.rotation.z;
      wheel.userData.side = x < 0 ? -1 : 1;
      wheels.push(wheel);
      mesh(group, trunkGeometry, '#e0a24f', x + (x < 0 ? -.03 : .03), -.62, z,
        .12, .28, .12).rotation.z = Math.PI / 2;
    }
  }
  group.userData.wheels = wheels;

  // Two slim rails sit just below the cart. They are intentionally shorter
  // than the cart body so they do not become a collision cue of their own.
  for (const x of [-2.25, 2.25])
    mesh(group, boxGeometry, '#5c493d', x, -.84, 0, .12, .08, 3.2);
  for (const z of [-1.20, 0, 1.20])
    mesh(group, boxGeometry, '#7c583a', 0, -.90, z, 6.2, .08, .16);

  const lantern = new THREE.Group();
  lantern.position.set(0, .78, -1.16);
  mesh(lantern, boxGeometry, '#4c342b', 0, 0, 0, .34, .18, .25);
  const glow = mesh(lantern, boxGeometry, '#ffd86c', 0, -.05, -.14, .20, .20, .08);
  glow.userData.lantern = true;
  group.add(lantern);
  group.userData.lantern = lantern;

  group.traverse(part => {
    if (part.isMesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });
  group.visible = false;
  return group;
}
