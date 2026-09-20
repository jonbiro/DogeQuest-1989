import test from "node:test";
import assert from "node:assert/strict";
import { createRun, step } from "../src/runner/world.js";
import { WADE_FIRST, WADE_PERIOD, WADE_LENGTH, wadeByIndex, wadeIntersecting } from "../src/runner/wade.js";
import { RAIL_FIRST, RAIL_PERIOD, RAIL_LENGTH, railByIndex, railIntersecting } from "../src/runner/rail.js";
import { dogChaseByIndex } from "../src/runner/dog-chase.js";

test("wade and rail grids are fixed, periodic and self-describing", () => {
  assert.equal(WADE_FIRST, 4160);
  assert.equal(WADE_PERIOD, 1400);
  assert.equal(WADE_LENGTH, 110);
  assert.equal(RAIL_FIRST, 3310);
  assert.equal(RAIL_PERIOD, 1400);
  assert.equal(RAIL_LENGTH, 40);
  assert.deepEqual(wadeByIndex(0), {index: 0, start: 4160, end: 4270});
  assert.equal(wadeByIndex(1).start, 5560);
  assert.deepEqual(railByIndex(0), {index: 0, start: 3310, end: 3350});
  assert.equal(railByIndex(2).start, 6110);
  assert.equal(wadeByIndex(-1), null);
  assert.equal(railByIndex(-1), null);
  assert.ok(wadeIntersecting(4150, 4280));
  assert.equal(wadeIntersecting(4281, 4400), null);
  assert.ok(railIntersecting(3300, 3360));
  assert.equal(railIntersecting(3361, 3500), null);
  // Default runs schedule both chapters; pre-v6 runs never do.
  const v6 = createRun(11, {}, 6);
  assert.equal(v6.nextWade, WADE_FIRST);
  assert.equal(v6.nextRail, RAIL_FIRST);
  const v5 = createRun(11, {}, 5);
  assert.equal(v5.nextWade, Infinity);
  assert.equal(v5.nextRail, Infinity);
});

function collectChapters(seed, maxDistance = 9000) {
  const run = createRun(seed, {}, 6);
  const wades = [];
  const rails = [];
  let guard = 0;
  while (!run.ended && run.distance < maxDistance && guard++ < 400000) {
    run.hearts = 3;
    run.invulnerable = 1000;
    step(run, 1 / 120);
    for (const o of run.objects) {
      if (o.type === "wade-start" && !o.counted) {
        o.counted = true;
        wades.push(Math.round(o.at));
      }
      if (o.type === "rail-start" && !o.counted) {
        o.counted = true;
        rails.push(Math.round(o.at));
      }
    }
  }
  return {run, wades, rails};
}

test("scheduled wade and rail emit on their grids in endless runs", () => {
  for (const seed of [0, 1, 2, 5, 7, 11, 42, 99]) {
    const {run, wades, rails} = collectChapters(seed);
    assert.ok(wades.length >= 1, `seed ${seed} meets wade water`);
    assert.ok(rails.length >= 1, `seed ${seed} meets a root rail`);
    for (const at of wades)
      assert.equal((at - WADE_FIRST) % WADE_PERIOD, 0, `seed ${seed}: wade at ${at} sits on the grid`);
    for (const at of rails)
      assert.equal((at - RAIL_FIRST) % RAIL_PERIOD, 0, `seed ${seed}: rail at ${at} sits on the grid`);
    // Scheduler fields keep advancing past skipped slots, never backwards.
    assert.ok(Number.isFinite(run.nextWade) && (run.nextWade - WADE_FIRST) % WADE_PERIOD === 0);
    assert.ok(Number.isFinite(run.nextRail) && (run.nextRail - RAIL_FIRST) % RAIL_PERIOD === 0);
  }
  // Seed 0 deals the textbook firsts: wade water at 4160.
  const {wades} = collectChapters(0);
  assert.equal(wades[0], 4160);
});

test("emitted wade and rail never overlap a dog chase", () => {
  // Mutual exclusion has to hold in practice, not just in the reservation
  // lists: every emitted stretch must clear every chase window on the grid.
  for (const seed of [0, 1, 2, 5, 7, 11, 42, 99]) {
    const {wades, rails} = collectChapters(seed);
    const chases = [];
    for (let i = 0; i < 6; i++) {
      const c = dogChaseByIndex(i, 2780);
      chases.push([c.start - 28, c.end + 24]);
    }
    for (const at of [...wades.map((s) => [s - 10, s + 120]), ...rails.map((s) => [s - 10, s + 50])]) {
      for (const [cs, ce] of chases)
        assert.ok(at[1] < cs || at[0] > ce, `seed ${seed}: stretch ${at} clears chase ${cs}-${ce}`);
    }
  }
});
