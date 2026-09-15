import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MINECART_FIRST,
  MINECART_PERIOD,
  MINECART_LENGTH,
  MINECART_APPROACH,
  MINECART_RECOVERY,
  MINECART_BANK_LIMIT,
  MINECART_REWARD,
  minecartAt,
  minecartByIndex,
  minecartIntersecting,
  minecartCurrent,
  steerMinecart,
  clearMinecartGroundActions,
  advanceMinecart,
  moveMinecart,
  minecartEncounter,
} from '../src/runner/minecart.js';
import {createRun, fillTrack, step, act, LANES} from '../src/runner/world.js';
import {actionCue, eventNotice, runLesson} from '../src/runner/guidance.js';
import {scoreBreakdown} from '../src/runner/score-breakdown.js';

test('mine-cart windows are deterministic, half-open and safely bounded', () => {
  for (let index = 0; index < 100; index++) {
    const section = minecartByIndex(index);
    assert.deepEqual(section, {
      index,
      start: MINECART_FIRST + index * MINECART_PERIOD,
      end: MINECART_FIRST + index * MINECART_PERIOD + MINECART_LENGTH,
      approach: MINECART_FIRST + index * MINECART_PERIOD - MINECART_APPROACH,
      recovery: MINECART_FIRST + index * MINECART_PERIOD + MINECART_LENGTH + MINECART_RECOVERY,
    });
    assert.equal(minecartAt(section.approach), null);
    assert.equal(minecartAt(section.start).index, index);
    assert.equal(minecartAt(section.end), null, 'the exit belongs to dismounting');
    assert.equal(minecartIntersecting(section.approach - .01, section.approach - .001), null);
    assert.equal(minecartIntersecting(section.approach, section.recovery).index, index);
    assert.equal(minecartIntersecting(section.recovery, section.recovery + .01).index, index);
    assert.equal(minecartIntersecting(section.recovery + .01, section.recovery + .02), null);
  }
  for (const value of [NaN, Infinity, -1, Number.MAX_VALUE]) assert.equal(minecartAt(value), null);
  for (const value of [-1, .5, NaN, Infinity]) assert.equal(minecartByIndex(value), null);
  assert.equal(minecartIntersecting(4, 3), null);
  assert.equal(minecartIntersecting(Number.MAX_VALUE, Number.MAX_VALUE), null);
});

test('mine-cart current eases at the station and stays within its small bank', () => {
  const section = minecartByIndex(0);
  assert.equal(minecartCurrent(section.start), 0);
  assert.equal(minecartCurrent(section.end), 0);
  assert.equal(minecartCurrent(section.start - .01), 0);
  assert.equal(minecartCurrent(section.end + .01), 0);
  for (let distance = section.start; distance < section.end; distance += .1)
    assert.ok(Math.abs(minecartCurrent(distance)) <= .16 + 1e-10);
});

test('mine-cart steering is frame-rate independent and bounded during reversals', () => {
  const results = [];
  for (const hz of [24, 60, 120]) {
    const body = {x: -2.4, vx: 0};
    let peak = -Infinity;
    for (let i = 0; i < hz; i++) {
      steerMinecart(body, 2.4, 1 / hz);
      peak = Math.max(peak, body.x);
      assert.ok(Number.isFinite(body.x) && Number.isFinite(body.vx));
      assert.ok(Math.abs(body.x) <= MINECART_BANK_LIMIT);
    }
    assert.ok(peak > 2.45 && peak < MINECART_BANK_LIMIT);
    assert.ok(Math.abs(body.x - 2.4) < .03);
    results.push({...body});
  }
  for (const body of results) {
    assert.ok(Math.abs(body.x - results[0].x) < 1e-10);
    assert.ok(Math.abs(body.vx - results[0].vx) < 1e-10);
  }
  const body = {x: 0, vx: 0};
  for (let i = 0; i < 12_000; i++) {
    steerMinecart(body, (i % 2 ? 1 : -1) * 2.4, 1 / 120);
    assert.ok(Math.abs(body.x) <= MINECART_BANK_LIMIT);
  }
});

test('mine-cart lifecycle boards once, clears ground actions and pays on exit', () => {
  const run = createRun(1989);
  Object.assign(run, {time: 40, y: 2, jumpBuffer: .3, slideNext: .7});
  const section = minecartByIndex(0);
  assert.equal(advanceMinecart(run, section.start - .2, section.start + .1), 'entered');
  assert.deepEqual(run.minecart, {...section, boardedAt: 40, boardingHeight: 2});
  assert.equal(run.jumpBuffer, 0);
  assert.equal(run.slideNext, 0);
  assert.equal(run.y, 0);
  assert.equal(advanceMinecart(run, section.start + .1, section.end - .1), 'riding');
  assert.equal(advanceMinecart(run, section.end - .1, section.end), 'exited');
  assert.equal(run.minecart, null);
  assert.equal(run.minecarts, 1);
  assert.equal(run.bonusPoints, MINECART_REWARD);
  assert.equal(run.invulnerable, 1.2);
  assert.equal(run.events.filter(event => event === 'minecart-start').length, 1);
  assert.equal(run.events.filter(event => event === 'minecart-end').length, 1);
  assert.equal(advanceMinecart(run, section.start - .2, section.start + .1), null);
  assert.equal(eventNotice('minecart-end', run).text, 'Cart reached · +250');
  assert.match(scoreBreakdown(run), /250 from mine-cart rides/);
});

test('skipped, ended, teleported or competing traversals cannot manufacture a cart ride', () => {
  const section = minecartByIndex(0);
  const skipped = createRun(1989);
  assert.equal(advanceMinecart(skipped, section.start - 2, section.end + 2), null);
  assert.equal(skipped.minecarts, 0);
  for (const configure of [
    run => {run.ended = true;},
    run => {run.raft = {start: section.start - 1, end: section.end};},
    run => {run.zipline = {start: section.start - 1, end: section.end};},
  ]) {
    const run = createRun(1989);
    configure(run);
    assert.equal(advanceMinecart(run, section.start - .2, section.start + .1), null);
    assert.equal(run.minecarts, 0);
  }
  const run = createRun(1989);
  assert.equal(advanceMinecart(run, section.start, section.start), null);
  assert.equal(advanceMinecart(run, section.start + 1, section.start + 2), null);
  assert.equal(run.minecarts, 0);
});

test('mine-cart encounters trade safe lanes for readable scenic and challenge beats', () => {
  const section = minecartByIndex(0);
  const scenic = minecartEncounter(section, false);
  const challenge = minecartEncounter(section, true);
  assert.equal(scenic.filter(object => object.minecartHazard).length, 3);
  assert.equal(challenge.filter(object => object.minecartHazard).length, 6);
  assert.equal(scenic.filter(object => object.minecartPickup && object.type === 'bone').length, 12);
  assert.equal(scenic.filter(object => object.minecartPickup && object.type === 'gift').length, 1);
  assert.deepEqual([...new Set(scenic.filter(object => object.minecartHazard).map(object => object.minecartSafeLane))], [1, 0, 2]);
  for (const object of [...scenic, ...challenge]) {
    assert.ok(object.at >= section.start && object.at <= section.end);
    if (object.minecartHazard) assert.equal(object.type, 'rock');
  }
});

test('generated prototype trails reserve the cart and older versions stay unchanged', () => {
  const run = createRun(1989);
  const section = minecartByIndex(0);
  Object.assign(run, {
    distance: section.start - MINECART_APPROACH - 1,
    nextRow: section.start - MINECART_APPROACH - 1,
    nextMinecart: section.start,
    nextZipline: section.start + 900,
    nextChoice: section.start + 500,
    objects: [],
  });
  fillTrack(run);
  assert.equal(run.objects.filter(object => object.type === 'minecart-start').length, 1);
  assert.equal(run.objects.filter(object => object.type === 'minecart-end').length, 1);
  assert.equal(run.nextMinecart, section.start + MINECART_PERIOD);
  assert.ok(run.objects.filter(object => object.minecartHazard).every(object => object.at >= section.start));

  const old = createRun(1989, {}, 3);
  Object.assign(old, {distance: section.start - 20, nextRow: section.start - 20, objects: []});
  fillTrack(old);
  assert.equal(old.minecartPrototype, false);
  assert.equal(old.objects.some(object => object.minecartHazard || object.type.startsWith('minecart-')), false);
});

test('following cart cues collects the bone line without jump or slide inputs', () => {
  const section = minecartByIndex(0);
  const run = createRun(1989);
  Object.assign(run, {
    distance: section.start - MINECART_APPROACH - 1,
    nextRow: section.start - MINECART_APPROACH - 1,
    nextMinecart: section.start,
    nextZipline: section.start + 900,
    nextChoice: section.start + 500,
    objects: [],
    lane: 1,
    x: LANES[1],
    previous: {x: LANES[1], y: 0, distance: section.start - MINECART_APPROACH - 1},
  });
  fillTrack(run);
  let previousCue = '';
  while (run.distance < section.end + 2) {
    const cue = actionCue(run);
    if (cue !== previousCue) {
      previousCue = cue;
      if (cue.includes('LEFT')) act(run, 'left');
      if (cue.includes('RIGHT')) act(run, 'right');
    }
    step(run, 1 / 120);
  }
  assert.equal(run.minecarts, 1);
  assert.equal(run.hearts, 3);
  assert.equal(run.jumpBuffer, 0);
  assert.equal(run.slide, 0);
  assert.equal(run.slideNext, 0);
  assert.ok(run.bones >= 9, `reachable cart bones: ${run.bones}`);
  assert.match(runLesson({...run, lastMistake: null}), /Keep an eye|next run/);
});

test('cart motion clears queued actions while preserving powers', () => {
  const run = createRun(1989);
  const section = minecartByIndex(0);
  assert.equal(advanceMinecart(run, section.start - .1, section.start + .1), 'entered');
  Object.assign(run, {distance: section.start + 20, jumpBuffer: .3, slide: .4, slideNext: .5, magnet: 4, shield: 1, zoomies: 3});
  assert.equal(moveMinecart(run, 2.4, 1 / 60), true);
  assert.ok(run.x > 0 && run.x <= MINECART_BANK_LIMIT);
  assert.equal(run.jumpBuffer, 0);
  assert.equal(run.slide, 0);
  assert.equal(run.slideNext, 0);
  assert.deepEqual([run.magnet, run.shield, run.zoomies], [4, 1, 3]);
  clearMinecartGroundActions(run);
  assert.equal(run.y, 0);
  assert.equal(run.diving, false);
  run.ended = true;
  const pose = {x: run.x, vx: run.vx};
  assert.equal(moveMinecart(run, -2.4, 1 / 60), false);
  assert.deepEqual({x: run.x, vx: run.vx}, pose);
});
