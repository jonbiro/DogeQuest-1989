import test from "node:test";
import assert from "node:assert/strict";
import { WORLD_MOODS, moodStarlitWeight } from "../src/runner/areas.js";
import { CLOUD_COUNT, CLOUD_PUFFS, CLOUD_SPAN, cloudLayout, cloudFrame } from "../src/runner/clouds.js";

test("starlit weight tracks the mood blend and nothing else", () => {
  const starlit = WORLD_MOODS.findIndex((m) => m.id === "starlit");
  const fresh = WORLD_MOODS.findIndex((m) => m.id === "fresh");
  assert.equal(moodStarlitWeight({index: starlit, previous: starlit, blend: 1}), 1);
  assert.equal(moodStarlitWeight({index: fresh, previous: fresh, blend: 1}), 0);
  assert.equal(moodStarlitWeight({index: starlit, previous: fresh, blend: 0.3}), 0.3);
  assert.equal(moodStarlitWeight({index: fresh, previous: starlit, blend: 0.3}), 0.7);
  assert.equal(moodStarlitWeight({}), 0);
  assert.equal(moodStarlitWeight(null), 0);
});

test("cloud layouts are deterministic per seed and bounded", () => {
  const a = cloudLayout(1989);
  const b = cloudLayout(1989);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, cloudLayout(1990));
  assert.equal(a.length, CLOUD_COUNT);
  for (const c of a) {
    assert.ok(c.x >= 0 && c.x < CLOUD_SPAN);
    assert.ok(c.y >= 26 && c.y <= 64);
    assert.ok(c.z >= -130 && c.z <= -70);
    assert.ok(c.scale >= 9 && c.scale <= 18);
    assert.ok(c.drift > 0);
    assert.ok(c.lobeDs >= 0.55 && c.lobeDs <= 0.75);
  }
});

test("cloud frames wrap the span and freeze under reduced motion", () => {
  const layout = cloudLayout(7);
  for (let i = 0; i < CLOUD_COUNT; i++) {
    for (const [distance, time] of [[0, 0], [1500, 40], [8000, 300]]) {
      const f = cloudFrame(layout, i, distance, time);
      assert.ok(f.x >= -100 && f.x < 100, `cloud ${i} stays on stage`);
      assert.ok(Math.abs(f.y - layout[i].y) <= 1.6, `cloud ${i} bobs gently`);
      assert.equal(f.z, layout[i].z);
      const still = cloudFrame(layout, i, distance, time, true);
      assert.equal(still.y, layout[i].y, `cloud ${i} holds still for reduced motion`);
      assert.equal(still.z, layout[i].z);
    }
  }
  // Drift moves clouds forward over time (modulo the wrap).
  const before = cloudFrame(layout, 0, 0, 0).x;
  const after = cloudFrame(layout, 0, 0, 5).x;
  const moved = after >= before ? after - before : after - before + CLOUD_SPAN;
  assert.ok(moved > 0 && moved < CLOUD_SPAN, "clouds drift with time");
  assert.equal(CLOUD_COUNT * CLOUD_PUFFS, 28);
});
