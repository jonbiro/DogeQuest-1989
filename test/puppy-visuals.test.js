import test from "node:test";
import assert from "node:assert/strict";
import { PUPPIES } from "../src/runner/collection.js";
import { PUPPY_VISUALS, puppyVisual } from "../src/runner/puppy-visuals.js";

const vectorFields = [
  "bodyScale", "shoulderScale", "headScale", "muzzleScale", "legScale",
  "earScale", "tailScale", "eyeScale",
];

test("every selectable classic puppy has a finite, distinct visual profile", () => {
  const ids = Object.keys(PUPPIES).filter(id => id !== "mochi");
  assert.deepEqual(Object.keys(PUPPY_VISUALS).sort(), ids.sort());
  const silhouettes = new Set();
  for (const id of ids) {
    const visual = puppyVisual(id);
    for (const field of vectorFields) {
      assert.equal(visual[field].length, 3);
      assert.ok(visual[field].every(value => Number.isFinite(value) && value > 0), `${id}.${field}`);
    }
    assert.ok(Number.isFinite(visual.legY) && visual.legY > 0);
    assert.ok(Number.isFinite(visual.earY) && Number.isFinite(visual.eyeY));
    silhouettes.add([
      ...visual.bodyScale,
      ...visual.headScale,
      ...visual.legScale,
      visual.earSpread,
      visual.tailScale[1],
    ].join(":"));
  }
  assert.equal(silhouettes.size, ids.length);
  assert.equal(puppyVisual("unknown"), PUPPY_VISUALS.biscuit);
});

test("breed profiles expose readable face and marking signatures", () => {
  assert.equal(PUPPY_VISUALS.biscuit.marking, "none");
  assert.equal(PUPPY_VISUALS.pepper.marking, "spots");
  assert.equal(PUPPY_VISUALS.luna.marking, "mask");
  assert.notEqual(PUPPY_VISUALS.biscuit.eyeColor, PUPPY_VISUALS.pepper.eyeColor);
  assert.notEqual(PUPPY_VISUALS.pepper.eyeColor, PUPPY_VISUALS.luna.eyeColor);
  assert.match(PUPPY_VISUALS.luna.eyeColor, /^#[0-9a-f]{6}$/i);
});
