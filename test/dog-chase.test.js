import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, fillTrack, step } from '../src/runner/world.js';
import {
  DOG_CHASE_FIRST,
  DOG_CHASE_LENGTH,
  DOG_CHASE_PERIOD,
  DOG_CHASE_REWARD,
  dogChaseAt,
  dogChaseByIndex,
  dogChaseIntersecting,
  dogChaseProgress,
  dogChaseWindow,
} from '../src/runner/dog-chase.js';

test('dog chase schedule has bounded, repeatable windows', () => {
  const first = dogChaseByIndex(0);
  const second = dogChaseByIndex(1);
  assert.deepEqual(first, {
    index: 0,
    start: DOG_CHASE_FIRST,
    end: DOG_CHASE_FIRST + DOG_CHASE_LENGTH,
    approach: DOG_CHASE_FIRST - 28,
    recovery: DOG_CHASE_FIRST + DOG_CHASE_LENGTH + 24,
    lane: 1,
  });
  assert.equal(second.start - first.start, DOG_CHASE_PERIOD);
  assert.equal(dogChaseByIndex(-1), null);
  assert.equal(dogChaseAt(first.start - .01), null);
  assert.deepEqual(dogChaseAt(first.start), first);
  assert.equal(dogChaseAt(first.end), null);
});

test('dog chase animation state stays readable and deterministic', () => {
  const chase = dogChaseByIndex(0);
  assert.equal(dogChaseIntersecting(chase.approach, chase.recovery)?.index, chase.index);
  assert.equal(dogChaseIntersecting(chase.recovery + .01, chase.recovery + 2), null);
  const start = dogChaseProgress(chase.start, chase);
  const middle = dogChaseProgress(chase.start + DOG_CHASE_LENGTH / 2, chase);
  const end = dogChaseProgress(chase.end, chase);
  assert.equal(start.lane, 1);
  assert.equal(middle.lane, 2);
  assert.equal(end.lane, 2);
  assert.ok(start.progress >= 0 && start.progress <= 1);
  assert.ok(middle.eased > 0 && middle.eased < 1);
  assert.ok(Math.abs(middle.x) <= 2.4);
  assert.equal(dogChaseProgress(chase.start, null), null);
  assert.deepEqual(dogChaseWindow(chase.start + 1, chase), {
    chase,
    remaining: DOG_CHASE_LENGTH - 1,
    active: true,
  });
});

test('version-four trails schedule a clean chase line outside other set pieces', () => {
  const run = createRun(77, {}, 4);
  const chase = dogChaseByIndex(2);
  Object.assign(run, {
    distance: chase.start - 100,
    nextRow: chase.approach,
    nextChoice: Infinity,
    nextZipline: Infinity,
    nextMinecart: Infinity,
    nextMovingGate: Infinity,
    nextBridgeCollapse: Infinity,
    lastCourseVisit: 999,
    course: null,
    nextDogChase: chase.start,
  });
  fillTrack(run);
  assert.equal(run.dogChaseUpcoming?.index, chase.index);
  const pickups = run.objects.filter(object => object.chasePickup);
  assert.equal(pickups.filter(object => object.type === 'bone').length, 7);
  assert.equal(pickups.filter(object => object.type === 'gift').length, 1);
  assert.ok(pickups.every(object => object.at >= chase.start && object.at < chase.recovery));
});

test('a chase starts and pays its reward once on the fixed simulation clock', () => {
  const chase = dogChaseByIndex(2);
  const run = createRun(78, {}, 4);
  Object.assign(run, {
    distance: chase.start - .2,
    nextRow: Infinity,
    nextChoice: Infinity,
    nextZipline: Infinity,
    nextMinecart: Infinity,
    nextMovingGate: Infinity,
    nextBridgeCollapse: Infinity,
    nextCorner: 999,
    objects: [],
    dogChaseUpcoming: chase,
    invulnerable: 1e6,
  });
  for (let i = 0; i < 20 && !run.dogChase; i++) step(run, 1 / 120);
  assert.ok(run.dogChase, 'the companion becomes active when its start is crossed');
  assert.ok(run.events.includes('dog-chase-start'));
  run.events = [];
  for (let i = 0; i < 160 && run.dogChase; i++) step(run, 1 / 30);
  assert.equal(run.dogChase, null);
  assert.equal(run.dogChaseUpcoming, null);
  assert.equal(run.dogChases, 1);
  assert.equal(run.bonusPoints, DOG_CHASE_REWARD);
  assert.ok(run.events.includes('dog-chase-end'));
  run.events = [];
  step(run, 1 / 30);
  assert.equal(run.dogChases, 1);
  assert.equal(run.bonusPoints, DOG_CHASE_REWARD);
});
