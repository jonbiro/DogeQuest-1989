import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_DISTANCE, RUN_MODES, createRun, step } from '../src/runner/world.js';

test('the browser run modes expose a finishable adventure and an endless fallback', () => {
  assert.deepEqual(RUN_MODES, ['adventure', 'endless']);

  const adventure = createRun(1989, {}, 5, null, { mode: 'adventure' });
  assert.equal(adventure.mode, 'adventure');
  assert.equal(adventure.adventureGoal, ADVENTURE_DISTANCE);
  adventure.hearts = 999;
  for (let i = 0; i < 5000 && !adventure.ended; i++) step(adventure, 1 / 30);
  assert.equal(adventure.ended, true);
  assert.equal(adventure.retired, true);
  assert.equal(adventure.finishReason, 'destination');
  assert.equal(adventure.distance, ADVENTURE_DISTANCE);

  const endless = createRun(1989, {}, 5, null, { mode: 'endless' });
  endless.hearts = 999;
  for (let i = 0; i < 5000 && !endless.ended; i++) step(endless, 1 / 30);
  assert.equal(endless.mode, 'endless');
  assert.equal(endless.adventureGoal, Infinity);
  assert.equal(endless.ended, false);
  assert.ok(endless.distance > ADVENTURE_DISTANCE);
});
