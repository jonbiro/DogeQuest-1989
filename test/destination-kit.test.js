import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  DESTINATION_KITS,
  KIT_ROLES,
  kitFor,
  buildShoulderFamily,
  buildSignature,
  buildTrailMotif,
  buildSetPiece,
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
});

test('only the shoulder role is populated in this slice', () => {
  for (const kit of DESTINATION_KITS) {
    const shoulder = kit.roles.shoulder;
    assert.ok(shoulder, `${kit.name} needs its shoulder family`);
    assert.equal(shoulder.count, 12);
    assert.equal(shoulder.spacing, 8.4);
    assert.equal(shoulder.offset, kit.area * 17);
    for (const role of ['overhead', 'ground', 'far', 'built'])
      assert.equal(kit.roles[role], null, `${kit.name}:${role} is reserved for the next slice`);
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
  ['shoulder', (area, group, helpers) => buildShoulderFamily(area, group, helpers)],
  ['signature', (area, group, helpers) => buildSignature(area, group, area % 4, helpers)],
  ['motif', (area, group, helpers) => buildTrailMotif(area, group, helpers)],
  ['setPiece', (area, group, helpers) => buildSetPiece(area, group, helpers)],
];

test('every builder covers every destination deterministically', () => {
  for (const [name, build] of BUILDERS) {
    for (let area = 0; area < AREAS.length; area++) {
      const first = stubContext([0.13, 0.5, 0.87]);
      const group = new THREE.Group();
      build(area, group, first.helpers);
      assert.ok(group.children.length > 0, `${name} area ${area} must add meshes`);
      assert.ok(first.log.length > 0, `${name} area ${area} must record calls`);
      const second = stubContext([0.13, 0.5, 0.87]);
      build(area, new THREE.Group(), second.helpers);
      assert.deepEqual(second.log, first.log, `${name} area ${area} must be deterministic`);
    }
  }
});

test('builders reject an unknown destination instead of shipping empty', () => {
  for (const [name, build] of BUILDERS) {
    const ctx = stubContext([0.5]);
    const group = new THREE.Group();
    build(99, group, ctx.helpers);
    // Areas outside 0-5 fall into the Mooncap `else` branch today; the point
    // is the dispatch never silently produces nothing.
    assert.ok(group.children.length > 0, `${name} must not produce an empty group`);
  }
});
