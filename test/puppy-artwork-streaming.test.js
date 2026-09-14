import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {createPuppyArtwork, puppyPoseArtworkUrl} from '../src/runner/puppy-artwork.js';
import {DEFAULT_PUPPY} from '../src/runner/collection.js';

// A loader that records every request and never completes one. Holding the
// callbacks pending reproduces the real boot window: for the first frames
// after apply(), no pose sprite has a decoded map yet, which is precisely when
// the readiness cascade used to fire a download for every action painting.
function recordingLoader() {
  const requested = [];
  const pending = [];
  return {
    requested,
    pending,
    load(url, onLoad) {
      requested.push(url);
      const texture = new THREE.Texture();
      pending.push({url, onLoad, texture});
      return texture;
    },
  };
}

function poseNames(requested) {
  return requested.map(url => url.replace('./puppies/', '').replace('.webp', ''));
}

test('a puppy on the menu streams only its idle and stride paintings', () => {
  const loader = recordingLoader();
  const artwork = createPuppyArtwork({mobile: true, loader});
  artwork.apply(DEFAULT_PUPPY);
  // Several menu frames, with no physics asking for an action silhouette. The
  // idle texture is deliberately left undecoded so the fallback chain runs.
  for (let i = 0; i < 12; i++) artwork.setPose({time: i * .05, menu: true});
  const names = poseNames(loader.requested);
  assert.deepEqual([...new Set(names)].sort(), ['mochi', 'mochi-run-side']);
  for (const pose of ['jump', 'slide', 'turn', 'hang', 'away']) {
    assert.ok(
      !loader.requested.includes(puppyPoseArtworkUrl(DEFAULT_PUPPY, pose)),
      `the menu must not download the ${pose} painting`,
    );
  }
});

test('an undecoded idle painting never makes the fallback chain fetch action art', () => {
  const loader = recordingLoader();
  const artwork = createPuppyArtwork({mobile: true, loader});
  artwork.apply(DEFAULT_PUPPY);
  // A slow first paint: many frames of ordinary ground running while nothing
  // has decoded. The dog is not airborne, sliding, hanging or turning, so the
  // only silhouettes the physics wants are the ground ones.
  for (let i = 0; i < 40; i++) artwork.setPose({time: i * .05, away: true});
  const names = new Set(poseNames(loader.requested));
  assert.ok(!names.has('mochi-jump'), 'a grounded run must not fetch the jump painting');
  assert.ok(!names.has('mochi-slide'), 'a grounded run must not fetch the slide painting');
  assert.ok(!names.has('mochi-hang'), 'a grounded run must not fetch the hang painting');
});

test('each action painting is fetched when, and only when, the physics asks for it', () => {
  for (const [pose, options] of [
    ['jump', {airborne: true}],
    ['slide', {sliding: true}],
    ['hang', {hanging: true}],
  ]) {
    const loader = recordingLoader();
    const artwork = createPuppyArtwork({mobile: true, loader});
    artwork.apply(DEFAULT_PUPPY);
    const url = puppyPoseArtworkUrl(DEFAULT_PUPPY, pose);
    artwork.setPose({time: .1, menu: true});
    assert.ok(!loader.requested.includes(url), `${pose} is not fetched before it is needed`);
    artwork.setPose({time: .2, ...options});
    assert.ok(loader.requested.includes(url), `${pose} is fetched as soon as the physics needs it`);
  }
});

test('repeated frames never re-request a painting that is already in flight', () => {
  const loader = recordingLoader();
  const artwork = createPuppyArtwork({mobile: true, loader});
  artwork.apply(DEFAULT_PUPPY);
  for (let i = 0; i < 60; i++) artwork.setPose({time: i * .05, airborne: true});
  const jumpUrl = puppyPoseArtworkUrl(DEFAULT_PUPPY, 'jump');
  assert.equal(loader.requested.filter(url => url === jumpUrl).length, 1);
  // The whole boot sequence stays inside a small, bounded number of textures.
  assert.ok(new Set(loader.requested).size <= 4,
    `startup requested ${new Set(loader.requested).size} paintings: ${[...new Set(poseNames(loader.requested))]}`);
});

test('an unknown saved puppy renders the collection default, not another starter', () => {
  const loader = recordingLoader();
  const artwork = createPuppyArtwork({loader});
  assert.equal(artwork.apply('not-a-real-dog'), DEFAULT_PUPPY);
  assert.equal(artwork.apply(undefined), DEFAULT_PUPPY);
  assert.ok(loader.requested.every(url => url.includes(DEFAULT_PUPPY)),
    `a damaged save must only load ${DEFAULT_PUPPY} art, got ${poseNames(loader.requested)}`);
});

// A loader whose requests can be completed on demand with a decoded image of a
// known size, so pose activation can be driven deterministically.
function decodingLoader(size = 1254) {
  const requested = [];
  const byUrl = new Map();
  return {
    requested,
    load(url, onLoad) {
      requested.push(url);
      const texture = new THREE.Texture();
      texture.image = {width: size, height: size};
      byUrl.set(url, {texture, onLoad});
      return texture;
    },
    decode(url) {
      const entry = byUrl.get(url);
      if (!entry) throw new Error(`nothing requested ${url}`);
      entry.onLoad?.(entry.texture);
      return entry.texture;
    },
  };
}

test('the rear chase painting keeps one authored direction through a whole gait cycle', () => {
  const loader = decodingLoader();
  const artwork = createPuppyArtwork({loader});
  artwork.apply(DEFAULT_PUPPY);
  const awayUrl = puppyPoseArtworkUrl(DEFAULT_PUPPY, 'away');
  artwork.setPose({time: 0, away: true});
  loader.decode(awayUrl);
  const sprite = artwork.group.children.find(part => part.name === 'puppy-painted-away-pose');
  assert.ok(sprite, 'the rear chase sprite exists');
  const signs = new Set();
  let active = 0;
  // The ground cadence is 8.4 rad/s, so this spans several footfalls. The
  // painting is asymmetric -- head tucked to one side, tail plume to the other
  // -- so mirroring it per footfall snapped the head across the body about
  // three times a second instead of reading as a tail sweep.
  for (let time = 0; time < 3; time += 1 / 60) {
    artwork.setPose({time, away: true});
    if (!sprite.visible) continue;
    active++;
    signs.add(Math.sign(sprite.scale.x));
  }
  assert.ok(active > 100, `the rear painting should stay active, saw ${active} frames`);
  assert.deepEqual([...signs], [1], 'the rear painting must never mirror mid-run');
});

test('the rear chase painting still carries the gait as rotation and sway', () => {
  const loader = decodingLoader();
  const artwork = createPuppyArtwork({loader});
  artwork.apply(DEFAULT_PUPPY);
  artwork.setPose({time: 0, away: true});
  loader.decode(puppyPoseArtworkUrl(DEFAULT_PUPPY, 'away'));
  const sprite = artwork.group.children.find(part => part.name === 'puppy-painted-away-pose');
  const rotations = new Set(), offsets = new Set();
  for (let time = 0; time < 1; time += 1 / 60) {
    artwork.setPose({time, away: true});
    if (!sprite.visible) continue;
    rotations.add(Math.round(sprite.material.rotation * 1e4));
    offsets.add(Math.round(sprite.position.x * 1e4));
  }
  // Removing the hard mirror must not leave a rigid, frozen sprite.
  assert.ok(rotations.size > 5, 'the rear painting keeps a live gait rotation');
  assert.ok(offsets.size > 5, 'the rear painting keeps a live gait sway');
});

test('a starting run warms every silhouette reachable in its first seconds', () => {
  const loader = recordingLoader();
  const artwork = createPuppyArtwork({mobile: true, loader});
  artwork.apply(DEFAULT_PUPPY);
  artwork.setPose({time: 0, menu: true});
  const menuRequests = new Set(loader.requested);
  // One painting per call, spread across frames; the renderer calls this on
  // every playing frame, so a handful of frames warms the whole set.
  assert.equal(artwork.warmActionPoses(), 'jump');
  assert.equal(artwork.warmActionPoses(), 'slide');
  assert.equal(artwork.warmActionPoses(), 'turn');
  assert.equal(artwork.warmActionPoses(), null, 'a warmed set stops requesting');
  const warmed = loader.requested.filter(url => !menuRequests.has(url));
  assert.deepEqual(warmed.sort(), ['jump', 'slide', 'turn']
    .map(pose => puppyPoseArtworkUrl(DEFAULT_PUPPY, pose)).sort());
  // Hang and the rear chase frame are reached later in a run and still stream.
  for (const pose of ['hang', 'away'])
    assert.ok(!loader.requested.includes(puppyPoseArtworkUrl(DEFAULT_PUPPY, pose)),
      `${pose} must still stream only when the physics asks`);
  // Warming is idempotent: a per-frame call must not re-request anything.
  const before = loader.requested.length;
  for (let i = 0; i < 30; i++) artwork.warmActionPoses();
  assert.equal(loader.requested.length, before);
});

test('a lane change never has to upload a painting mid-run', () => {
  // Regression: deferring the turn painting to first use meant the first
  // left/right swipe downloaded a 1254px image, downscaled it on the main
  // thread and uploaded it to the GPU while the scene was running. On iOS that
  // mid-run upload lost the WebGL context, so every first swipe ended on the
  // recovery screen instead of changing lane.
  const loader = recordingLoader();
  const artwork = createPuppyArtwork({mobile: true, loader});
  artwork.apply(DEFAULT_PUPPY);
  // The renderer warms one painting per playing frame.
  for (let i = 0; i < 5; i++) artwork.warmActionPoses();
  const warmed = loader.requested.length;
  // A hard lane change: full turn amount, on the ground.
  for (let i = 0; i < 10; i++) artwork.setPose({time: i * .05, look: 1, turn: 1});
  const turnUrl = puppyPoseArtworkUrl(DEFAULT_PUPPY, 'turn');
  assert.ok(loader.requested.slice(0, warmed).includes(turnUrl),
    'the turn painting must already be warm before the first swipe');
  const duringSwipe = loader.requested.slice(warmed);
  assert.ok(!duringSwipe.includes(turnUrl),
    `a swipe re-requested the turn painting: ${duringSwipe}`);
});

test('the renderer warms action art only once a trail is actually playing', () => {
  const source = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  const call = source.match(/^.*warmActionPoses\(\).*$/m)?.[0] ?? '';
  assert.match(call, /state === 'playing'/, 'warming is gated on a live run, not the menu');
});
