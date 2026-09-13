import test from 'node:test';
import assert from 'node:assert/strict';
import { PUPPY_ARTWORK, PUPPY_ARTWORK_LAYOUTS, puppyArtworkUrl } from '../src/runner/puppy-artwork.js';

test('every collection puppy points at a shipped raster illustration', () => {
  assert.deepEqual(Object.keys(PUPPY_ARTWORK).sort(), ['biscuit', 'luna', 'mochi', 'pepper']);
  for (const path of Object.values(PUPPY_ARTWORK)) {
    assert.match(path, /^\.\/puppies\/[a-z]+\.webp$/);
  }
});

test('unknown puppy ids use the dependable starter artwork', () => {
  assert.equal(puppyArtworkUrl('missing'), PUPPY_ARTWORK.biscuit);
  assert.equal(puppyArtworkUrl(undefined), PUPPY_ARTWORK.biscuit);
});

test('every illustrated puppy exposes four animated raster legs and a tail crop', () => {
  for (const id of Object.keys(PUPPY_ARTWORK)) {
    const layout = PUPPY_ARTWORK_LAYOUTS[id];
    assert.ok(layout, `${id} has an artwork layout`);
    assert.equal(layout.legs.length, 4);
    assert.equal(layout.tail.crop.length, 4);
    for (const leg of layout.legs) {
      assert.equal(leg.crop.length, 4);
      assert.equal(leg.root.length, 2);
      assert.ok(leg.crop.every(value => value >= 0 && value <= 1));
      assert.ok(leg.root.every(value => value >= 0 && value <= 1));
    }
  }
});
