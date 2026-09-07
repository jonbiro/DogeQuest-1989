import test from "node:test";
import assert from "node:assert/strict";
import { createRun, act, step, LANES, HAZARDS } from "../src/runner/world.js";
import { levels, purchase } from "../src/runner/progression.js";
function advance(run, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 120); i++) step(run, 1 / 120);
}
function obstacle(type) {
  const run = createRun(1);
  run.objects = [{ id: 999, at: 3, lane: 1, type, used: false }];
  run.nextRow = 500;
  return run;
}
test("runner seeds reproduce solvable open-lane or uniform action rows", () => {
  for (let seed = 0; seed < 50; seed++) {
    const a = createRun(seed),
      b = createRun(seed);
    assert.deepEqual(a.objects, b.objects);
    for (let distance = 0; distance < 3000; distance += 100) {
      a.distance = distance;
      a.invulnerable = 100;
      step(a, 1 / 120);
      const rows = new Map();
      for (const object of a.objects.filter((o) => HAZARDS.includes(o.type))) {
        if (!rows.has(object.at)) rows.set(object.at, new Set());
        rows.get(object.at).add(object.lane);
      }
      for (const [at, lanes] of rows)
        if (lanes.size === 3) {
          const obstacles = a.objects.filter(
            (o) => o.at === at && HAZARDS.includes(o.type),
          );
          assert.equal(new Set(obstacles.map((o) => o.type)).size, 1);
          assert.ok(["log", "gate", "gap"].includes(obstacles[0].type));
        }
      assert.ok(a.objects.length < 80, "The active track stays bounded");
    }
  }
});
test("lane input is bounded and movement approaches the selected lane", () => {
  const run = createRun(2);
  for (let i = 0; i < 4; i++) act(run, "left");
  assert.equal(run.lane, 0);
  advance(run, 0.5);
  assert.ok(Math.abs(run.x - LANES[0]) < 0.01);
  for (let i = 0; i < 6; i++) act(run, "right");
  assert.equal(run.lane, 2);
});
test("jump clears logs and cannot stack in midair", () => {
  const run = obstacle("log");
  act(run, "jump");
  advance(run, 0.1);
  const vy = run.vy;
  act(run, "jump");
  assert.equal(run.vy, vy);
  advance(run, 0.5);
  assert.equal(run.hearts, 3);
});
test("slide clears arches, but not stone blocks", () => {
  const arch = obstacle("arch");
  act(arch, "slide");
  advance(arch, 0.4);
  assert.equal(arch.hearts, 3);
  const rock = obstacle("rock");
  act(rock, "slide");
  advance(rock, 0.4);
  assert.equal(rock.hearts, 2);
});
test("shield absorbs one hit and invulnerability prevents repeat damage", () => {
  const run = obstacle("rock");
  run.shield = 1;
  advance(run, 0.4);
  assert.equal(run.hearts, 3);
  assert.equal(run.shield, 0);
  run.objects.push({ id: 1000, lane: 1, type: "rock", at: run.distance + 1 });
  advance(run, 0.15);
  assert.equal(run.hearts, 3);
});
test("magnet collects off-lane bones once and expires", () => {
  const run = obstacle("bone");
  run.objects[0].lane = 0;
  run.magnet = 0.3;
  advance(run, 0.2);
  assert.equal(run.bones, 0, "Bone flies toward the dog before it is credited");
  assert.ok(run.objects[0].pull);
  advance(run, 0.1);
  assert.equal(run.bones, 1);
  advance(run, 0.4);
  assert.equal(run.bones, 1);
  assert.equal(run.magnet, 0);
  assert.equal(run.score, Math.floor(run.distance) + 25);
});
test("magnet attracts every lane at full speed and finishes pulls after expiry", () => {
  const run = createRun(4);
  run.distance = 3000;
  run.magnet = 0.08;
  run.y = 2;
  run.objects = [0, 1, 2].map((lane) => ({
    id: lane,
    type: "bone",
    lane,
    at: 3014,
  }));
  run.nextRow = 9999;
  advance(run, 0.1);
  assert.equal(run.magnet, 0);
  assert.equal(run.bones, 0);
  assert.ok(run.objects.every((object) => object.pull));
  act(run, "right");
  advance(run, 0.2);
  assert.equal(run.bones, 3);
  assert.equal(run.bonePoints, 75);
  advance(run, 0.5);
  assert.equal(run.bones, 3);
  assert.equal(run.effects.length, 0);
});
test("magnet does not pull distant bones or activate without a pickup", () => {
  const run = createRun(4);
  run.nextRow = 9999;
  run.objects = [
    { id: 1, type: "bone", lane: 0, at: 14 },
    { id: 2, type: "bone", lane: 2, at: 50 },
  ];
  advance(run, 0.1);
  assert.ok(run.objects.every((object) => !object.pull));
  run.magnet = 1;
  advance(run, 0.1);
  assert.ok(run.objects[0].pull);
  assert.equal(run.objects[1].pull, undefined);
});
test("airborne slides descend instead of teleporting; lane motion is timestep-independent", () => {
  const run = createRun(1);
  act(run, "jump");
  advance(run, 0.3);
  const y = run.y;
  act(run, "slide");
  assert.equal(run.y, y);
  advance(run, 0.025);
  assert.ok(run.y < y && run.y > 0);
  advance(run, 0.2);
  assert.equal(run.y, 0);
  const a = createRun(1),
    b = createRun(1);
  act(a, "left");
  act(b, "left");
  for (let i = 0; i < 30; i++) step(a, 1 / 60);
  for (let i = 0; i < 60; i++) step(b, 1 / 120);
  assert.ok(Math.abs(a.x - b.x) < 1e-9);
});
test("third collision ends the run and input and time stop", () => {
  const run = obstacle("rock");
  run.hearts = 1;
  advance(run, 0.4);
  assert.equal(run.ended, true);
  const distance = run.distance;
  const lane = run.lane;
  advance(run, 1);
  act(run, "left");
  assert.equal(run.distance, distance);
  assert.equal(run.lane, lane);
});
test("a lane-following runner survives a long seeded route at maximum difficulty", () => {
  const run = createRun(1989);
  for (let tick = 0; tick < 120 * 120; tick++) {
    const next = run.objects.find(
      (o) =>
        HAZARDS.includes(o.type) &&
        o.at > run.distance &&
        o.at - run.distance < 20,
    );
    if (next) {
      const blocked = new Set(
        run.objects
          .filter((o) => o.at === next.at && HAZARDS.includes(o.type))
          .map((o) => o.lane),
      );
      const safe = [0, 1, 2].find((lane) => !blocked.has(lane));
      if (safe !== undefined) run.lane = safe;
      else if (next.at - run.distance < run.speed * 0.6)
        act(run, next.type === "gate" ? "slide" : "jump");
    }
    step(run, 1 / 120);
  }
  assert.equal(run.ended, false);
  assert.equal(run.hearts, 3);
  assert.ok(run.distance > 2000);
  assert.ok(run.speed >= 35.9 && run.speed <= 46.8);
});
test("jump clears logs and blocks across a forgiving early-to-late input window", () => {
  for (const type of ["log", "rock"])
    for (const lead of [0.2, 0.4, 0.7, 0.9]) {
      const run = obstacle(type);
      run.objects[0].at = lead * 18;
      act(run, "jump");
      advance(run, 1.4);
      assert.equal(run.hearts, 3, `${type} with ${lead}s lead`);
    }
});
test("every overhead obstacle supports slides but catches upright runners", () => {
  for (const type of ["arch", "branch", "gate"]) {
    const run = obstacle(type);
    act(run, "slide");
    advance(run, 0.5);
    assert.equal(run.hearts, 3);
    const standing = obstacle(type);
    advance(standing, 0.5);
    assert.equal(standing.hearts, 2);
  }
});
test("treasure, multiplier and health pickups award their distinct bonuses once", () => {
  const gem = obstacle("gem");
  advance(gem, 0.3);
  assert.equal(gem.bonusPoints, 250);
  const double = obstacle("double");
  advance(double, 0.3);
  assert.ok(double.double > 9);
  double.objects.push({
    id: 1000,
    type: "bone",
    lane: 1,
    at: double.distance + 1,
  });
  advance(double, 0.2);
  assert.equal(double.bonePoints, 50);
  const heart = obstacle("heart");
  heart.hearts = 2;
  advance(heart, 0.3);
  assert.equal(heart.hearts, 3);
});
test("earned upgrades spend points, reject unaffordable purchases, and cap at level three", () => {
  const profile = { credits: 3300, upgrades: levels() };
  for (let i = 0; i < 3; i++) assert.equal(purchase(profile, "leap"), true);
  assert.equal(profile.credits, 0);
  assert.equal(profile.upgrades.leap, 3);
  assert.equal(purchase(profile, "leap"), false);
  assert.equal(purchase(profile, "magnet"), false);
  assert.equal(purchase(profile, "__proto__"), false);
});
test("upgrades affect the next run without changing the baseline or profile", () => {
  const run = createRun(1, { leap: 3, slide: 3, magnet: 3, value: 3 });
  act(run, "jump");
  assert.equal(run.vy, 15.5);
  act(run, "slide");
  assert.equal(run.slide, 1.75);
  run.objects = [
    { id: 900, type: "magnet", lane: 1, at: 2 },
    { id: 901, type: "bone", lane: 1, at: 4 },
  ];
  advance(run, 0.3);
  assert.ok(run.magnet > 18);
  assert.equal(run.bonePoints, 40);
  assert.equal(createRun(1).upgrades.leap, 0);
});
