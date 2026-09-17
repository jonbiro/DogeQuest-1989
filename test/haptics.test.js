import test from 'node:test';
import assert from 'node:assert/strict';
import { createHapticController, hapticPattern, HAPTIC_PATTERNS } from '../src/runner/haptics.js';
import { createRun, step } from '../src/runner/world.js';

test('haptic vocabulary distinguishes quiet pickups from important moments', () => {
  assert.deepEqual(hapticPattern('bone', { combo: 1 }), HAPTIC_PATTERNS.bone);
  assert.deepEqual(hapticPattern('bone', { combo: 5 }), HAPTIC_PATTERNS.streak);
  assert.deepEqual(hapticPattern('turn-left'), HAPTIC_PATTERNS.turn);
  assert.deepEqual(hapticPattern('area-enter'), HAPTIC_PATTERNS['area-enter']);
  assert.deepEqual(hapticPattern('not-an-event'), null);
});

test('haptic controller is optional, throttled and lets urgent events through', () => {
  const calls = [];
  const target = { vibrate(pattern) { calls.push(pattern); } };
  const controller = createHapticController(target, { minGap: 64 });
  assert.equal(controller.available, true);
  assert.equal(controller.trigger('bone', { combo: 1 }, 100), true);
  assert.equal(controller.trigger('bone', { combo: 2 }, 120), false);
  assert.equal(controller.trigger('hit', {}, 120), true);
  assert.equal(controller.trigger('clear', {}, 121), false);
  assert.equal(calls.length, 2);
  assert.equal(controller.cancel(), true);
  assert.deepEqual(calls.at(-1), 0);
});

test('missing vibration support never affects a run or throws', () => {
  const controller = createHapticController(null);
  assert.equal(controller.available, false);
  assert.equal(controller.trigger('hit'), false);
  assert.equal(controller.cancel(), false);
  const run = createRun(1989, {}, 4);
  run.objects = [];
  run.nextRow = Infinity;
  run.distance = 224.9;
  run.speed = 22;
  step(run, 1 / 120);
  assert.ok(run.distance > 224.9);
  assert.equal(run.events.includes('area-enter'), true);
});
