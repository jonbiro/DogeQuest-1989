import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOVING_GATE_FIRST,
  MOVING_GATE_LENGTH,
  MOVING_GATE_PERIOD,
  movingGateAt,
  movingGateByIndex,
  movingGateEncounter,
  movingGateIntersecting,
  movingGateLane,
  movingGateSafeLane,
  movingGateX,
} from '../src/runner/moving-gate.js';
import {createRun, fillTrack, step, LANES, HAZARDS} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';
import {encounterFor as directorEncounterFor} from '../src/runner/encounter-director.js';

test('moving gate schedule is deterministic, bounded and half-open', () => {
  const section = movingGateByIndex(0);
  assert.deepEqual(movingGateAt(section.start), section);
  assert.equal(movingGateAt(section.end), null);
  assert.equal(movingGateAt(section.start - .01), null);
  assert.equal(movingGateByIndex(-1), null);
  assert.equal(movingGateByIndex(1.5), null);
  assert.equal(movingGateIntersecting(section.approach, section.recovery).index, 0);
  assert.equal(movingGateIntersecting(section.recovery + .01, section.recovery + .02), null);
  assert.ok(section.start >= MOVING_GATE_FIRST);
  assert.equal(movingGateByIndex(1).start - section.start, MOVING_GATE_PERIOD);
});

test('moving gate sweeps smoothly between outside lanes and always leaves an opening', () => {
  const section = movingGateByIndex(0);
  const gate = movingGateEncounter(section)[0];
  const samples = [section.start, section.start + MOVING_GATE_LENGTH * .125,
    section.start + MOVING_GATE_LENGTH * .5, section.end];
  const positions = samples.map(distance => movingGateX(gate, distance));
  assert.equal(positions[0], section.startX);
  assert.equal(positions[2], section.endX);
  assert.equal(positions.at(-1), section.startX);
  assert.ok(positions[1] > section.startX && positions[1] < section.endX);
  assert.notEqual(movingGateLane(gate), movingGateSafeLane(gate, gate.at, gate.lane));
  assert.ok(Math.abs(LANES[movingGateSafeLane(gate, gate.at, gate.lane)] - movingGateX(gate, gate.at)) >= 1.2);
});

test('version-four trails add a moving gate without changing legacy streams', () => {
  const run = createRun(1989, {}, 4);
  const section = movingGateByIndex(1);
  run.distance = section.approach - 1;
  run.nextRow = run.distance;
  run.objects = [];
  run.nextChoice = Infinity;
  run.nextZipline = Infinity;
  run.nextMinecart = Infinity;
  fillTrack(run);
  const gate = run.objects.find(object => object.type === 'moving-gate');
  assert.ok(gate, 'prototype trail exposes the authored encounter');
  assert.ok(HAZARDS.includes('moving-gate'));
  assert.equal(gate.movingGate, true);
  assert.equal(gate.lane, gate.endLane);
  assert.ok(run.objects.some(object => object.movingGateReward && object.type === 'bone'));
  const old = createRun(1989, {}, 3);
  Object.assign(old, {distance: section.approach - 1, nextRow: section.approach - 1, objects: [], nextChoice: Infinity, nextZipline: Infinity});
  fillTrack(old);
  assert.equal(old.movingGatePrototype, false);
  assert.equal(old.objects.some(object => object.type === 'moving-gate'), false);
});

test('moving gate collision can be dodged by following its open lane', () => {
  const section = movingGateByIndex(0);
  const run = createRun(1);
  const gate = movingGateEncounter(section)[0];
  Object.assign(run, {
    distance: gate.at - run.speed * .12,
    previous: {x: LANES[gate.lane], y: 0, distance: gate.at - run.speed * .12},
    nextRow: Infinity,
    nextChoice: Infinity,
    nextZipline: Infinity,
    nextMinecart: Infinity,
    objects: [{id: 999, ...gate, used: false, passed: false}],
    lane: movingGateSafeLane(gate, gate.at, gate.lane),
    x: LANES[movingGateSafeLane(gate, gate.at, gate.lane)],
  });
  for (let i = 0; i < 5; i++) step(run, 1 / 30);
  assert.equal(run.hearts, 3);
  assert.equal(run.clears, 0);
  assert.equal(run.movingGates, 1, 'the authored beat is counted once at its collision plane');
  assert.equal(run.objects[0].passed, true);
});

test('moving gate guidance names the timing and director preview', () => {
  const section = movingGateByIndex(0);
  const gate = movingGateEncounter(section)[0];
  const run = createRun(1);
  Object.assign(run, {distance: gate.at - run.speed * .45, objects: [{...gate, id: 7, used: false, passed: false}], nextCorner: 99});
  assert.match(actionCue(run), /MOVING GATE|OPEN LANE|SLIDE/);
  const beat = directorEncounterFor({distance: gate.at - 20, objects: [{...gate, used: false}]});
  assert.equal(beat.title, 'Moving gate');
  assert.match(beat.detail, /opening|slide/i);
});
