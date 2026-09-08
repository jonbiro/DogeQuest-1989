import test from "node:test";
import assert from "node:assert/strict";
import {createRun, fillTrack, step, act, LANES, HAZARDS} from "../src/runner/world.js";
import {ziplineAt, ZIPLINE_HEIGHT} from "../src/runner/ziplines.js";
import {actionCue} from '../src/runner/guidance.js';

test('following zipline cues collects all eighteen bones and the gift without a magnet',()=>{
  for(const start of [650,2050]) {
    const run=approach({start});
    let nextInput=0;
    while(run.distance<start+140) {
      if(run.time>=nextInput) {
        const cue=actionCue(run);
        if(cue==='↑ JUMP · ZIPLINE') act(run,'jump');
        else if(/(BONES|GIFT) LEFT/.test(cue)) act(run,'left');
        else if(/(BONES|GIFT) RIGHT/.test(cue)) act(run,'right');
        nextInput=run.time+.15;
      }
      step(run,1/120);
    }
    assert.equal(run.bones,18,`all bones at ${start}`);
    assert.equal(run.gifts,1,`gift at ${start}`);
    assert.equal(run.ziplines,1);
  }
});

function approach({start = 650, lane = 1, leap = 0, zoomies = 0} = {}) {
  const run = createRun(1989, {leap});
  Object.assign(run, {distance: start - 40, nextRow: start - 40, nextZipline: start, nextChoice: start + 400, choicePending: null, objects: [], lane, x: LANES[lane], zoomies});
  run.speed = Math.min(36, 22 + run.distance / 90) * (zoomies ? 1.3 : 1);
  fillTrack(run);
  return run;
}

test("zipline intervals repeat between decision gates with exact endpoints", () => {
  assert.equal(ziplineAt(649.99), null);
  assert.deepEqual(ziplineAt(650), {start: 650, end: 790});
  assert.deepEqual(ziplineAt(790), {start: 650, end: 790});
  assert.equal(ziplineAt(790.01), null);
  assert.deepEqual(ziplineAt(2050), {start: 2050, end: 2190});
});

test("zipline generation reserves a clear approach, aerial route and landing", () => {
  for (let cycle = 0; cycle < 8; cycle++) {
    const start = 650 + cycle * 1400;
    const run = approach({start});
    assert.equal(run.objects.filter(o => o.type === "zipline-start").length, 1);
    assert.equal(run.objects.filter(o => o.airborne && o.type === "bone").length, 18);
    assert.equal(run.objects.filter(o => o.airborne && o.type === "gift").length, 1);
    assert.ok(run.objects.every(o => !HAZARDS.includes(o.type) || o.at >= start + 185));
    assert.equal(run.nextZipline, start + 1400);
    const count = run.objects.length;
    fillTrack(run);
    assert.equal(run.objects.length, count);
  }
});

test("jump catches from every lane at normal, top and boosted speeds; release is smooth and pays once", () => {
  for (const start of [650, 2050]) for (const lane of [0, 1, 2]) for (const leap of [0, 3]) for (const zoomies of [0, 6]) for (const lead of [.2, .4, .65]) {
    const run = approach({start, lane, leap, zoomies});
    let jumped = false, caught = false, maximumDelta = 0;
    while (run.distance < start + 180) {
      if (!jumped && start - run.distance < run.speed * lead) {
        act(run, "jump"); jumped = true;
      }
      const before = run.y;
      step(run, 1 / 120);
      maximumDelta = Math.max(maximumDelta, Math.abs(before - run.y));
      if (run.zipline) {
        caught = true;
        act(run, "slide"); act(run, "jump");
        assert.equal(run.slide, 0);
        assert.ok(run.y > .65);
      }
    }
    assert.equal(caught, true);
    assert.equal(run.ziplines, 1);
    assert.equal(run.events.filter(e => e === "zipline-end").length, 1);
    assert.equal(run.hearts, 3);
    assert.equal(run.zipline, null);
    assert.equal(run.y, 0);
    assert.ok(maximumDelta < .25, `vertical discontinuity: ${maximumDelta}`);
    assert.ok(run.bonusPoints >= 250);
  }
});

test("missing the handle is safe and ground magnets cannot steal aerial prizes", () => {
  const run = approach(); run.magnet = 30;
  while (run.distance < 795) step(run, 1 / 120);
  assert.equal(run.zipline, null);
  assert.equal(run.ziplines, 0);
  assert.equal(run.bones, 0);
  assert.equal(run.gifts, 0);
  assert.equal(run.hearts, 3);
});

test("zipline steering collects aerial treats and magnets retain their normal timing", () => {
  const run = approach();
  while (run.distance < 638) step(run, 1 / 120);
  act(run, "jump");
  while (!run.zipline && run.distance < 654) step(run, 1 / 120);
  assert.ok(run.zipline);
  run.magnet = 10;
  run.double = 10;
  while (run.distance < 790) {
    // Swing out and back using the same bounded lane inputs as the player.
    const desired = run.distance > 760 ? 1 : run.distance < 720 ? 2 : 0;
    if (run.lane !== desired) act(run, desired > run.lane ? "right" : "left");
    step(run, 1 / 120);
  }
  assert.equal(run.bones, 18);
  assert.equal(run.bonePoints, 18 * 50);
  assert.equal(run.gifts, 1);
  assert.ok(run.magnet > 0 && run.magnet < 10);
  assert.ok(run.y <= ZIPLINE_HEIGHT + .01);
});

test("ordinary lane inputs can fetch the whole aerial trail without a magnet", () => {
  const run = approach({start:2050});
  let jumped = false;
  while (run.distance < 2190) {
    if (!jumped && 2050 - run.distance < run.speed * .4) { act(run, "jump"); jumped = true; }
    const next = run.objects.find(o => o.airborne && !o.used && o.at > run.distance - 1.8);
    if (next && next.at - run.distance < 12 && next.lane !== run.lane)
      act(run, next.lane > run.lane ? "right" : "left");
    step(run, 1 / 120);
  }
  assert.equal(run.bones, 18);
  assert.equal(run.gifts, 1);
  assert.equal(run.ziplines, 1);
});
