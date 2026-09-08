import test from "node:test";
import assert from "node:assert/strict";
import { actionCue, dockMode, eventNotice } from "../src/runner/guidance.js";
import { swipeAction } from "../src/runner/gestures.js";
import { act, createRun, LANES, step } from "../src/runner/world.js";

const HAZARD_ACTION = {
  arch: "slide",
  branch: "slide",
  gate: "slide",
  gap: "jump",
  log: "jump",
  rock: "jump",
};

function emptyRun() {
  const run = createRun(1989);
  run.objects = [];
  run.nextRow = Infinity;
  run.nextChoice = Infinity;
  run.nextZipline = Infinity;
  return run;
}

function advance(run, seconds) {
  for (let elapsed = 0; elapsed < seconds - 1e-12; elapsed += 1 / 120)
    step(run, Math.min(1 / 120, seconds - elapsed));
}

function hazard(run, type, secondsAway = 0.449, overrides = {}) {
  return {
    id: 999,
    at: run.distance + run.speed * secondsAway,
    lane: 1,
    type,
    used: false,
    passed: false,
    ...overrides,
  };
}

test("action guidance stays quiet without an immediate on-path hazard", () => {
  assert.equal(actionCue(createRun(1989)), "", "the safe opening has no prompt");

  for (const object of [
    { type: "rock", secondsAway: 0.451 },
    { type: "rock", used: true },
    { type: "rock", passed: true },
    { type: "rock", lane: 0 },
  ]) {
    const run = emptyRun();
    run.objects = [
      hazard(run, object.type, object.secondsAway, {
        used: false,
        passed: false,
        ...object,
      }),
    ];
    assert.equal(actionCue(run), "", JSON.stringify(object));
  }
});

test("the short action hint leaves enough time to clear every hazard", () => {
  for (const [type, action] of Object.entries(HAZARD_ACTION)) {
    for (const speed of [22, 36, 46.8]) {
      for (const delay of [0, 0.05, 0.1]) {
        const run = emptyRun();
        run.distance = speed === 22 ? 0 : 3000;
        run.previous.distance = run.distance;
        run.speed = speed;
        run.objects = [hazard(run, type)];

        const expectedCue = action === "slide"
          ? "↓ SLIDE"
          : type === "gap"
            ? "↑ JUMP GAP"
            : "↑ JUMP";
        assert.equal(actionCue(run), expectedCue, `${type} at ${speed}m/s`);

        advance(run, delay);
        assert.equal(
          actionCue(run),
          expectedCue,
          `${type} still actionable after ${delay}s at ${speed}m/s`,
        );
        act(run, action);
        advance(run, 1);
        assert.equal(run.hearts, 3, `${type} clear after ${delay}s at ${speed}m/s`);
        assert.equal(run.clears, 1, `${type} credited after ${delay}s at ${speed}m/s`);
      }
    }
  }
});

test("action guidance does not repeat while an action or assisted mode is active", () => {
  const states = [
    { y: 0.5, vy: -1 },
    { y: 0, vy: 2 },
    { zipline: { start: 0, end: 140 } },
    { zoomies: 0.1 },
  ];
  for (const state of states) {
    const run = emptyRun();
    Object.assign(run, state);
    run.objects = [hazard(run, "rock")];
    assert.equal(actionCue(run), "", JSON.stringify(state));
  }
});

test("slide guidance renews only when the current slide will expire before impact", () => {
  const covered = emptyRun();
  covered.slide = 0.55;
  covered.objects = [hazard(covered, "gate")];
  assert.equal(actionCue(covered), "", "a slide that covers the gate is not repeated");

  const expiring = emptyRun();
  expiring.slide = 0.1;
  expiring.objects = [hazard(expiring, "gate")];
  assert.equal(actionCue(expiring), "↓ SLIDE", "an expiring slide gets a timely renewal hint");

  const jump = emptyRun();
  jump.slide = 0.55;
  jump.objects = [hazard(jump, "rock")];
  assert.equal(actionCue(jump), "↑ JUMP", "a grounded slide never hides an interrupting jump");

  const cable = emptyRun();
  cable.slide = 0.55;
  cable.objects = [hazard(cable, "zipline-start")];
  assert.equal(actionCue(cable), "↑ JUMP · ZIPLINE", "a grounded slide never hides a zipline jump");
});

test("action guidance forecasts the physical lane while steering settles", () => {
  const run = emptyRun();
  run.x = LANES[0];
  run.previous.x = run.x;
  run.lane = 1;

  const before = { x: run.x, vx: run.vx, lane: run.lane };

  run.objects = [hazard(run, "rock", 0.01, { lane: 0 })];
  assert.equal(actionCue(run), "↑ JUMP", "nearby danger remains tied to the occupied lane");
  assert.deepEqual(
    { x: run.x, vx: run.vx, lane: run.lane },
    before,
    "forecasting does not move the simulated runner",
  );

  run.objects = [hazard(run, "rock", 0.1, { lane: 1 })];
  assert.equal(actionCue(run), "↑ JUMP", "later danger follows the settling destination lane");

  run.objects = [hazard(run, "rock", 0.1, { lane: 0 })];
  assert.equal(actionCue(run), "", "the vacated lane is no longer forecast as occupied");

  run.objects = [hazard(run, "rock", 0.036, { lane: 0 })];
  assert.equal(actionCue(run), "", "a lane occupied at the object center is clear by its collision plane");

  run.objects = [hazard(run, "rock", 0.07, { lane: 1 })];
  assert.equal(actionCue(run), "↑ JUMP", "a destination entered by the collision plane still needs a cue");
});

test("the guidance dock selects exactly one mode in priority order", () => {
  const all = {
    cue: "↑ JUMP",
    route: "Choose route",
    notice: { text: "Shield used", priority: 2 },
    missionComplete: false,
  };
  assert.equal(dockMode(all), "cue");
  assert.equal(dockMode({ ...all, cue: "" }), "route-choice");
  assert.equal(dockMode({ ...all, cue: "", route: "" }), "toast");
  assert.equal(
    dockMode({ ...all, cue: "", route: "", notice: null }),
    "mission-summary",
  );
  assert.equal(
    dockMode({ cue: "", route: "", notice: null, missionComplete: true }),
    "",
    "a completed mission leaves no empty dock",
  );
});

test("event notices reserve the dock for relevant feedback", () => {
  const run = { hearts: 2 };
  for (const event of [
    "bone",
    "streak",
    "magnet",
    "shield",
    "gem",
    "gift",
    "zoomies",
    "zoomies-end",
    "double",
    "heart",
    "jump",
    "clear",
    "smash",
  ])
    assert.equal(eventNotice(event, run), null, `${event} stays out of the notice dock`);

  assert.deepEqual(eventNotice("hit", run), { text: "2 hearts left", priority: 3 });
  assert.deepEqual(eventNotice("hit", { hearts: 1 }), { text: "1 heart left", priority: 3 });
  assert.deepEqual(eventNotice("shield-break", run), { text: "Shield used", priority: 2 });
});

test("swipes require a clear, deliberate direction", () => {
  for (const [dx, dy] of [[0, 0], [23, 0], [0, -23], [30, 30], [30, 25], [-25, 30]])
    assert.equal(swipeAction(dx, dy), null, `${dx},${dy} is not decisive`);

  assert.equal(swipeAction(-40, 5), "left");
  assert.equal(swipeAction(40, -5), "right");
  assert.equal(swipeAction(5, -40), "jump");
  assert.equal(swipeAction(-5, 40), "slide");
});
