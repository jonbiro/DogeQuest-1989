import test from "node:test";
import assert from "node:assert/strict";
import { routeOffset, routeHeading } from "../src/runner/route.js";
test("winding track remains centered and tangent-aligned at the player", () => {
  for (let distance = 0; distance < 10000; distance += 13) {
    assert.equal(routeOffset(distance, 0), 0);
    assert.equal(Math.abs(routeHeading(distance, 0)), 0);
    assert.ok(Math.abs(routeOffset(distance, -0.01)) < 0.00001);
    assert.ok(Number.isFinite(routeOffset(distance, -170)));
  }
});
test("track bends both ways without abrupt jumps between frames", () => {
  const offsets = [];
  for (let distance = 0; distance < 1500; distance += 1) {
    offsets.push(routeOffset(distance, -60));
    assert.ok(
      Math.abs(routeOffset(distance + 0.3, -60) - routeOffset(distance, -60)) <
        0.15,
    );
  }
  assert.ok(Math.min(...offsets) < -5);
  assert.ok(Math.max(...offsets) > 5);
});
