import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  DESTINATION_KITS,
  KIT_ROLES,
  kitFor,
  sideFor,
  buildShoulderFamily,
  buildSignature,
  buildTrailMotif,
  buildSetPiece,
  buildOverhead,
  buildGround,
  buildFar,
  buildBuilt,
} from '../src/runner/destination-kit.js';
import {AREAS} from '../src/runner/areas.js';

test('all six destinations declare every kit role', () => {
  assert.deepEqual([...KIT_ROLES], ['shoulder', 'overhead', 'ground', 'far', 'built']);
  assert.equal(DESTINATION_KITS.length, AREAS.length);
  for (const kit of DESTINATION_KITS) {
    assert.deepEqual(Object.keys(kit.roles).sort(), [...KIT_ROLES].sort(), `${kit.name} must declare every role`);
    assert.equal(kitFor(kit.area), kit);
  }
  assert.equal(kitFor(99), null);
  assert.equal(sideFor(0, 0), -1);
  assert.equal(sideFor(0, 1), 1);
  assert.equal(sideFor(1, 0), 1);
});

test('every role carries bounded placement parameters', () => {
  const counts = {shoulder: 12, overhead: 3, ground: 8, far: 3, built: 3};
  for (const kit of DESTINATION_KITS) {
    for (const role of KIT_ROLES) {
      const slot = kit.roles[role];
      assert.ok(slot, `${kit.name}:${role} must be populated`);
      assert.equal(slot.count, counts[role], `${kit.name}:${role} count`);
      assert.ok(Number.isFinite(slot.spacing) && slot.spacing > 0, `${kit.name}:${role} spacing`);
      assert.ok(Number.isFinite(slot.offset), `${kit.name}:${role} offset`);
      if (role !== 'shoulder') assert.ok(Number.isInteger(slot.variant), `${kit.name}:${role} variant`);
    }
  }
});

// Stub helpers record mesh calls without a renderer. Builders must stay pure
// construction: same stub random in, same recorded calls out.
function stubContext(sequence) {
  let calls = 0;
  const calls_log = [];
  const random = () => sequence[(calls++) % sequence.length];
  const mesh = (parent, geometry, color, x, y, z, sx, sy, sz) => {
    calls_log.push(['mesh', color, x, y, z, sx, sy, sz]);
    const item = new THREE.Object3D();
    item.position.set(x, y, z);
    item.scale.set(sx, sy, sz);
    parent.add(item);
    return item;
  };
  const simple = (kind) => (parent, color, x, y, z, sx, sy, sz) => {
    calls_log.push([kind, color, x, y, z, sx, sy, sz]);
    return mesh(parent, {}, color, x, y, z, sx, sy, sz);
  };
  return {
    helpers: {
      box: simple('box'),
      ball: simple('ball'),
      cone: simple('cone'),
      mesh,
      trunkGeometry: 'trunk',
      palmFrondGeometry: 'palm',
      featheredPalmGeometry: 'feather',
      mushroomCapGeometry: 'cap',
      addBambooLeaves: (parent, geometry, meshFn, x, height) => {
        calls_log.push(['leaves', x, height]);
      },
      random,
    },
    log: calls_log,
  };
}

const BUILDERS = [
  ['shoulder', 1, (area, group, helpers, index) => buildShoulderFamily(area, group, helpers)],
  ['signature', 1, (area, group, helpers, index) => buildSignature(area, group, area % 4, helpers)],
  ['motif', 1, (area, group, helpers, index) => buildTrailMotif(area, group, helpers)],
  ['setPiece', 1, (area, group, helpers, index) => buildSetPiece(area, group, helpers)],
  ['overhead', 3, (area, group, helpers, index) => buildOverhead(area, group, index, helpers)],
  ['ground', 1, (area, group, helpers, index) => buildGround(area, group, helpers)],
  ['far', 1, (area, group, helpers, index) => buildFar(area, group, helpers)],
  ['built', 3, (area, group, helpers, index) => buildBuilt(area, group, index, helpers)],
];

test('every builder covers every destination deterministically', () => {
  for (const [name, variants, build] of BUILDERS) {
    for (let area = 0; area < AREAS.length; area++) {
      for (let index = 0; index < variants; index++) {
        const first = stubContext([0.13, 0.5, 0.87]);
        const group = new THREE.Group();
        build(area, group, first.helpers, index);
        assert.ok(group.children.length > 0, `${name} area ${area} index ${index} must add meshes`);
        assert.ok(first.log.length > 0, `${name} area ${area} index ${index} must record calls`);
        const second = stubContext([0.13, 0.5, 0.87]);
        build(area, new THREE.Group(), second.helpers, index);
        assert.deepEqual(second.log, first.log, `${name} area ${area} index ${index} must be deterministic`);
      }
    }
  }
});

function tops(log) {
  // Approximate top per recorded mesh call: center y plus half the y extent.
  // Leaves entries carry no extent and are ignored here.
  return log.filter(entry => entry.length === 8).map(entry => entry[3] + entry[6] / 2);
}

test('roles keep their vertical identities', () => {
  for (let area = 0; area < AREAS.length; area++) {
    const ground = stubContext([0.5]);
    buildGround(area, new THREE.Group(), ground.helpers);
    assert.ok(Math.max(...tops(ground.log)) <= 0.8, `area ${area} ground clutter must stay low`);
    const overhead = stubContext([0.5]);
    buildOverhead(area, new THREE.Group(), 0, overhead.helpers);
    assert.ok(Math.max(...tops(overhead.log)) >= 3.5, `area ${area} overhead must rise high`);
    const far = stubContext([0.5]);
    buildFar(area, new THREE.Group(), far.helpers);
    assert.ok(Math.max(...tops(far.log)) >= 5, `area ${area} far band must read at distance`);
    for (let index = 0; index < 3; index++) {
      const built = stubContext([0.5]);
      buildBuilt(area, new THREE.Group(), index, built.helpers);
      assert.ok(Math.max(...tops(built.log)) <= 3.2, `area ${area} built piece ${index} must stay below cues`);
    }
  }
});

test('builders reject an unknown destination instead of shipping empty', () => {
  for (const [name, , build] of BUILDERS) {
    const ctx = stubContext([0.5]);
    const group = new THREE.Group();
    build(99, group, ctx.helpers, 0);
    // Areas outside 0-5 fall into the Mooncap `else` branch today; the point
    // is the dispatch never silently produces nothing.
    assert.ok(group.children.length > 0, `${name} must not produce an empty group`);
  }
});
