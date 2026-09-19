import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {URL} from "node:url";
import {createRun, step} from "../src/runner/world.js";

const renderSource = readFileSync(new URL("../src/runner/render.js", import.meta.url), "utf8");
const visibilitySource = readFileSync(new URL("../src/runner/visibility.js", import.meta.url), "utf8");

test('v6 stations have render templates reusing shared helpers (no new geometries)', () => {
  for (const type of ["climb-start", "climb-end", "glide-start", "glide-end", "wade-start", "wade-end", "rail-start", "rail-end"])
    assert.ok(renderSource.includes(`"${type}"`), `template for ${type}`);
  // Stations compose via shared box()/ball() helpers, not bespoke geometry factories.
  const stationBlock = renderSource.slice(renderSource.indexOf('v6 traversal stations'), renderSource.indexOf('v6 traversal stations') + 2500);
  assert.ok(stationBlock.includes('box(station') || stationBlock.includes('ball(station'));
  assert.ok(!stationBlock.includes('Geometry('));
});

test('v6 stations are overhead-hidden past the camera and beaconed on approach', () => {
  for (const type of ["climb-start", "glide-start", "wade-start", "rail-start"])
    assert.ok(visibilitySource.includes(type), `visibility knows ${type}`);
  assert.ok(renderSource.includes("'climb-start'") && renderSource.includes("'glide-start'"));
});

test('v6 climb/glide skip reserved windows instead of overlapping corners', () => {
  // Seed 42 corner at 950 overlaps climb 900-924: scheduler must skip, not stack.
  const run = createRun(42, {}, 6);
  run.invulnerable = 1000;
  for (let i = 0; i < 6000; i++) { run.hearts = 3; step(run, 1 / 120); if (run.distance > 1000) break; }
  const climbs = run.objects.filter(o => o.type === "climb-start");
  for (const c of climbs) {
    // No climb inside a corner approach/recovery (corners at 150/950 period 1400, clear 45).
    const nearCorner = [150, 950].some(at => Math.abs(c.at - at) < 75);
    assert.equal(nearCorner, false, `climb at ${c.at} overlaps corner`);
  }
});

test('v6 trims warmup quiet after the first pass but keeps recovery', () => {
  const early = createRun(1, {}, 6);
  early.distance = 100;
  early.nextRow = 100;
  const late = createRun(1, {}, 6);
  late.distance = 2000;
  late.nextRow = 2000;
  // Both advance without throwing; late run emits denser action rows.
  for (let i = 0; i < 600; i++) { early.hearts = late.hearts = 3; early.invulnerable = late.invulnerable = 1000; step(early, 1 / 120); step(late, 1 / 120); }
  const lateActions = late.objects.filter(o => ["log", "gate", "rock", "gap"].includes(o.type)).length;
  assert.ok(lateActions > 0);
});

test('v6 long run stays deterministic with all verbs present', () => {
  const a = createRun(99, {}, 6);
  const b = createRun(99, {}, 6);
  for (let i = 0; i < 12000; i++) {
    a.hearts = b.hearts = 3; a.invulnerable = b.invulnerable = 1000;
    step(a, 1 / 120); step(b, 1 / 120);
    if (a.distance > 4000) break;
  }
  assert.equal(a.distance, b.distance);
  assert.deepEqual(a.objects.map(o => o.type), b.objects.map(o => o.type));
  assert.ok(a.nextClimb > 850 && a.nextGlide > 420);
});

test('v6 generation never rewinds nextRow (no duplicate rows over live content)', () => {
  // A stale station slot once emitted behind the frontier, dragging nextRow
  // backward and double-generating hazards inside the zipline aerial route.
  for (const seed of [1, 42]) {
    const run = createRun(seed, {}, 6);
    let floor = run.nextRow;
    let guard = 0;
    while (run.distance < 8000 && guard++ < 60000) {
      run.hearts = 3; run.invulnerable = 1000;
      step(run, 1 / 120);
      assert.ok(run.nextRow >= floor - 1e-9, `seed ${seed}: nextRow rewound ${floor} -> ${run.nextRow}`);
      floor = Math.max(floor, run.nextRow);
    }
  }
});

test('v6 adventure always meets the climb wall and the glide shimmer', () => {
  for (const seed of [42, 7, 99, 1234]) {
    const run = createRun(seed, {}, 6, null, {encounterPacing: true, mode: 'adventure'});
    let guard = 0;
    while (!run.ended && guard++ < 20000) { run.hearts = 3; run.invulnerable = 1000; step(run, 1 / 120); }
    assert.equal(run.finishReason, 'destination');
    assert.ok(run.nextClimb > 850, `seed ${seed}: climb never emitted`);
    assert.ok(run.nextGlide > 420, `seed ${seed}: glide never emitted`);
    assert.equal(run.climb, null, 'no stranded climb behind the results modal');
    assert.equal(run.glide, null, 'no stranded glide behind the results modal');
  }
});
