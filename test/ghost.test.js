import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_GHOST_RECORDS,
  MAX_GHOST_SAMPLES,
  bankGhostRecord,
  createGhostRecorder,
  ghostAt,
  ghostFor,
  ghostsFrom,
  recordGhostSample,
} from '../src/runner/ghost.js';
import {CURRENT_TRAIL_VERSION} from '../src/runner/trail-version.js';

function run(seed = 1989, score = 1200, distance = 120) {
  return {
    seed,
    generatorVersion: 4,
    distance,
    score,
    x: 0,
    y: 0,
    ended: true,
  };
}

test('ghost records keep only ordered, bounded, playable samples', () => {
  const input = [
    {seed: 1989, generatorVersion: 4, score: 200, distance: 20,
      samples: [{d: 0, x: -9, y: 8, p: 'nonsense'}, {d: 6, x: 2.4, y: .8, p: 'jump'}, {d: 4, x: 0, y: 0, p: 'run'}]},
    {seed: 1989, generatorVersion: 4, score: 300, distance: 30,
      samples: [{d: 0, x: 0, y: 0, p: 'run'}, {d: 6, x: 0, y: 0, p: 'slide'}]},
    {seed: 2, version: 4, score: 20, distance: 6,
      samples: [{d: 0, x: 0, y: 0}, {d: 6, x: 0, y: 0}]},
    {seed: -1, version: 4, score: 900, samples: [{d: 0}, {d: 6}]},
  ];
  const records = ghostsFrom(input);
  assert.equal(records.length, 2);
  assert.equal(records[0].score, 300);
  assert.deepEqual(records[0].samples[0], {d: 0, x: 0, y: 0, p: 'run'});
  assert.equal(ghostFor(records, 1989, 4).score, 300);
  assert.equal(ghostFor(records, 3, 4), null);
  assert.ok(ghostsFrom(Array.from({length: MAX_GHOST_RECORDS + 4}, (_, i) => ({
    seed: i + 10, version: 4, score: i, distance: 6,
    samples: [{d: 0}, {d: 6}],
  }))).length <= MAX_GHOST_RECORDS);
  assert.ok(ghostsFrom([{seed: 9, version: 4, score: 1, samples: Array.from({length: MAX_GHOST_SAMPLES + 10}, (_, i) => ({d: i}))}])[0].samples.length <= MAX_GHOST_SAMPLES);
});

test('recorder captures posture transitions and final bank keeps only a better ghost', () => {
  const active = run();
  active.ended = false;
  const recorder = createGhostRecorder(active);
  active.distance = 0; recordGhostSample(recorder, active);
  active.distance = 6; active.y = 1; recordGhostSample(recorder, active);
  active.distance = 12; active.y = 0; active.slide = .4; recordGhostSample(recorder, active);
  active.distance = 18; active.slide = 0; active.zipline = {start: 18, end: 30}; active.y = 6.5; recordGhostSample(recorder, active);
  active.ended = true; active.distance = 24; active.score = 700;
  const profile = {ghosts: []};
  const recordedRun = {...active, ghostRecorder: recorder};
  const receipt = bankGhostRecord(profile, recordedRun);
  assert.equal(receipt.stored, true);
  assert.equal(profile.ghosts.length, 1);
  assert.deepEqual(profile.ghosts[0].samples.map(sample => sample.p), ['run', 'jump', 'slide', 'hang', 'hang']);
  assert.equal(bankGhostRecord(profile, recordedRun), receipt, 'banking the same run is idempotent');

  const worse = {...active, score: 1, ghostRecorder: createGhostRecorder(active)};
  worse.ghostRecorder.samples = recorder.samples;
  const worseReceipt = bankGhostRecord(profile, worse);
  assert.equal(worseReceipt.stored, false);
  assert.equal(profile.ghosts[0].score, 700);
});

test('ghost interpolation is smooth and returns null outside the recorded trail', () => {
  const record = {samples: [
    {d: 0, x: -2.4, y: 0, p: 'run'},
    {d: 6, x: 2.4, y: 1.2, p: 'jump'},
    {d: 12, x: 0, y: 0, p: 'run'},
  ]};
  assert.equal(ghostAt(record, -1), null);
  assert.equal(ghostAt(record, 13), null);
  assert.deepEqual(ghostAt(record, 0), {distance: 0, x: -2.4, y: 0, posture: 'run'});
  const middle = ghostAt(record, 3);
  assert.equal(middle.x, 0);
  assert.equal(middle.y, .6);
  assert.equal(middle.posture, 'jump');
});

test('current trail ghosts record and reload without an obsolete version cap', () => {
  const active = run(4242, 950, 0);
  active.generatorVersion = CURRENT_TRAIL_VERSION;
  active.ended = false;
  const recorder = createGhostRecorder(active);
  recordGhostSample(recorder, active);
  active.distance = 6;
  active.x = 2.4;
  active.y = 1;
  recordGhostSample(recorder, active);
  active.ended = true;
  active.score = 950;
  const profile = {ghosts: []};
  const receipt = bankGhostRecord(profile, {...active, ghostRecorder: recorder});
  assert.equal(receipt.stored, true);
  assert.equal(profile.ghosts[0].generatorVersion, CURRENT_TRAIL_VERSION);
  assert.equal(ghostFor(profile.ghosts, active.seed, CURRENT_TRAIL_VERSION).score, 950);
});
