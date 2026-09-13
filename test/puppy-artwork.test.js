import test from 'node:test';
import assert from 'node:assert/strict';
import { PUPPY_ARTWORK, puppyArtworkUrl } from '../src/runner/puppy-artwork.js';

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
