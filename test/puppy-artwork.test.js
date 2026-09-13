import test from 'node:test';
import assert from 'node:assert/strict';
import { createPuppyArtwork, PUPPY_ARTWORK, PUPPY_ARTWORK_BOUNDS, PUPPY_ARTWORK_LAYOUTS, PUPPY_ARTWORK_VARIANTS, puppyArtworkUrl, puppyPoseArtworkUrl } from '../src/runner/puppy-artwork.js';

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

test('each puppy has complete raster stride, jump, slide, turn, and hang poses', () => {
  for (const id of Object.keys(PUPPY_ARTWORK)) {
    const variants = PUPPY_ARTWORK_VARIANTS[id];
    assert.equal(variants.idle, PUPPY_ARTWORK[id]);
    assert.match(variants.stride, /^\.\/puppies\/[a-z-]+\.webp$/);
    assert.match(variants.jump, /^\.\/puppies\/[a-z-]+\.webp$/);
    assert.match(variants.slide, /^\.\/puppies\/[a-z-]+\.webp$/);
    assert.match(variants.turn, /^\.\/puppies\/[a-z-]+\.webp$/);
    assert.match(variants.hang, /^\.\/puppies\/[a-z-]+\.webp$/);
    assert.notEqual(variants.stride, variants.idle);
    assert.notEqual(variants.jump, variants.idle);
    assert.notEqual(variants.slide, variants.idle);
    assert.notEqual(variants.turn, variants.idle);
    assert.notEqual(variants.hang, variants.idle);
    assert.notEqual(variants.stride, variants.turn);
    assert.notEqual(variants.jump, variants.stride);
    assert.notEqual(variants.slide, variants.stride);
    assert.notEqual(variants.jump, variants.slide);
    assert.notEqual(variants.hang, variants.stride);
    assert.notEqual(variants.hang, variants.jump);
    assert.notEqual(variants.hang, variants.slide);
    assert.notEqual(variants.hang, variants.turn);
    assert.equal(puppyPoseArtworkUrl(id, 'stride'), variants.stride);
    assert.equal(puppyPoseArtworkUrl(id, 'jump'), variants.jump);
    assert.equal(puppyPoseArtworkUrl(id, 'slide'), variants.slide);
    assert.equal(puppyPoseArtworkUrl(id, 'turn'), variants.turn);
    assert.equal(puppyPoseArtworkUrl(id, 'hang'), variants.hang);
  }
  assert.match(PUPPY_ARTWORK_VARIANTS.mochi.away, /^\.\/puppies\/mochi-away\.webp$/);
  assert.notEqual(PUPPY_ARTWORK_VARIANTS.mochi.away, PUPPY_ARTWORK_VARIANTS.mochi.idle);
  assert.equal(puppyPoseArtworkUrl('mochi', 'away'), PUPPY_ARTWORK_VARIANTS.mochi.away);
  assert.equal(puppyPoseArtworkUrl('missing', 'turn'), PUPPY_ARTWORK_VARIANTS.biscuit.turn);
});

test('pose paintings expose measured alpha bounds for stable frame swaps', () => {
  for (const id of Object.keys(PUPPY_ARTWORK)) {
    const frames = PUPPY_ARTWORK_BOUNDS[id];
    const expectedFrames = ['hang', 'idle', 'jump', 'slide', 'stride', 'turn'];
    if (id === 'mochi') expectedFrames.push('away');
    assert.deepEqual(Object.keys(frames).sort(), expectedFrames.sort());
    for (const [pose, frame] of Object.entries(frames)) {
      assert.ok(frame.width > 0 && frame.height > 0, `${id} ${pose} has canvas dimensions`);
      assert.ok(frame.x >= 0 && frame.y >= 0, `${id} ${pose} bounds start inside canvas`);
      assert.ok(frame.boxWidth > 0 && frame.boxHeight > 0, `${id} ${pose} has opaque area`);
      assert.ok(frame.x + frame.boxWidth <= frame.width, `${id} ${pose} width fits canvas`);
      assert.ok(frame.y + frame.boxHeight <= frame.height, `${id} ${pose} height fits canvas`);
    }
  }
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

test('the raster artwork exposes dedicated accessory layers for wardrobe art', () => {
  const artwork = createPuppyArtwork();
  assert.deepEqual(
    ['puppy-painted-accessories-back', 'puppy-painted-accessories-mid', 'puppy-painted-accessories-top'],
    artwork.group.children.filter(part => part.name.includes('accessories')).map(part => part.name),
  );
  assert.equal(typeof artwork.setCostume, 'function');
});

test('the visible runner stack uses complete idle, stride, jump, slide, turn and hang paintings', () => {
  const artwork = createPuppyArtwork();
  assert.deepEqual(
    ['puppy-painted-body', 'puppy-painted-stride-pose', 'puppy-painted-jump-pose', 'puppy-painted-slide-pose', 'puppy-painted-turn-pose', 'puppy-painted-hang-pose', 'puppy-painted-away-pose'],
    artwork.group.children.slice(0, 7).map(part => part.name),
  );
  assert.equal(typeof artwork.setPose, 'function');
});
