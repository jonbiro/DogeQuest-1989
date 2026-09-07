import test from "node:test";
import assert from "node:assert/strict";
import { createRun, act, step, LANES } from "../src/runner/world.js";
function advance(run, seconds) {
  for (let i = 0; i < Math.ceil(seconds * 120); i++) step(run, 1 / 120);
}
function obstacle(type) {
  const run = createRun(1);
  run.objects = [{ id: 999, at: 3, lane: 1, type, used: false }];
  run.nextRow = 500;
  return run;
}
test("runner seeds reproduce a route with an unobstructed lane in every row", () => {
  for (let seed = 0; seed < 50; seed++) {
    const a = createRun(seed),
      b = createRun(seed);
    assert.deepEqual(a.objects, b.objects);
    for (let distance = 0; distance < 3000; distance += 100) {
      a.distance = distance;
      a.invulnerable = 100;
      step(a, 1 / 120);
      const rows = new Map();
      for (const object of a.objects.filter((o) =>
        ["rock", "log", "arch"].includes(o.type),
      )) {
        if (!rows.has(object.at)) rows.set(object.at, new Set());
        rows.get(object.at).add(object.lane);
      }
      for (const lanes of rows.values()) assert.ok(lanes.size <= 2);
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
  assert.equal(run.bones, 1);
  advance(run, 0.4);
  assert.equal(run.bones, 1);
  assert.equal(run.magnet, 0);
  assert.equal(run.score, Math.floor(run.distance) + 25);
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
        ["rock", "log", "arch"].includes(o.type) &&
        o.at > run.distance &&
        o.at - run.distance < 20,
    );
    if (next) {
      const blocked = new Set(
        run.objects
          .filter(
            (o) => o.at === next.at && ["rock", "log", "arch"].includes(o.type),
          )
          .map((o) => o.lane),
      );
      run.lane = [0, 1, 2].find((lane) => !blocked.has(lane));
    }
    step(run, 1 / 120);
  }
  assert.equal(run.ended, false);
  assert.equal(run.hearts, 3);
  assert.ok(run.distance > 2000);
  assert.ok(run.speed <= 25);
});
