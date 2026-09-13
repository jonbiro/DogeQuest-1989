import * as THREE from "three";

// The classic rigs deliberately use a handful of large, smooth coat volumes.
// They overlap the base anatomy just enough to soften the silhouette without
// turning each puppy into a stack of faceted beads or transparent hair cards.
const dummy = new THREE.Object3D();
const tint = new THREE.Color();

function variantColor(base, index, spread = .025) {
  tint.set(base);
  tint.offsetHSL(0, 0, ((index * 17) % 7 - 3) * spread / 3);
  return tint;
}

function place(mesh, index, position, scale, color) {
  dummy.position.set(...position);
  dummy.quaternion.identity();
  dummy.scale.set(...scale);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
  mesh.setColorAt(index, variantColor(color, index));
}

function hide(mesh, index, color) {
  dummy.position.set(0, -20, 0);
  dummy.quaternion.identity();
  dummy.scale.setScalar(0);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
  mesh.setColorAt(index, variantColor(color, index));
}

function finish(mesh) {
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
}

function scaledOffset(center, axes, offset) {
  return [
    center[0] + offset[0] * axes[0],
    center[1] + offset[1] * axes[1],
    center[2] + offset[2] * axes[2],
  ];
}

function scaledSize(size, scale) {
  return [size[0] * scale[0], size[1] * scale[1], size[2] * scale[2]];
}

const BODY_PUFFS = [
  {offset: [-.82, .15, -.08], size: [.21, .26, .28]},
  {offset: [.82, .15, -.08], size: [.21, .26, .28]},
  {offset: [-.79, -.30, -.10], size: [.20, .23, .27]},
  {offset: [.79, -.30, -.10], size: [.20, .23, .27]},
  {offset: [-.56, .57, .04], size: [.25, .18, .24]},
  {offset: [.56, .57, .04], size: [.25, .18, .24]},
  {offset: [-.52, -.58, -.18], size: [.24, .17, .22]},
  {offset: [.52, -.58, -.18], size: [.24, .17, .22]},
  {offset: [-.54, .04, -.70], size: [.18, .23, .17]},
  {offset: [.54, .04, -.70], size: [.18, .23, .17]},
  {offset: [0, .63, .34], size: [.34, .17, .22]},
  {offset: [0, -.48, .40], size: [.32, .15, .22]},
];

const SHOULDER_PUFFS = [
  {offset: [-.77, .34, -.08], size: [.21, .20, .22]},
  {offset: [.77, .34, -.08], size: [.21, .20, .22]},
  {offset: [-.82, -.12, -.20], size: [.18, .22, .18]},
  {offset: [.82, -.12, -.20], size: [.18, .22, .18]},
  {offset: [-.50, .60, -.04], size: [.22, .16, .20]},
  {offset: [.50, .60, -.04], size: [.22, .16, .20]},
];

// Keep the center of the face open so the eyes, brows, muzzle and tongue stay
// readable at the small sizes used by the runner and collection cards.
const HEAD_PUFFS = [
  {offset: [-.70, .67, .05], size: [.19, .17, .19]},
  {offset: [0, .78, .08], size: [.22, .15, .20]},
  {offset: [.70, .67, .05], size: [.19, .17, .19]},
  {offset: [-.86, .34, -.02], size: [.17, .23, .18]},
  {offset: [.86, .34, -.02], size: [.17, .23, .18]},
  {offset: [-.90, -.06, -.04], size: [.16, .22, .18]},
  {offset: [.90, -.06, -.04], size: [.16, .22, .18]},
  {offset: [-.74, -.39, -.06], size: [.19, .18, .17]},
  {offset: [.74, -.39, -.06], size: [.19, .18, .17]},
  {offset: [-.40, .72, .02], size: [.18, .14, .18]},
  {offset: [.40, .72, .02], size: [.18, .14, .18]},
  {offset: [0, -.58, -.12], size: [.22, .13, .16], color: "muzzle"},
];

function legPuffs(visual) {
  const entries = [];
  for (const x of [-.29, .29]) {
    for (const z of [-.34, .64]) {
      entries.push(
        {position: [x, visual.legY - .18, z], size: [.17, .22, .18]},
        {position: [x, visual.legY - .46, z - .05], size: [.19, .15, .21], color: "paws"},
      );
    }
  }
  return entries;
}

function rotatedTailPosition(visual, offset) {
  const c = Math.cos(visual.tailTilt), s = Math.sin(visual.tailTilt);
  return [
    visual.tailPosition[0] + offset[0],
    visual.tailPosition[1] + offset[1] * c - offset[2] * s,
    visual.tailPosition[2] + offset[1] * s + offset[2] * c,
  ];
}

export function createClassicFur(materialForColor) {
  const group = new THREE.Group();
  group.name = "classic-soft-fur";

  // A moderately tessellated sphere keeps the puffs round on high-density
  // phones while staying much cheaper than a bespoke mesh for every lock.
  const geometry = new THREE.SphereGeometry(1, 20, 14);
  geometry.computeVertexNormals();
  const material = materialForColor("#ffffff");
  const body = new THREE.InstancedMesh(geometry, material, 20);
  const head = new THREE.InstancedMesh(geometry, material, 16);
  const legs = new THREE.InstancedMesh(geometry, material, 8);
  const tail = new THREE.InstancedMesh(geometry, material, 6);
  const layers = [body, head, legs, tail];
  layers.forEach(layer => {
    layer.capacity = layer.count;
    layer.castShadow = true;
    layer.receiveShadow = true;
    group.add(layer);
  });

  function apply({visual, puppy}) {
    const bodyAxes = [
      .47 * visual.bodyScale[0] + .035,
      .40 * visual.bodyScale[1] + .035,
      .88 * visual.bodyScale[2] + .035,
    ];
    const shoulderAxes = [
      .37 * visual.shoulderScale[0] + .025,
      .40 * visual.shoulderScale[1] + .025,
      .35 * visual.shoulderScale[2] + .025,
    ];
    const bodyEntries = BODY_PUFFS.map(puff => ({
      position: scaledOffset(visual.bodyPosition, bodyAxes, puff.offset),
      size: scaledSize(puff.size, visual.bodyScale),
      color: puppy.fur,
    }));
    SHOULDER_PUFFS.slice(0, body.capacity - bodyEntries.length).forEach(puff => {
      bodyEntries.push({
        position: scaledOffset(visual.shoulderPosition, shoulderAxes, puff.offset),
        size: scaledSize(puff.size, visual.shoulderScale),
        color: puppy.fur,
      });
    });
    for (let index = 0; index < body.capacity; index++) {
      const entry = bodyEntries[index];
      if (entry) place(body, index, entry.position, entry.size, entry.color);
      else hide(body, index, puppy.fur);
    }
    finish(body);

    const headAxes = [
      .49 * visual.headScale[0] + .028,
      .46 * visual.headScale[1] + .028,
      .54 * visual.headScale[2] + .028,
    ];
    for (let index = 0; index < head.capacity; index++) {
      const entry = HEAD_PUFFS[index];
      if (!entry) {
        hide(head, index, puppy.head);
        continue;
      }
      place(
        head,
        index,
        scaledOffset(visual.headPosition, headAxes, entry.offset),
        scaledSize(entry.size, visual.headScale),
        entry.color === "muzzle" ? puppy.muzzle : puppy.head,
      );
    }
    finish(head);

    const legEntries = legPuffs(visual);
    for (let index = 0; index < legs.capacity; index++) {
      const entry = legEntries[index];
      if (entry) {
        const scale = entry.color === "paws"
          ? visual.legScale.map(value => value * .98)
          : visual.legScale;
        place(
          legs,
          index,
          entry.position,
          scaledSize(entry.size, scale),
          entry.color === "paws" ? puppy.paws : puppy.fur,
        );
      } else hide(legs, index, puppy.fur);
    }
    finish(legs);

    const tailEntries = [
      {offset: [-.03, .16, .16], size: [.20, .20, .18]},
      {offset: [.04, .35, .16], size: [.20, .22, .18]},
      {offset: [-.02, .54, .15], size: [.18, .19, .17]},
      {offset: [.04, .70, .13], size: [.16, .16, .16]},
    ];
    for (let index = 0; index < tail.capacity; index++) {
      const entry = tailEntries[index];
      if (entry) {
        place(
          tail,
          index,
          rotatedTailPosition(visual, entry.offset),
          scaledSize(entry.size, visual.tailScale),
          puppy.fur,
        );
      } else hide(tail, index, puppy.fur);
    }
    finish(tail);
  }

  return {group, apply, layers, geometry};
}
