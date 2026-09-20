import test from "node:test";
import assert from "node:assert/strict";
import {act, createRun, fillTrack, HAZARDS, LANES, PICKUPS, step} from "../src/runner/world.js";
import {
  CORNER_ARC_LENGTH,
  CORNER_PERIOD,
  TURN_SKILL_REWARD,
  TURN_WINDOW_SECONDS,
  OPENING_TURN_WINDOW_SECONDS,
  cornerByIndex,
  cornerIntersecting,
  turnPrompt,
  turnWindowFor,
  upcomingCorner,
} from "../src/runner/turns.js";

function fixture(index = 0, seconds = .8) {
  const corner = cornerByIndex(index);
  const run = createRun(1989);
  Object.assign(run, {
    distance: corner.at - run.speed * seconds,
    nextCorner: index,
    objects: [{
      id: 999,
      type: `corner-${corner.direction}`,
      lane: 1,
      at: corner.at,
      turnIndex: index,
      direction: corner.direction,
      used: false,
    }],
    nextRow: Infinity,
    nextChoice: Infinity,
    choicePending: null,
    nextZipline: Infinity,
    events: [],
  });
  return {run, corner};
}

function cross(run, corner) {
  let guard = 0;
  while (run.distance <= corner.at + 1 && !run.ended && guard++ < 500) step(run, 1 / 120);
  assert.ok(guard < 500, "fixture crossed its corner");
}

test("corner descriptors repeat deterministically and balance their heading", () => {
  const expected = [
    [150, "left"],
    [950, "right"],
    [1550, "right"],
    [2350, "left"],
    [2950, "left"],
    [3750, "right"],
  ];
  expected.forEach(([at, direction], index) => {
    const corner = cornerByIndex(index);
    assert.equal(corner.at, at);
    assert.equal(corner.direction, direction);
    assert.equal(corner.end - corner.start, CORNER_ARC_LENGTH);
    assert.equal(Math.abs(corner.angle), Math.PI / 2);
  });
  for (let cycle = 0; cycle < 20; cycle++) {
    const first = cornerByIndex(cycle * 2);
    const second = cornerByIndex(cycle * 2 + 1);
    assert.equal(first.angle + second.angle, 0);
    assert.equal(cornerByIndex(cycle * 2 + 2).at - first.at, CORNER_PERIOD);
  }
  assert.equal(cornerByIndex(-1), null);
  assert.equal(upcomingCorner(150).index, 0);
  assert.equal(upcomingCorner(150.001).index, 1);
  assert.equal(upcomingCorner(960).index, 2);
});

test("turns stay clear of route decisions and zipline traversals", () => {
  for (let index = 0; index < 40; index++) {
    const corner = cornerByIndex(index);
    for (let choice = 350; choice < corner.at + 800; choice += 700) {
      assert.ok(choice < corner.approach || choice > corner.recovery);
    }
    for (let zipline = 650; zipline < corner.at + 1500; zipline += 1400) {
      assert.ok(zipline + 140 < corner.approach || zipline > corner.recovery);
    }
  }
  const first = cornerByIndex(0);
  assert.equal(first.end, 175, "the opening turn finishes before the bridge at 180m");
});

test("early horizontal input changes lane, while matching input in the window commits the turn", () => {
  const early = fixture(0, TURN_WINDOW_SECONDS + .2);
  act(early.run, early.corner.direction);
  assert.equal(early.run.lane, 0);
  assert.equal(early.run.turnAttempt, null);

  const {run, corner} = fixture(0);
  const lane = run.lane;
  const x = run.x;
  assert.equal(turnPrompt(run).status, "ready");
  act(run, corner.direction);
  assert.equal(run.lane, lane);
  assert.equal(run.x, x, "committing a corner never teleports the puppy");
  assert.equal(turnPrompt(run).status, "accepted");
  act(run, corner.direction === "left" ? "right" : "left");
  assert.equal(turnPrompt(run).status, "accepted", "an accepted turn stays committed");
  cross(run, corner);
  assert.equal(run.hearts, 3);
  assert.equal(run.turns, 1);
  assert.equal(run.missedTurns, 0);
  assert.equal(run.bonusPoints, TURN_SKILL_REWARD);
  assert.equal(run.events.filter((event) => event === `turn-${corner.direction}`).length, 1);
  assert.equal(run.objects[0].turnState, "accepted");
});

test("current live trails preview the first turn earlier without changing replay timing", () => {
  const corner = cornerByIndex(0);
  const live = createRun(1989, {}, 5, null, {encounterPacing:true});
  live.nextCorner = 0;
  live.distance = corner.at - live.speed * (OPENING_TURN_WINDOW_SECONDS - .05);
  assert.equal(turnWindowFor(live), OPENING_TURN_WINDOW_SECONDS);
  assert.equal(turnPrompt(live).direction, corner.direction);

  const legacy = createRun(1989, {}, 5);
  legacy.nextCorner = 0;
  legacy.distance = corner.at - legacy.speed * (OPENING_TURN_WINDOW_SECONDS - .05);
  assert.equal(turnWindowFor(legacy), TURN_WINDOW_SECONDS);
  assert.equal(turnPrompt(legacy), null);

  live.nextCorner = 1;
  assert.equal(turnWindowFor(live), TURN_WINDOW_SECONDS,
    'only the first current-trail turn gets the wider read window');
});

test("a wrong direction can be corrected before the deadline", () => {
  const {run, corner} = fixture(1);
  const wrong = corner.direction === "left" ? "right" : "left";
  act(run, wrong);
  assert.equal(turnPrompt(run).status, "wrong");
  assert.equal(run.lane, 1, "a turn attempt is not also a lane change");
  act(run, corner.direction);
  assert.equal(turnPrompt(run).status, "accepted");
  cross(run, corner);
  assert.equal(run.turns, 1);
  assert.equal(run.hearts, 3);
});

test("missing or keeping a wrong turn costs one recoverable heart exactly once", () => {
  for (const wrongInput of [false, true]) {
    const {run, corner} = fixture(0);
    if (wrongInput) act(run, "right");
    cross(run, corner);
    assert.equal(run.hearts, 2);
    assert.equal(run.turns, 0);
    assert.equal(run.missedTurns, 1);
    assert.deepEqual(run.lastMistake, {type: "corner", direction: "left"});
    assert.equal(run.events.filter((event) => event === "missed-turn-left").length, 1);
    const distance = run.distance;
    for (let i = 0; i < 120; i++) step(run, 1 / 120);
    assert.ok(run.distance > distance, "the run recovers and continues");
    assert.equal(run.hearts, 2);
    assert.equal(run.missedTurns, 1);
  }
});

test("shield protects a missed corner but Zoomies never turns for the player", () => {
  const {run, corner} = fixture(0);
  run.shield = 1;
  run.zoomies = 4;
  cross(run, corner);
  assert.equal(run.hearts, 3);
  assert.equal(run.shield, 0);
  assert.equal(run.missedTurns, 1);
  assert.ok(run.events.includes("shield-break"));
  assert.ok(!run.events.includes("turn-left"));
});

test("late input cannot rescue a resolved turn and pausing advances no deadline", () => {
  const paused = fixture(0);
  const before = turnPrompt(paused.run);
  const state = {distance: paused.run.distance, time: paused.run.time, seconds: before.seconds};
  const after = turnPrompt(paused.run);
  assert.deepEqual(
    {distance: paused.run.distance, time: paused.run.time, seconds: after.seconds},
    state,
  );

  const {run, corner} = fixture(0, .02);
  cross(run, corner);
  const lane = run.lane;
  act(run, corner.direction);
  assert.equal(run.turns, 0);
  assert.equal(run.missedTurns, 1);
  assert.equal(run.lane, Math.max(0, lane - 1), "late input is an ordinary lane input");
});

test("generation reserves an uncluttered approach and recovery with one marker", () => {
  for (let index = 0; index < 12; index++) {
    const corner = cornerByIndex(index);
    const run = createRun(index + 40);
    Object.assign(run, {
      distance: Math.max(0, corner.at - 170),
      nextCorner: index,
      nextRow: Math.max(45, corner.at - 100),
      nextChoice: Infinity,
      choicePending: null,
      nextZipline: Infinity,
      row: 12,
      objects: [],
    });
    fillTrack(run);
    const clutter = run.objects.filter((object) =>
      (HAZARDS.includes(object.type) || PICKUPS.includes(object.type)) &&
      object.at >= corner.approach && object.at <= corner.recovery,
    );
    assert.deepEqual(clutter, []);
    assert.equal(run.objects.filter((object) => object.turnIndex === index).length, 1);
    const warmup = run.objects.filter((object) => object.turnReward === index);
    assert.equal(warmup.length, 3, 'the clear approach has a short reward lead-in');
    assert.ok(warmup.every((object) => object.type === 'bone' && object.at < corner.approach));
    assert.equal(cornerIntersecting(corner.approach, corner.recovery).index, index);
    const count = run.objects.length;
    fillTrack(run);
    assert.equal(run.objects.length, count, "refilling does not duplicate a marker");
  }
});

test("manual fixture jumps do not cause retroactive misses, and hazards record their cause", () => {
  const run = createRun(3);
  Object.assign(run, {
    distance: 2000,
    objects: [],
    nextRow: Infinity,
    nextChoice: Infinity,
    choicePending: null,
    nextZipline: Infinity,
  });
  step(run, 1 / 120);
  assert.equal(run.hearts, 3);
  assert.equal(run.nextCorner, 3);

  const hazard = createRun(4);
  Object.assign(hazard, {
    objects: [{id: 500, at: 1, lane: 1, type: "rock", used: false}],
    nextRow: Infinity,
    nextChoice: Infinity,
    choicePending: null,
    nextZipline: Infinity,
  });
  while (hazard.distance < 3) step(hazard, 1 / 120);
  assert.deepEqual(hazard.lastMistake, {type: "rock"});
  assert.equal(hazard.hearts, 2);
  assert.ok(Math.abs(hazard.x - LANES[1]) < .001);
});

test('turns stay fair at Zoomies speed because the window is time-based',()=>{
  // The prompt opens a full 1.0s window at any pace, so the same reaction
  // turns as reliably boosted as it does at base speed. This locks the
  // audit's open Zoomies-turn question on the sim side; sign readability at
  // speed still needs eyes on hardware.
  for (const zoomies of [0, 4]) {
    const corner = cornerByIndex(2);
    const run = createRun(1989);
    const speed = zoomies > 0 ? 46.8 : 36;
    Object.assign(run, {
      distance: corner.at - speed * 0.4,
      nextCorner: 2,
      objects: [],
      nextRow: Infinity,
      nextChoice: Infinity,
      choicePending: null,
      nextZipline: Infinity,
      events: [],
      speed,
      zoomies,
    });
    assert.ok(turnPrompt(run), 'prompt open at both paces');
    for (let i = 0; i < Math.round(0.3 * 120); i++) step(run, 1 / 120);
    act(run, corner.direction);
    cross(run, corner);
    assert.equal(run.turns, 1, `zoomies=${zoomies}: committed turn accepted`);
    assert.equal(run.hearts, 3);
    assert.ok(run.events.includes(`turn-${corner.direction}`));
  }
});
