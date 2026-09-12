import test from "node:test";
import assert from "node:assert/strict";
import {
  missionFor,
  missionProgress,
  claimMission,
  missionTip,
} from "../src/runner/missions.js";
import { createRun, act, step } from "../src/runner/world.js";
test('every mission has actionable instructions for its actual scoring rule',()=>{
  for(let i=0;i<14;i++) assert.ok(missionTip(missionFor(i)).length>60);
  assert.match(missionTip(missionFor(7)),/Picked-up magnets do not count/);
  assert.match(missionTip(missionFor(8)),/650 m/);
  assert.match(missionTip(missionFor(9)),/all three beats/);
  assert.match(missionTip(missionFor(10)),/Missing a bone resets/);
  assert.match(missionTip({metric:'unknown'}),/bank the reward/);
});
test('adventure missions reward traversal, active powers and mastery after the introduction',()=>{
  assert.deepEqual([6,7,8,9,10].map(i=>missionFor(i).metric),
    ['turns','fetchUses','ziplines','regionalCourses','bestCombo']);
  const run={ended:true,turns:2,fetchUses:1,ziplines:1,regionalCourses:[0,1,0],bestCombo:10};
  for(let id=6;id<=10;id++){
    const mission=missionFor(id),profile={challenges:id,credits:0};
    assert.equal(missionProgress(run,mission),mission.target);
    assert.equal(claimMission(profile,run,mission),mission.reward);
    assert.equal(claimMission(profile,run,mission),0);
    assert.equal(profile.credits,mission.reward);
  }
  assert.equal(missionProgress({regionalCourses:[1,1,1]},missionFor(25)),3);
  assert.equal(missionProgress({},missionFor(9)),0);
});
test('late missions stay bounded and invalid progress indices fall back safely',()=>{
  for(let i=6;i<1000;i++){
    const mission=missionFor(i);
    assert.ok(mission.target>0 && mission.target<=mission.cap);
    assert.ok(mission.reward<=1300);
  }
  for(const input of [Infinity,-Infinity,NaN,'invalid'])
    assert.equal(missionFor(input).id,0);
});
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
