import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createMochiModel } from "../src/runner/mochi-model.js";

const finite = (values) => values.every(Number.isFinite);

function modelSnapshot(model) {
  const nodes = [];
  const instances = [];
  model.group.updateMatrixWorld(true);
  model.group.traverse((node) => {
    nodes.push({
      type: node.type,
      name: node.name,
      matrix: node.matrix.toArray(),
    });
    if (!node.isInstancedMesh) return;
    const matrix = new THREE.Matrix4();
    for (let index = 0; index < node.count; index++) {
      node.getMatrixAt(index, matrix);
      instances.push(matrix.toArray());
    }
  });
  return { nodes, instances };
}

test("Mochi exposes the articulated puppy contract used by the runner", () => {
  const model = createMochiModel();
  assert.ok(model.group instanceof THREE.Group);
  assert.match(model.group.name, /mochi/i);
  assert.equal(model.legs.length, 4);
  assert.equal(model.eyes.length, 2);
  assert.equal(model.ears.length, 2);
  assert.ok(model.tail instanceof THREE.Group);

  for (const [part, label] of [
    [model.legs, "leg"],
    [model.eyes, "eye"],
  ]) {
    for (const node of part) {
      assert.ok(node instanceof THREE.Group);
      assert.match(node.name, new RegExp(label, "i"));
    }
  }
  assert.match(model.tail.name, /tail/i);
  assert.deepEqual(model.ears.map(({ side }) => side), [-1, 1]);
  for (const { ear, side } of model.ears) {
    assert.ok(ear instanceof THREE.Group);
    assert.match(ear.name, /ear/i);
    assert.ok(side === -1 || side === 1);
  }

  // Animation code depends on the established LF/LR/RF/RR ordering.
  for (const [leg, side, end] of [
    [model.legs[0], "left", "front"],
    [model.legs[1], "left", "rear"],
    [model.legs[2], "right", "front"],
    [model.legs[3], "right", "rear"],
  ]) {
    assert.match(leg.name, new RegExp(`${side}.*${end}|${end}.*${side}`, "i"));
  }
});

test("Mochi's detailed coat stays finite, deterministic and mobile-bounded", () => {
  const first = createMochiModel();
  const second = createMochiModel();
  const a = modelSnapshot(first);
  const b = modelSnapshot(second);
  assert.deepEqual(a, b);

  assert.ok(a.nodes.length > 10);
  assert.ok(a.nodes.length <= 80, `model node budget regressed to ${a.nodes.length}`);
  assert.ok(a.nodes.every(({ matrix }) => finite(matrix)));
  assert.ok(a.instances.length > 0, "curly coat should use instancing");
  assert.ok(a.instances.length <= 4000, "curly coat instance budget regressed");
  assert.ok(a.instances.every(finite));

  const geometries = new Set(), textures = new Set();
  let meshes = 0, triangles = 0;
  first.group.traverse((node) => {
    if (node.isMesh) {
      meshes++;
      geometries.add(node.geometry.uuid);
      triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3 * (node.isInstancedMesh ? node.count : 1);
      for (const texture of [node.material.map, node.material.bumpMap]) if (texture) textures.add(texture);
    }
  });
  assert.ok(meshes <= 64, `model mesh budget regressed to ${meshes}`);
  assert.ok(geometries.size <= 4, `expected shared geometry, found ${geometries.size}`);
  assert.ok(triangles < 100000, `model triangle budget regressed to ${triangles}`);
  assert.equal(textures.size, 2, 'undercoat and hair should share two small procedural textures');
  for (const texture of textures) {
    assert.ok(texture.isDataTexture, 'the reference photo must not become a runtime dependency');
    assert.ok(texture.image.width <= 128 && texture.image.height <= 128);
    assert.equal(texture.image.data.length, texture.image.width * texture.image.height * 4);
  }
});

test("separate Mochi models can animate independently", () => {
  const first = createMochiModel();
  const second = createMochiModel();
  const before = modelSnapshot(second);

  first.group.position.x = 3;
  first.legs[0].rotation.x = -0.7;
  first.eyes[0].scale.y = 0.2;
  first.ears[0].ear.rotation.x = 0.4;
  first.tail.rotation.z = 0.8;

  assert.deepEqual(modelSnapshot(second), before);
});
