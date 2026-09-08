import test from "node:test";
import assert from "node:assert/strict";
import { act, createRun, step, LANES } from "../src/runner/world.js";

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

test("late jump presses above the old height cutoff buffer the next takeoff", () => {
  for (const leap of [0, 3]) {
    const run = cleanRun({ leap });
    act(run, "jump");

    let reachedBufferWindow = false;
    for (let tick = 0; tick < 240; tick++) {
      if (run.vy < 0 && run.y > 0.9 && run.y < 1.8) {
        reachedBufferWindow = true;
        break;
      }
      step(run, 1 / 120);
    }
    assert.equal(reachedBufferWindow, true, `leap ${leap} reached its landing window`);
    const bufferedAt = run.y;
    assert.ok(bufferedAt > 0.6);
    act(run, "jump");
    assert.equal(run.jumpBuffer, 0.18);

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
  assert.equal(run.jumpBuffer, 0.18);

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
  assert.equal(run.slide, 1.75);
  assert.equal(run.diving, true);

  step(run, 1 / 120);
  assert.ok(Math.abs(run.y - before.y) < 0.2);
  assert.ok(run.vy < before.vy);
  assert.equal(run.slide, 1.75);

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
  assert.ok(run.slide >= 1.75 - 1 / 120 - 1e-9);

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

  const boundary = cleanRun();
  const dt = 1 / 120;
  boundary.y = 0.1;
  boundary.vy = (11 * dt * dt - boundary.y) / dt;
  boundary.jumpBuffer = 0.18;
  step(boundary, dt);
  assert.equal(boundary.landing.time, dt);
  assert.equal(boundary.y, 0);
  assert.equal(boundary.vy, 12.5);
  assert.equal(boundary.events.filter(event => event === "jump").length, 1);
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
