import test from "node:test";
import assert from "node:assert/strict";
import {
  centerline,
  routeFrame,
  routeOffset,
  routeHeading,
  tangent,
} from "../src/runner/route.js";
import { terrainProfile } from "../src/runner/terrain.js";

test("opening trail has a visible bend rather than a straight horizon", () => {
  assert.ok(Math.abs(routeOffset(0, -60)) > 12);
  assert.ok(Number.isFinite(centerline(60)));
  assert.ok(Number.isFinite(tangent(60)));
});

test("winding track remains centered and tangent-aligned at the player", () => {
  for (let distance = 0; distance < 10000; distance += 13) {
    const frame = routeFrame(distance, 0);
    assert.deepEqual([frame.x, frame.y, frame.z, frame.yaw], [0, 0, 0, 0]);
    assert.equal(routeOffset(distance, 0), 0);
    assert.equal(routeHeading(distance, 0), 0);
    assert.ok(Math.abs(routeOffset(distance, -0.01)) < 0.00001);
    assert.ok(Object.values(routeFrame(distance, -170)).every(Number.isFinite));
  }
});

test("track bends both ways without abrupt jumps between frames", () => {
  const offsets = [];
  for (let distance = 0; distance < 1500; distance += 1) {
    offsets.push(routeOffset(distance, -60));
    assert.ok(
      Math.abs(routeOffset(distance + 0.3, -60) - routeOffset(distance, -60)) <
        1.6,
    );
  }
  assert.ok(Math.min(...offsets) < -20);
  assert.ok(Math.max(...offsets) > 20);
});

test("ninety-degree corners have true arc geometry and matching yaw", () => {
  const left = routeFrame(150, -25);
  assert.ok(left.x < -10);
  assert.ok(left.z < -10);
  assert.ok(Math.abs(left.yaw - Math.PI / 2) < 0.001);

  const right = routeFrame(950, -25);
  assert.ok(right.x > 10);
  assert.ok(right.z < -10);
  assert.ok(Math.abs(right.yaw + Math.PI / 2) < 0.001);
});

test("centerline distance is preserved through straights and corners", () => {
  for (const start of [0, 140, 150, 162.5, 900, 950, 1390, 1550, 2350]) {
    const a = routeFrame(0, -start, { flat: true });
    const b = routeFrame(0, -(start + 0.25), { flat: true });
    assert.ok(Math.abs(Math.hypot(b.x - a.x, b.z - a.z) - 0.25) < 0.001);
  }
});

test("route frames stay continuous and finite over very long runs", () => {
  for (const boundary of [1400, 2800, 280000]) {
    const before = routeFrame(boundary - 0.001, -120);
    const after = routeFrame(boundary + 0.001, -120);
    assert.ok(Object.values(before).every(Number.isFinite));
    assert.ok(Object.values(after).every(Number.isFinite));
    assert.ok(Math.hypot(after.x - before.x, after.z - before.z) < 0.02);
    assert.ok(Math.abs(after.y - before.y) < 0.002);
  }
});

test("elevation is meaningful but level through corners and special traversal", () => {
  const rolling = [330, 390, 450, 500, 1040, 1250].map(terrainProfile);
  assert.ok(Math.max(...rolling.map((point) => point.height)) > 1);
  assert.ok(Math.min(...rolling.map((point) => point.height)) < -1);

  for (const station of [105, 150, 175, 195, 180, 230, 280, 620, 700, 790, 820]) {
    assert.deepEqual(terrainProfile(station), { height: 0, slope: 0 });
  }
  for (let station = 0; station < 15000; station += 0.5) {
    const point = terrainProfile(station);
    assert.ok(Math.abs(point.height) < 3.8);
    assert.ok(Math.abs(point.slope) < 0.18);
  }
});
