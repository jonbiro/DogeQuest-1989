import test from "node:test";
import assert from "node:assert/strict";
import {
  act,
  BASE_SLIDE_DURATION,
  createRun,
  LANES,
  SLIDE_UPGRADE_DURATION,
  step,
} from "../src/runner/world.js";
import {
  GRAVITY,
  JUMP_BUFFER,
  JUMP_DURATION,
  JUMP_SPEED,
} from "../src/runner/motion.js";

function cleanRun(upgrades = {}) {
  const run = createRun(1989, upgrades);
  run.objects = [];
  run.nextRow = Infinity;
  run.nextChoice = Infinity;
  run.nextZipline = Infinity;
  return run;
}

function advance(run, seconds, dt = 1 / 120) {
  const steps = Math.round(seconds / dt);
  for (let index = 0; index < steps; index++) step(run, dt);
}

test('early repeated slide presses preserve the original duration and allow a fresh next slide',()=>{
  for(const level of [0,1,2,3])for(const dt of [1/60,1/120,1/240]) {
    const run=cleanRun({slide:level});
    const duration=BASE_SLIDE_DURATION+level*SLIDE_UPGRADE_DURATION;
    act(run,'slide');
    let elapsed=0;
    while(run.slide>0&&elapsed<2) {
      const remaining=run.slide;
      if(remaining>.24)act(run,'slide');
      assert.equal(run.slide,remaining);
      step(run,dt);elapsed+=dt;
    }
    assert.ok(Math.abs(elapsed-duration)<=dt+1e-9);
    assert.equal(run.events.filter(event=>event==='slide').length,1);
    act(run,'slide');
    assert.equal(run.slide,duration);
    act(run,'jump');
    assert.equal(run.slide,0);assert.ok(run.vy>0,'jump still cancels a grounded slide immediately');
  }
});

test('late slide presses queue only one follow-up and jump cancels the queue',()=>{
  for(const level of [0,3])for(const dt of [1/60,1/120,1/240]) {
    const run=cleanRun({slide:level});
    const duration=BASE_SLIDE_DURATION+level*SLIDE_UPGRADE_DURATION;
    act(run,'slide');
    while(run.slide>.2)step(run,dt);
    const remaining=run.slide;
    for(let i=0;i<10;i++)act(run,'slide');
    assert.equal(run.slide,remaining,'late presses do not restart the current move');
    assert.equal(run.slideNext,duration);
    while(run.slideNext)step(run,dt);
    assert.ok(run.slide>duration-dt-1e-9);
    assert.equal(run.events.filter(event=>event==='slide').length,2);
    advance(run,1,dt);
    assert.equal(run.slide,0,'a queued move cannot recursively queue itself');
    act(run,'slide');
    while(run.slide>.2)step(run,dt);
    act(run,'slide');act(run,'jump');
    assert.equal(run.slideNext,0);assert.equal(run.slide,0);
  }
});

test('a repeated dive input cannot erase a late buffered jump',()=>{
  const run=cleanRun();
  act(run,'jump');advance(run,.2);act(run,'slide');
  while(run.y>.4||run.vy>=0)step(run,1/120);
  act(run,'jump');
  const buffered=run.jumpBuffer;
  act(run,'slide');
  assert.equal(run.jumpBuffer,buffered);
  advance(run,.1);
  assert.equal(run.events.filter(event=>event==='jump').length,2);
  assert.ok(run.y>0);assert.equal(run.slide,0);
});

test("critically damped steering and reversals are timestep equivalent", () => {
  const results = [];
  for (const dt of [1 / 120, 1 / 60, 1 / 30]) {
    const run = cleanRun();
    act(run, "right");
    advance(run, 0.3, dt);
    assert.ok(run.x > 0 && run.x < LANES[2]);
    assert.ok(run.vx > 0);

    act(run, "left");
    advance(run, 0.6, dt);
    assert.equal(run.lane, 1);
    assert.ok(Math.abs(run.x) < 0.001);
    assert.ok(Math.abs(run.vx) < 0.03);
    results.push({ x: run.x, vx: run.vx });
  }

  for (const result of results.slice(1)) {
    assert.ok(Math.abs(result.x - results[0].x) < 1e-10);
    assert.ok(Math.abs(result.vx - results[0].vx) < 1e-10);
  }
});

test("last-moment jump presses buffer one snappy follow-up takeoff", () => {
  for (const leap of [0, 3]) {
    const run = cleanRun({ leap });
    act(run, "jump");

    let reachedBufferWindow = false;
    for (let tick = 0; tick < 240; tick++) {
      if (run.vy < 0 && run.y > 0.35 && run.y < 0.75) {
        reachedBufferWindow = true;
        break;
      }
      step(run, 1 / 120);
    }
    assert.equal(reachedBufferWindow, true, `leap ${leap} reached its landing window`);
    const bufferedAt = run.y;
    assert.ok(bufferedAt > 0.3);
    act(run, "jump");
    assert.equal(run.jumpBuffer, JUMP_BUFFER);

    for (let index = 0; index < 30 && run.events.filter(event => event === "jump").length < 2; index++)
      step(run, 1 / 120);
    assert.equal(run.events.filter(event => event === "jump").length, 2);
    assert.ok(run.landing?.speed > 0);
    assert.ok(run.y > 0);
    assert.ok(run.vy > 0);
  }
});

test("early airborne jump presses neither stack velocity nor survive until landing", () => {
  const run = cleanRun();
  act(run, "jump");
  advance(run, 0.2);
  const { y, vy } = run;
  act(run, "jump");
  assert.equal(run.y, y);
  assert.equal(run.vy, vy);
  assert.equal(run.jumpBuffer, JUMP_BUFFER);

  advance(run, 1.1);
  assert.equal(run.events.filter(event => event === "jump").length, 1);
  assert.equal(run.jumpBuffer, 0);
  assert.equal(run.y, 0);
  assert.equal(run.vy, 0);
});

test("airborne slides accelerate continuously and preserve their ground duration", () => {
  const run = cleanRun({ slide: 3 });
  act(run, "jump");
  advance(run, 0.25);
  const before = { y: run.y, vy: run.vy };

  act(run, "slide");
  assert.equal(run.y, before.y);
  assert.equal(run.vy, before.vy);
  const upgradedSlide = BASE_SLIDE_DURATION + 3 * SLIDE_UPGRADE_DURATION;
  assert.equal(run.slide, upgradedSlide);
  assert.equal(run.diving, true);

  step(run, 1 / 120);
  assert.ok(Math.abs(run.y - before.y) < 0.2);
  assert.ok(run.vy < before.vy);
  assert.equal(run.slide, upgradedSlide);

  let previousY = run.y;
  let landed = false;
  for (let tick = 0; tick < 240; tick++) {
    step(run, 1 / 120);
    assert.ok(Math.abs(run.y - previousY) < 0.25);
    previousY = run.y;
    if (run.y === 0) {
      landed = true;
      break;
    }
  }
  assert.equal(landed, true);
  assert.equal(run.diving, false);
  assert.ok(run.landing?.speed > 0 && run.landing.speed <= 28.000001);
  assert.ok(run.slide >= upgradedSlide - 1 / 120 - 1e-9);

  const atLanding = run.slide;
  advance(run, 0.2);
  assert.ok(Math.abs(run.slide - (atLanding - 0.2)) < 1e-9);
});

test("landing time and impact stay exact across timesteps and a boundary rebound", () => {
  const landings = [];
  for (const dt of [1 / 120, 1 / 60, 1 / 30]) {
    const run = cleanRun();
    act(run, "jump");
    for (let tick = 0; tick < 240 && !run.landing; tick++) step(run, dt);
    assert.ok(run.landing);
    landings.push(run.landing);
  }
  for (const landing of landings.slice(1)) {
    assert.ok(Math.abs(landing.time - landings[0].time) < 1e-12);
    assert.ok(Math.abs(landing.speed - landings[0].speed) < 1e-12);
  }

  const dt = 1 / 120;
  for (const landingAfter of [dt / 2, dt]) {
    const boundary = cleanRun();
    boundary.y = 0.1;
    boundary.vy = (GRAVITY * landingAfter * landingAfter / 2 - boundary.y) / landingAfter;
    boundary.jumpBuffer = JUMP_BUFFER;
    step(boundary, dt);
    assert.ok(Math.abs(boundary.landing.time - landingAfter) < 1e-12);
    const reboundTime = dt - landingAfter;
    assert.ok(Math.abs(boundary.y - (JUMP_SPEED * reboundTime - GRAVITY * reboundTime ** 2 / 2)) < 1e-12);
    assert.ok(Math.abs(boundary.vy - (JUMP_SPEED - GRAVITY * reboundTime)) < 1e-12);
    assert.equal(boundary.events.filter(event => event === "jump").length, 1);
    assert.equal(boundary.events.filter(event => event === "land").length, 1,'buffered rebound has exactly one touchdown');
  }
});

test("jump and slide lockouts stay short while upgrades add useful clearance", () => {
  const jumps = [];
  for (const leap of [0, 1, 2, 3]) {
    const run = cleanRun({leap});
    act(run, "jump");
    let peak = 0;
    while (!run.landing) {
      step(run, 1 / 240);
      peak = Math.max(peak, run.y);
    }
    jumps.push({airtime: run.landing.time, peak});
  }
  for (const [level, jump] of jumps.entries()) {
    assert.ok(Math.abs(jump.airtime - JUMP_DURATION) < 1e-12);
    assert.ok(Math.abs(jump.peak / jumps[0].peak - (1 + level * .1)) < 1e-12);
  }

  for (const slide of [0, 3]) {
    const run = cleanRun({slide});
    act(run, "slide");
    const expected = BASE_SLIDE_DURATION + slide * SLIDE_UPGRADE_DURATION;
    assert.equal(run.slide, expected);
    advance(run, expected - .02);
    assert.ok(run.slide > 0);
    advance(run, .03);
    assert.equal(run.slide, 0);
  }
});

test("invalid or non-positive simulation deltas are no-ops", () => {
  const run = cleanRun();
  act(run, "right");
  act(run, "jump");
  const snapshot = () => ({
    time: run.time,
    distance: run.distance,
    x: run.x,
    vx: run.vx,
    y: run.y,
    vy: run.vy,
    slide: run.slide,
    jumpBuffer: run.jumpBuffer,
    previous: { ...run.previous },
    events: [...run.events],
  });
  const before = snapshot();
  for (const dt of [0, -1 / 60, Number.NaN, Number.POSITIVE_INFINITY])
    step(run, dt);
  assert.deepEqual(snapshot(), before);
});
