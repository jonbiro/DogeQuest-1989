import test from "node:test";
import assert from "node:assert/strict";
import { actionCue, dockMode, eventNotice, runLesson } from "../src/runner/guidance.js";
import { swipeAction } from "../src/runner/gestures.js";
import { act, createRun, LANES, step } from "../src/runner/world.js";
import {courseAt} from '../src/runner/courses.js';

const HAZARD_ACTION = {
  arch: "slide",
  branch: "slide",
  gate: "slide",
  gap: "jump",
  log: "jump",
  rock: "jump",
};

test('course introduction never hides a jump/slide deadline and slaloms request lanes',()=>{
  const run=createRun(1989);
  run.distance=170;run.nextCorner=1;run.course=courseAt(200);run.objects=[];
  assert.equal(actionCue(run),'Root scramble · +180 clean');
  run.objects=[{type:'gate',lane:1,at:178}];
  assert.equal(actionCue(run),'↓ SLIDE');
  run.course=courseAt(1120);run.distance=1105;run.objects=[];
  assert.equal(actionCue(run),'← WEAVE LEFT');
  act(run,'left');assert.equal(actionCue(run),'Crystal slalom · +180 clean');
});

test('corner cues work in the air, confirm one accepted swipe and correct wrong input', () => {
  const run = createRun(1989);
  run.distance = 140;
  run.y = 1;
  assert.equal(actionCue(run), '← TURN LEFT');
  act(run, 'right');
  assert.equal(actionCue(run), '← TURN LEFT');
  act(run, 'left');
  assert.equal(actionCue(run), '✓ TURN SET');
  run.nextCorner = 1;
  run.distance = 940;
  assert.equal(actionCue(run), '→ TURN RIGHT');
  run.distance = 900;
  assert.equal(actionCue(run), '', 'no early text banner');
});

test('post-run advice explains the actual mistake without inventing one', () => {
  assert.match(runLesson({lastMistake:null}), /next run/i);
  assert.match(runLesson({lastMistake:{type:'corner',direction:'right'}}), /Swipe right/);
  for (const type of ['arch','branch','gate']) assert.match(runLesson({lastMistake:{type}}), /Slide/);
  assert.match(runLesson({lastMistake:{type:'gap'}}), /striped edge/);
  assert.match(runLesson({lastMistake:{type:'rock'}}), /open lane/);
  assert.deepEqual(eventNotice('hit', {hearts:1,lastMistake:{type:'corner',direction:'left'}}),
    {text:'Missed left turn · 1 heart left',priority:3});
});

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

test('recovery collisions do not replace the last meaningful mistake',()=>{
  const run=emptyRun();
  run.objects=[hazard(run,'log',.1)];
  advance(run,.2);
  assert.equal(run.hearts,2);
  assert.equal(run.lastMistake.type,'log');
  run.objects=[hazard(run,'gate',.1)];
  advance(run,.2);
  assert.equal(run.hearts,2);
  assert.equal(run.lastMistake.type,'log');
  assert.match(runLesson(run),/low obstacle/);
  advance(run,1.8);
  run.objects=[hazard(run,'gate',.1)];
  advance(run,.2);
  assert.equal(run.hearts,1);
  assert.equal(run.lastMistake.type,'gate');
  assert.match(runLesson(run),/overhead/);
});

test('zipline approach explains aerial bones before the jump deadline and keeps airborne guidance', () => {
  const run = emptyRun();
  run.objects = [hazard(run, 'zipline-start', 1.5)];
  assert.equal(actionCue(run), 'ZIPLINE AHEAD · high bones');
  run.objects[0].at = run.distance + run.speed * .44;
  assert.equal(actionCue(run), '↑ JUMP · ZIPLINE');
  act(run, 'jump');
  assert.equal(actionCue(run), 'CATCH THE TURQUOISE HANDLE');
  run.objects[0].caught = true;
  run.zipline = {start:run.distance,end:run.distance+140};
  assert.equal(actionCue(run), '', 'successful catch returns focus to steering');
});

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

test('aerial bone guidance follows the nearest reward and stops after steering or activating a magnet', () => {
  const run=emptyRun();
  run.zipline={start:0,end:140};
  run.objects=[hazard(run,'bone',.6,{airborne:true,lane:2}),
    hazard(run,'bone',.3,{airborne:true,lane:0})];
  assert.equal(actionCue(run),'← BONES LEFT');
  act(run,'left');
  assert.equal(actionCue(run),'','no repeated input while steering settles');
  run.objects[1].used=true;
  assert.equal(actionCue(run),'→ BONES RIGHT ×2');
  run.magnet=4;
  assert.equal(actionCue(run),'','active attraction needs no lane instruction');
  run.magnet=0;run.objects[0].pull={};
  assert.equal(actionCue(run),'','already-attracted bones need no instruction');
  run.magnet=4;
  run.objects=[hazard(run,'gift',.4,{airborne:true,lane:1})];
  assert.equal(actionCue(run),'→ GIFT RIGHT','magnets do not collect gifts; steering is still needed');
  run.objects=[];
  assert.equal(actionCue(run),'','no idle chatter');
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

test('airborne overhead guidance offers a dive that clears the row without repeated hints', () => {
  for (const type of ['arch', 'branch', 'gate']) {
    for (const leap of [0, 3]) {
      for (const jumpAge of [.1, .35, .55]) {
        for (const speed of [22, 36]) {
          const run = emptyRun();
          run.upgrades.leap = leap;
          run.distance = speed === 22 ? 0 : 3000;
          run.speed = speed;
          act(run, 'jump');
          advance(run, jumpAge);
          run.objects = [hazard(run, type)];
          assert.equal(actionCue(run), '↓ DIVE · SLIDE');
          advance(run, .1);
          act(run, 'slide');
          assert.equal(actionCue(run), '', 'acknowledge the dive immediately');
          advance(run, .5);
          assert.equal(run.hearts, 3, `${type}, leap ${leap}, age ${jumpAge}, speed ${speed}`);
          assert.equal(run.clears, 1);
        }
      }
    }
  }
});

test('airborne dive hints ignore safe lanes, distant gates and protected Zoomies', () => {
  for (const overrides of [{lane: 0}, {used: true}, {passed: true}]) {
    const run = emptyRun();
    act(run, 'jump');
    run.objects = [hazard(run, 'gate', .4, overrides)];
    assert.equal(actionCue(run), '');
  }
  const run = emptyRun();
  act(run, 'jump');
  run.objects = [hazard(run, 'gate', .6)];
  assert.equal(actionCue(run), '');
  run.objects = [hazard(run, 'gate', .4)];
  run.zoomies = 1;
  assert.equal(actionCue(run), '');
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
