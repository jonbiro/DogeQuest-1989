import test from "node:test";
import assert from "node:assert/strict";
import {createRun, act, step} from "../src/runner/world.js";
import {climbAt, climbByIndex, CLIMB_FIRST} from "../src/runner/climb.js";
import {glideAt, glideByIndex, GLIDE_FIRST} from "../src/runner/glide.js";
import {CURRENT_TRAIL_VERSION} from "../src/runner/trail-version.js";
import {actionCue, eventNotice, runLesson} from "../src/runner/guidance.js";
import {encounterFor} from "../src/runner/encounter-director.js";

function advance(run, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 120); i++) {
    run.invulnerable = Math.max(run.invulnerable, 5);
    run.hearts = Math.max(run.hearts, 3);
    step(run, 1 / 120);
    if (run.ended) run.ended = false;
  }
}

test('trail version 6 carries climb/glide prototypes', () => {
  assert.equal(CURRENT_TRAIL_VERSION, 6);
  const run = createRun(1, {}, 6);
  assert.equal(run.climbPrototype, true);
  assert.equal(run.glidePrototype, true);
  const old = createRun(1, {}, 5);
  assert.equal(old.climbPrototype, false);
  assert.equal(old.glidePrototype, false);
});

test('climb scheduling is deterministic', () => {
  assert.deepEqual(climbByIndex(0).start, CLIMB_FIRST);
  assert.ok(climbAt(CLIMB_FIRST + 5));
  assert.equal(climbAt(CLIMB_FIRST - 1), null);
});

test('glide scheduling is deterministic', () => {
  assert.deepEqual(glideByIndex(0).start, GLIDE_FIRST);
  assert.ok(glideAt(GLIDE_FIRST + 5));
  assert.equal(glideAt(GLIDE_FIRST - 1), null);
});

test('v6 run emits climb + glide starts without breaking v5 streams', () => {
  const v6 = createRun(42, {}, 6);
  advance(v6, 50);
  // Emission advances the scheduler even after old objects are culled.
  assert.ok(v6.nextClimb > 900, 'climb emitted, next=' + v6.nextClimb);
  assert.ok(v6.nextGlide > 1400 || v6.objects.some(o => o.type.includes('glide')) || v6.events.some(e => String(e).includes('glide')), 'glide scheduled');
  const v5 = createRun(42, {}, 5);
  advance(v5, 50);
  assert.equal(v5.nextClimb, Infinity);
  assert.equal(v5.nextGlide, Infinity);
  const v5types = v5.objects.map(o => o.type);
  assert.ok(!v5types.includes('climb-start'));
  assert.ok(!v5types.includes('glide-start'));
});

test('climb pumps to completion with bonus', () => {
  const run = createRun(7, {}, 6);
  run.objects = [{id: 1, type: 'climb-start', lane: 1, at: 5, used: false}];
  run.nextRow = 5000;
  advance(run, 0.5);
  assert.ok(run.climb, 'climb grabbed');
  assert.match(actionCue(run), /PUMP/);
  for (let i = 0; i < 4; i++) act(run, 'jump');
  run.distance = run.climb.end;
  advance(run, 0.2);
  assert.equal(run.climb, null);
  assert.ok(run.bonusPoints >= 180);
});

test('glide floats with hold and pays bonus', () => {
  const run = createRun(11, {}, 6);
  run.y = 1;
  run.objects = [{id: 2, type: 'glide-start', lane: 1, at: 5, used: false}];
  run.nextRow = 5000;
  advance(run, 0.5);
  assert.ok(run.glide, 'glide grabbed');
  act(run, 'jump');
  advance(run, 0.5);
  assert.ok(run.y > 0.5, 'still floating');
  run.distance = run.glide.end;
  advance(run, 0.2);
  assert.equal(run.glide, null);
  assert.ok(run.bonusPoints >= 150);
});

test('wade forgives first splash without heart loss', () => {
  const run = createRun(13, {}, 6);
  run.objects = [{id: 3, type: 'gap', lane: 1, at: 6, used: false, wade: true}];
  run.nextRow = 5000;
  run.hearts = 3;
  run.invulnerable = 0;
  for (let i = 0; i < Math.ceil(0.6 * 120); i++) step(run, 1 / 120);
  assert.equal(run.hearts, 3);
  assert.ok(run.events.includes('wade-splash'));
});

test('three clean wade hops complete the stretch for +120', () => {
  const run = createRun(21, {}, 6);
  run.objects = [0, 1, 2].map(i => ({id: 10 + i, type: 'gap', lane: 1, at: 30 + i * 40, used: false, wade: true, wadeStretch: 30}));
  run.nextRow = 5000;
  run.hearts = 3;
  const before = run.bonusPoints;
  for (const at of [30, 70, 110]) {
    // Arrive grounded just before each stone, then jump it.
    let guard = 0;
    while (run.distance < at - 3 && guard++ < 2000) step(run, 1 / 120);
    act(run, 'jump');
    guard = 0;
    while (run.distance < at + 2 && guard++ < 2000) step(run, 1 / 120);
  }
  assert.equal(run.hearts, 3);
  assert.ok(run.events.includes('wade-end'));
  assert.ok(run.bonusPoints >= before + 120);
  assert.equal(eventNotice('wade-end', run).text, 'Stones hopped · +120');
});

test('a splash resets the wade set so two of three earns no bonus', () => {
  const run = createRun(23, {}, 6);
  run.objects = [0, 1, 2].map(i => ({id: 20 + i, type: 'gap', lane: 1, at: 30 + i * 40, used: false, wade: true, wadeStretch: 30}));
  run.nextRow = 5000;
  run.hearts = 3;
  run.invulnerable = 0;
  const before = run.bonusPoints;
  // Miss the first stone on purpose (splash, no heart), clear the second,
  // then miss the third for real: no set bonus, one heart lost, and coaching
  // that names the stones.
  let guard = 0;
  while (run.distance < 32 && guard++ < 2000) step(run, 1 / 120);
  assert.ok(run.events.includes('wade-splash'));
  guard = 0;
  while (run.distance < 67 && guard++ < 2000) step(run, 1 / 120);
  act(run, 'jump');
  guard = 0;
  while (run.distance < 72 && guard++ < 2000) step(run, 1 / 120);
  guard = 0;
  while (run.distance < 112 && guard++ < 2000) step(run, 1 / 120);
  assert.equal(run.hearts, 2);
  assert.ok(!run.events.includes('wade-end'));
  assert.ok(run.bonusPoints < before + 120);
  assert.match(runLesson(run), /stepping stones/);
});

test('wade and rail announce themselves as encounters', () => {
  const run = createRun(29, {}, 6);
  run.objects = [
    {id: 30, type: 'wade-start', lane: 1, at: 100, used: false},
    {id: 31, type: 'rail-start', lane: 1, at: 300, used: false},
  ];
  run.nextRow = 5000;
  run.distance = 50;
  assert.match(encounterFor(run).title, /Stepping stones/);
  run.distance = 250;
  assert.match(encounterFor(run).title, /Root rail/);
});
