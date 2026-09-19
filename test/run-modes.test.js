import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_DISTANCE, RUN_MODES, createRun, step, act } from '../src/runner/world.js';
import { actionCue } from '../src/runner/guidance.js';
import { turnPrompt } from '../src/runner/turns.js';

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

test('a cue-following player finishes v6 adventures with full hearts and all traversal verbs', () => {
  // The default browser mode must stay fair with every verb in rotation:
  // turns, route gates, zipline catch, wall pumps, shimmer catch and raft
  // steering, played only through the same edge cues a player reads.
  for (const seed of [0, 1, 2, 3, 4, 5, 6, 7]) {
    const run = createRun(seed, {}, 6, null, { encounterPacing: true, mode: 'adventure' });
    const done = new Set();
    let guard = 0;
    while (!run.ended && guard++ < 30000) {
      const turn = turnPrompt(run);
      if (turn && turn.status !== 'accepted') {
        const key = `turn:${turn.index}`;
        if (!done.has(key)) { done.add(key); act(run, turn.direction); }
      }
      if (run.choicePending !== null && run.choicePending - run.distance < 42) {
        if (run.lane !== 1) act(run, run.lane < 1 ? 'right' : 'left');
      } else {
        const cue = actionCue(run);
        if (/LEFT/.test(cue)) act(run, 'left');
        else if (/RIGHT/.test(cue)) act(run, 'right');
        if (/PUMP/.test(cue) || (cue.includes('JUMP') && run.y === 0)) act(run, 'jump');
        else if (run.glide) act(run, 'jump');
        else if (cue.includes('SLIDE')) act(run, 'slide');
      }
      step(run, 1 / 120);
    }
    assert.equal(run.finishReason, 'destination', `seed ${seed} should arrive, got ${run.finishReason}`);
    assert.equal(run.distance, ADVENTURE_DISTANCE);
    assert.equal(run.hearts, 3, `seed ${seed} lost hearts: ${JSON.stringify(run.lastMistake)}`);
    assert.ok(run.routeChoices >= 1, `seed ${seed} never met a route gate`);
    assert.ok(run.ziplines >= 1, `seed ${seed} never rode the zipline`);
    assert.ok(run.climbs >= 1, `seed ${seed} never met the wall`);
    assert.ok(run.glides >= 1, `seed ${seed} never rode the shimmer`);
    assert.ok(run.rafts >= 1, `seed ${seed} never rode the river`);
  }
});
