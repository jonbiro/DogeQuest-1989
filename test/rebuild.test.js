import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorld, update, respawn, WORLDS } from "../src/rebuild/world.js";
const tick = (w, input = {}, count = 1) => {
  for (let i = 0; i < count; i++)
    update(w, { direction: 0, ...input }, 1 / 120);
};
test("all five handcrafted trails have safe starts, checkpoints and reachable ground gaps", () => {
  for (let i = 0; i < WORLDS.length; i++) {
    const w = createWorld(i);
    tick(w, {}, 120);
    assert.equal(w.player.grounded, true);
    assert.equal(w.deaths, 0);
    assert.ok(
      w.spec.ground.some(
        ([x, width]) =>
          w.spec.checkpoint >= x && w.spec.checkpoint + 30 <= x + width,
      ),
    );
    for (let j = 1; j < w.spec.ground.length; j++)
      assert.ok(
        w.spec.ground[j][0] -
          (w.spec.ground[j - 1][0] + w.spec.ground[j - 1][1]) <=
          180,
      );
  }
});
test("jump is buffered, double jump refreshes lift, and a third jump is rejected", () => {
  const w = createWorld(0);
  tick(w, {}, 120);
  tick(w, { jumpPressed: true });
  assert.ok(w.player.vy < 0);
  tick(w, {}, 16);
  tick(w, { jumpPressed: true });
  assert.equal(w.player.jumps, 2);
  const speed = w.player.vy;
  tick(w, { jumpPressed: true });
  assert.ok(w.player.vy > speed);
});
test("checkpoint respawn preserves collected bones and allows unlimited retries", () => {
  const w = createWorld(0);
  w.checkpoint = true;
  w.bones[0].taken = true;
  w.collected = 1;
  for (let i = 0; i < 20; i++) respawn(w);
  assert.equal(w.player.x, w.spec.checkpoint);
  assert.equal(w.deaths, 20);
  assert.equal(w.collected, 1);
  assert.equal(w.bones[0].taken, true);
});
test("home completes a course without requiring optional bones", () => {
  const w = createWorld(0);
  w.player.x = w.spec.length - 130;
  w.player.y = 250;
  tick(w);
  assert.equal(w.finished, true);
  assert.equal(w.collected, 0);
  const time = w.time;
  tick(w, {}, 120);
  assert.equal(w.time, time);
});
test("a falling player can stomp a patrol and bounce without a death", () => {
  const w = createWorld(0),
    e = w.enemies[0];
  w.player.x = e.x;
  w.player.y = e.y - w.player.h - 1;
  w.player.vy = 240;
  tick(w);
  assert.equal(e.alive, false);
  assert.equal(w.deaths, 0);
  assert.ok(w.player.vy < 0);
});
test("every trail can be completed through simulated input with enemies enabled", () => {
  for (let n = 0; n < 5; n++) {
    const w = createWorld(n);
    for (let i = 0; i < 120 * 60 && !w.finished; i++) {
      const p = w.player;
      const ground = w.spec.ground.find(
        ([x, width]) => p.x >= x && p.x < x + width,
      );
      const enemy = w.enemies.find(
        (e) => e.alive && e.x > p.x && e.x - p.x < 100,
      );
      const jump =
        (p.grounded &&
          ((ground && ground[0] + ground[1] - p.x < 95) || enemy)) ||
        (!p.grounded && p.jumps === 1 && p.vy > 30);
      update(
        w,
        { direction: 1, run: true, jumpPressed: Boolean(jump) },
        1 / 120,
      );
    }
    assert.equal(w.finished, true, `trail ${n + 1} must be completable`);
  }
});
