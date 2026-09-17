import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/runner/world.js';
import {
  ENCOUNTER_LOOKAHEAD,
  ENCOUNTER_PHASES,
  compactEncounterTitle,
  encounterDisplayTitle,
  encounterFor,
  recoveryUntilFor,
} from '../src/runner/encounter-director.js';

test('compact encounter titles remove duplicate authored layers', () => {
  assert.equal(compactEncounterTitle('Fern weave', 'Fern weave'), 'Fern weave');
  assert.equal(compactEncounterTitle('Warm-up · Fern weave', 'Fern weave'), 'Warm-up · Fern weave');
  assert.equal(compactEncounterTitle('', null, 'Big moment ahead'), 'Big moment ahead');
});

test('portrait encounter titles stay short while canonical titles remain descriptive', () => {
  assert.equal(encounterDisplayTitle('Collapsing bridge'), 'Bridge gap');
  assert.equal(encounterDisplayTitle('Roots + canopy · Fern weave'), 'Fern weave');
  assert.equal(encounterDisplayTitle('Mine-cart rush'), 'Minecart');
});

test('the encounter director gives each destination a readable pacing beat', () => {
  const warmup = encounterFor({ distance: 8, objects: [] });
  const escalation = encounterFor({ distance: 120, objects: [] });
  const recovery = encounterFor({ distance: 205, objects: [] });
  assert.equal(warmup.phase, 'warmup');
  assert.equal(escalation.phase, 'escalation');
  assert.equal(recovery.phase, 'recovery');
  for (const beat of [warmup, escalation, recovery]) {
    assert.ok(ENCOUNTER_PHASES[beat.phase]);
    assert.ok(beat.title.length > 0);
    assert.ok(beat.detail.length > 0);
    assert.ok(beat.progress >= 0 && beat.progress <= 1);
    assert.ok(beat.mechanic.length > 0);
    assert.ok(beat.landmark.length > 0);
  }
  assert.match(warmup.title, /Fern weave/);
  assert.equal(warmup.title, 'Roots + canopy · Fern weave');
  assert.equal(warmup.displayTitle, 'Fern weave');
  assert.match(warmup.detail, /fern ribbon/);
});

test('set pieces take over the beat before and during their traversal', () => {
  const upcoming = encounterFor({
    distance: 40,
    objects: [{ type: 'zipline-start', at: 40 + ENCOUNTER_LOOKAHEAD - 1, used: false }],
  });
  assert.equal(upcoming.phase, 'spectacle');
  assert.equal(upcoming.title, 'Zipline flight');
  assert.match(upcoming.detail, /turquoise handle/);

  const run = createRun(1989, {}, 4);
  run.distance = 660;
  run.zipline = { start: 650, end: 790 };
  const active = encounterFor(run);
  assert.equal(active.phase, 'spectacle');
  assert.equal(active.title, 'Zipline flight');
  assert.match(active.detail, /to go/);
});

test('scenic mine-cart encounters explain the optional gem shortcut', () => {
  const run = createRun(1989, {}, 5);
  run.distance = 7218;
  run.minecart = {start: 7200, end: 7295};
  run.minecartChoice = {kind: 'gem-line', title: 'Gem shortcut', effect: '+250 points each', gems: 3};
  const beat = encounterFor(run);
  assert.equal(beat.phase, 'spectacle');
  assert.equal(beat.title, 'Mine-cart rush');
  assert.match(beat.detail, /bone lane/);
  assert.match(beat.detail, /gem line/);
});

test('course and route decisions are named instead of looking like ordinary rows', () => {
  const course = encounterFor({
    distance: 300,
    course: { start: 320, end: 425, name: 'Root scramble', scenic: false, beats: [{}, {}, {}] },
    objects: [],
  });
  assert.equal(course.phase, 'spectacle');
  assert.equal(course.title, 'Root scramble');
  assert.match(course.detail, /Three-beat challenge/);

  const route = encounterFor({ distance: 330, choicePending: 360, objects: [] });
  assert.equal(route.phase, 'spectacle');
  assert.equal(route.title, 'Fork in the trail');
  assert.match(route.detail, /Scenic/);
  assert.match(route.detail, /Challenge/);
});

test('recovery windows extend monotonically after a completed spectacle', () => {
  assert.equal(recoveryUntilFor({}, 100, 20), 120);
  assert.equal(recoveryUntilFor({ encounterRecoveryUntil: 140 }, 100, 20), 140);
  const run = { encounterRecoveryUntil: 0 };
  run.encounterRecoveryUntil = recoveryUntilFor(run, 240);
  const beat = encounterFor({ distance: 250, encounterRecoveryUntil: run.encounterRecoveryUntil, objects: [] });
  assert.equal(beat.phase, 'recovery');
  assert.equal(beat.title, 'Clear trail');
});
