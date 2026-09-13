import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createClassicFur } from "../src/runner/classic-fur.js";
import { PUPPIES } from "../src/runner/collection.js";
import { puppyVisual } from "../src/runner/puppy-visuals.js";

const materialForColor = color => new THREE.MeshStandardMaterial({color});

test("classic fur stays instanced and deterministic for every selectable dog", () => {
  for (const id of ["biscuit", "pepper", "luna"]) {
    const first = createClassicFur(materialForColor);
    const second = createClassicFur(materialForColor);
    first.apply({visual: puppyVisual(id), puppy: PUPPIES[id]});
    second.apply({visual: puppyVisual(id), puppy: PUPPIES[id]});
    assert.equal(first.layers.length, 4);
    assert.ok(first.layers.every(layer => layer.isInstancedMesh));
    assert.ok(first.layers.every(layer => layer.count <= 150));
    for (let layerIndex = 0; layerIndex < first.layers.length; layerIndex++) {
      const a = first.layers[layerIndex].instanceMatrix.array;
      const b = second.layers[layerIndex].instanceMatrix.array;
      assert.deepEqual([...a], [...b]);
      assert.ok([...a].every(Number.isFinite));
    }
  }
});

