import test from 'node:test';
import assert from 'node:assert/strict';
import { createPuppyArtwork, PUPPY_ARTWORK, PUPPY_ARTWORK_LAYOUTS, puppyArtworkUrl } from '../src/runner/puppy-artwork.js';

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
    assert.equal(layout.body.face.length, 4);
    assert.equal(layout.body.head.length, 4);
    assert.equal(layout.body.root.length, 2);
    assert.equal(layout.body.ears.length, 2);
    assert.ok(layout.body.face.every(value => value >= 0 && value <= 1));
    assert.ok(layout.body.head.every(value => value >= 0 && value <= 1));
    assert.ok(layout.body.head[2] < .8 && layout.body.head[3] < .8, `${id} head crop trims source padding`);
    assert.ok(layout.body.root.every(value => value >= 0 && value <= 1));
    for (const ear of layout.body.ears) {
      assert.equal(ear.crop.length, 4);
      assert.equal(ear.root.length, 2);
      assert.ok(ear.crop.every(value => value >= 0 && value <= 1));
      assert.ok(ear.root.every(value => value >= 0 && value <= 1));
    }
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

test('the raster puppet exposes dedicated accessory layers for wardrobe art', () => {
  const artwork = createPuppyArtwork();
  assert.deepEqual(
    ['puppy-painted-accessories-back', 'puppy-painted-accessories-mid', 'puppy-painted-accessories-top'],
    artwork.group.children.filter(part => part.name.includes('accessories')).map(part => part.name),
  );
  assert.equal(typeof artwork.setCostume, 'function');
});
