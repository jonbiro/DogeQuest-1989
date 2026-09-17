import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SKI_FIRST,
  SKI_PERIOD,
  SKI_LENGTH,
  SKI_APPROACH,
  SKI_RECOVERY,
  SKI_BANK_LIMIT,
  SKI_REWARD,
  skiByIndex,
  skiAt,
  skiIntersecting,
  skiCurrent,
  steerSki,
  clearSkiGroundActions,
  advanceSki,
  moveSki,
  skiEncounter,
} from '../src/runner/ski.js';
import { createRun, fillTrack, act, LANES } from '../src/runner/world.js';
import { actionCue, eventNotice, runLesson } from '../src/runner/guidance.js';

test('Frostpeak windows are deterministic, half-open and bounded', () => {
  for (let index = 0; index < 50; index++) {
    const section = skiByIndex(index);
    assert.deepEqual(section, {
      index,
      start: SKI_FIRST + index * SKI_PERIOD,
      end: SKI_FIRST + index * SKI_PERIOD + SKI_LENGTH,
      approach: SKI_FIRST + index * SKI_PERIOD - SKI_APPROACH,
      recovery: SKI_FIRST + index * SKI_PERIOD + SKI_LENGTH + SKI_RECOVERY,
    });
    assert.equal(skiAt(section.approach), null);
    assert.equal(skiAt(section.start).index, index);
    assert.equal(skiAt(section.end), null);
    assert.equal(skiIntersecting(section.approach - .01, section.approach - .001), null);
    assert.equal(skiIntersecting(section.approach, section.recovery).index, index);
    assert.equal(skiIntersecting(section.recovery, section.recovery + .01).index, index);
    assert.equal(skiIntersecting(section.recovery + .01, section.recovery + .02), null);
  }
  for (const value of [NaN, Infinity, -1, Number.MAX_VALUE]) assert.equal(skiAt(value), null);
  for (const value of [-1, .5, NaN, Infinity]) assert.equal(skiByIndex(value), null);
  assert.equal(skiIntersecting(4, 3), null);
});

test('ski steering is smooth, frame-rate independent and bounded', () => {
  const results = [];
  for (const hz of [24, 60, 120]) {
    const body = { x: -2.4, vx: 0 };
    let peak = -Infinity;
    for (let i = 0; i < hz; i++) {
      steerSki(body, 2.4, 1 / hz);
      peak = Math.max(peak, body.x);
      assert.ok(Number.isFinite(body.x) && Number.isFinite(body.vx));
      assert.ok(Math.abs(body.x) <= SKI_BANK_LIMIT);
    }
    assert.ok(peak > 2.45 && peak < SKI_BANK_LIMIT);
    assert.ok(Math.abs(body.x - 2.4) < .03);
    results.push({ ...body });
  }
  for (const body of results) {
    assert.ok(Math.abs(body.x - results[0].x) < 1e-10);
    assert.ok(Math.abs(body.vx - results[0].vx) < 1e-10);
  }
  assert.equal(skiCurrent(SKI_FIRST), 0);
});

test('ski lifecycle enters once, clears actions and rewards on exit', () => {
  const run = createRun(1989);
  const section = skiByIndex(0);
  Object.assign(run, { time: 40, y: 2, jumpBuffer: .3, slideNext: .7 });
  assert.equal(advanceSki(run, section.start - .2, section.start + .1), 'entered');
  assert.deepEqual(run.ski, { ...section, boardedAt: 40 });
  assert.equal(run.jumpBuffer, 0);
  assert.equal(run.slideNext, 0);
  assert.equal(run.y, 0);
  assert.equal(advanceSki(run, section.start + .1, section.end - .1), 'skiing');
  assert.equal(advanceSki(run, section.end - .1, section.end), 'exited');
  assert.equal(run.ski, null);
  assert.equal(run.skis, 1);
  assert.equal(run.bonusPoints, SKI_REWARD);
  assert.equal(run.invulnerable, 1.2);
  assert.equal(run.events.filter(event => event === 'ski-start').length, 1);
  assert.equal(run.events.filter(event => event === 'ski-end').length, 1);
  assert.equal(advanceSki(run, section.start - .2, section.start + .1), null);
  assert.equal(eventNotice('ski-end', run).text, 'Frostpeak complete · +360');
});

test('ski encounters provide hop, dodge and gate beats with explained rewards', () => {
  const section = skiByIndex(0);
  const scenic = skiEncounter(section, false);
  const challenge = skiEncounter(section, true);
  assert.equal(scenic.filter(object => object.skiHazard).length, 4);
  assert.equal(challenge.filter(object => object.skiHazard).length, 6);
  assert.equal(scenic.filter(object => object.skiPickup && object.type === 'bone').length, 16);
  assert.equal(scenic.filter(object => object.skiPickup && object.type === 'magnet').length, 1);
  assert.ok(scenic.some(object => object.skiHazard && object.type === 'mogul'));
  assert.ok(scenic.some(object => object.skiHazard && object.type === 'ice'));
  assert.ok(scenic.some(object => object.skiHazard && object.type === 'ski-gate'));
  assert.ok(scenic.filter(object => object.skiAirborne).every(object => object.type === 'bone'));
  assert.ok(scenic.every(object => object.at >= section.start && object.at <= section.end));
});

test('current trails schedule Frostpeak while legacy generators remain untouched', () => {
  const current = createRun(1989, {}, 5);
  const section = skiByIndex(0);
  Object.assign(current, {
    distance: section.approach - 1,
    nextRow: section.approach - 1,
    nextSki: section.start,
    nextZipline: section.start + 900,
    nextChoice: section.start + 500,
    objects: [],
  });
  fillTrack(current);
  assert.equal(current.objects.filter(object => object.type === 'ski-start').length, 1);
  assert.equal(current.objects.filter(object => object.type === 'ski-end').length, 1);
  assert.ok(current.objects.some(object => object.skiHazard));

  const old = createRun(1989, {}, 4);
  Object.assign(old, { distance: section.start - 20, nextRow: section.start - 20, objects: [] });
  fillTrack(old);
  assert.equal(old.skiPrototype, false);
  assert.equal(old.objects.some(object => object.skiHazard || object.type.startsWith('ski-')), false);
});

test('ski movement follows cues and keeps jump/slide state deterministic', () => {
  const section = skiByIndex(0);
  const run = createRun(1989, {}, 5);
  run.distance = section.start - .2;
  run.nextRow = Infinity;
  run.objects = skiEncounter(section, false).map((object, id) => ({ ...object, id }));
  run.lane = 1;
  run.x = LANES[1];
  assert.equal(advanceSki(run, section.start - .2, section.start + .1), 'entered');
  run.distance = section.start + 20;
  run.speed = 22;
  assert.match(actionCue(run), /SKI|HOP|OPEN|STEER/);
  act(run, 'slide');
  assert.equal(run.slide, 0);
  act(run, 'jump');
  assert.ok(run.skiHop > 0);
  assert.equal(moveSki(run, LANES[2], 1 / 60), true);
  assert.ok(run.x > 0 && run.x <= SKI_BANK_LIMIT);
  clearSkiGroundActions(run);
  assert.equal(run.y, 0);
  assert.equal(run.skiHop, 0);
  assert.match(runLesson({ ...run, lastMistake: null }), /Keep an eye|next run/);
});
