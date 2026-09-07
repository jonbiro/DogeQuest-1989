import test from "node:test";
import assert from "node:assert/strict";
import {createRun, fillTrack, step, act, HAZARDS} from "../src/runner/world.js";

function sequence(row = 12, route = null, nextChoice = 2000) {
  const run = createRun(17);
  Object.assign(run, {distance: 700, nextRow: 720, row, objects: [], route, nextChoice, choicePending: null});
  fillTrack(run);
  return run;
}

test("authored sequences alternate full-width jumps and ducks with a gift finish", () => {
  for (const [row, types] of [[12, ["log", "gate", "log"]], [28, ["gate", "log", "gate"]]]) {
    const run = sequence(row);
    types.forEach((type, beat) => {
      const hazards = run.objects.filter(o => HAZARDS.includes(o.type) && o.at === 720 + beat * 48);
      assert.equal(hazards.length, 3);
      assert.ok(hazards.every(o => o.type === type));
    });
    assert.ok(run.objects.some(o => o.type === "gift" && o.at === 836));
  }
});

test("sequences respect scenic routes and decision gate approaches", () => {
  const scenic = sequence(12, {kind: "scenic", until: 1000});
  assert.equal(scenic.objects.filter(o => HAZARDS.includes(o.type) && o.at === 720).length, 1);
  const nearGate = sequence(12, null, 850);
  assert.ok(nearGate.objects.filter(o => HAZARDS.includes(o.type)).every(o => o.at < 805));
});

test("both sequences are clearable at maximum normal speed with base and upgraded moves", () => {
  for (const row of [12, 28]) for (const leap of [0, 3]) {
    const run = sequence(row);
    run.upgrades.leap = leap;
    // Move the sequence to the capped-speed portion of an ordinary run.
    run.objects = run.objects.filter(o => o.at < 864).map(o => ({...o, at: o.at + 1500}));
    run.distance += 1500;
    run.speed = 36;
    run.nextRow = 99999;
    run.choicePending = 99999;
    const acted = new Set();
    while (run.distance < 2350 && !run.ended) {
      const next = run.objects.find(o => HAZARDS.includes(o.type) && !o.passed && o.at > run.distance);
      if (next && next.at - run.distance < run.speed * .4 && !acted.has(next.at)) {
        act(run, next.type === "gate" ? "slide" : "jump");
        acted.add(next.at);
      }
      step(run, 1 / 120);
    }
    assert.equal(run.hearts, 3);
    assert.equal(run.clears, 3);
    assert.equal(run.gifts, 1);
  }
});
