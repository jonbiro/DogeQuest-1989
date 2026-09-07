import test from "node:test";
import assert from "node:assert/strict";
import {
  missionFor,
  missionProgress,
  claimMission,
} from "../src/runner/missions.js";
import { createRun, act, step } from "../src/runner/world.js";
test("challenges rotate through distance, bones and clears with increasing targets", () => {
  assert.deepEqual(
    [0, 1, 2].map((i) => missionFor(i).metric),
    ["distance", "bones", "clears"],
  );
  assert.equal(missionFor(3).target, 450);
  assert.equal(missionFor(3).reward, 350);
  assert.equal(missionFor(-1).id, 0);
});
test("challenge rewards require a completed run and can only be paid once", () => {
  const profile = { challenges: 0, credits: 50 },
    mission = missionFor(0),
    run = { distance: 310, ended: false };
  assert.equal(missionProgress(run, mission), 300);
  assert.equal(claimMission(profile, run, mission), 0);
  run.ended = true;
  assert.equal(claimMission(profile, run, mission), 250);
  assert.equal(profile.credits, 300);
  assert.equal(profile.challenges, 1);
  assert.equal(claimMission(profile, run, mission), 0);
  assert.equal(profile.credits, 300);
});
test("unfinished challenges do not consume the next goal or pay a reward", () => {
  const profile = { challenges: 2, credits: 0 };
  assert.equal(
    claimMission(profile, { clears: 5, ended: true }, missionFor(2)),
    0,
  );
  assert.equal(profile.challenges, 2);
});
test("a missed bone resets a streak once, and ten new bones award a bonus", () => {
  const run = createRun(1);
  run.nextRow = 9999;
  run.combo = 4;
  run.objects = [{ id: 900, type: "bone", lane: 0, at: -3 }];
  step(run, 1 / 120);
  assert.equal(run.combo, 0);
  for (let i = 0; i < 10; i++) {
    run.objects.push({
      id: 1000 + i,
      type: "bone",
      lane: 1,
      at: run.distance + 0.1,
    });
    step(run, 1 / 120);
  }
  assert.equal(run.combo, 10);
  assert.equal(run.bonusPoints, 100);
});
test("a clean slide awards skill points and mission credit only once", () => {
  const run = createRun(1);
  run.nextRow = 9999;
  run.objects = [{ id: 900, type: "gate", lane: 1, at: 2 }];
  act(run, "slide");
  for (let i = 0; i < 90; i++) step(run, 1 / 120);
  assert.equal(run.hearts, 3);
  assert.equal(run.clears, 1);
  assert.equal(run.bonusPoints, 20);
});
