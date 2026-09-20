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
      // Tuck under any vine whose strands hang over the path ahead.
      const vine = w.vines.find((v) => v.x + v.w > p.x && v.x - p.x < 110);
      const jump =
        (p.grounded &&
          ((ground && ground[0] + ground[1] - p.x < 95) || enemy)) ||
        (!p.grounded && p.jumps === 1 && p.vy > 30);
      update(
        w,
        { direction: 1, run: true, jumpPressed: Boolean(jump && !vine), duck: Boolean(vine) },
        1 / 120,
      );
    }
    assert.equal(w.finished, true, `trail ${n + 1} must be completable`);
  }
});

test("enemy rosters mix patrols, hoppers and chargers by world theme", () => {
  const kinds = (n) => createWorld(n).enemies.map((e) => e.kind);
  assert.deepEqual(kinds(0), ['patrol', 'patrol']);
  assert.ok(kinds(1).includes('hopper'));
  assert.ok(kinds(2).filter((k) => k === 'hopper').length >= 2);
  assert.ok(kinds(3).includes('charger'));
  assert.ok(kinds(4).includes('charger') && kinds(4).includes('hopper'));
  assert.ok(createWorld(4).enemies.every((e) => ['patrol', 'hopper', 'charger'].includes(e.kind)));
});

test("plain numbers stay patrols and unknown kinds fall back safely", () => {
  const w = createWorld(0);
  assert.ok(w.enemies.every((e) => e.kind === 'patrol'));
  WORLDS[0].enemies.push({x: 9999, kind: 'dragon'});
  try {
    assert.equal(createWorld(0).enemies.at(-1).kind, 'patrol');
  } finally {
    WORLDS[0].enemies.pop();
  }
});

test("hoppers bounce on a fixed period and land back on the patrol line", () => {
  const w = createWorld(1);
  const hopper = w.enemies.find((e) => e.kind === 'hopper');
  assert.ok(hopper);
  let minY = 406;
  // Sample to 4.7s: hops fire at 1.6s and 3.2s and both have landed again.
  for (let i = 0; i < Math.round(4.7 * 120); i++) {
    update(w, {direction: 0}, 1 / 120);
    if (hopper.y < minY) minY = hopper.y;
  }
  assert.ok(minY < 380, `hopper must leave the ground, reached ${minY}`);
  assert.equal(hopper.y, 406);
  assert.equal(hopper.vy, 0);
  // A second identical run hops in lockstep: the rhythm is deterministic.
  const again = createWorld(1);
  const other = again.enemies.find((e) => e.kind === 'hopper');
  for (let i = 0; i < Math.round(4.7 * 120); i++) update(again, {direction: 0}, 1 / 120);
  assert.equal(other.y, hopper.y);
  assert.equal(other.x, hopper.x);
});

test("chargers sweep faster and wider than patrols", () => {
  const w = createWorld(4);
  const charger = w.enemies.find((e) => e.kind === 'charger');
  const patrol = w.enemies.find((e) => e.kind === 'patrol');
  const cx0 = charger.x, px0 = patrol.x;
  for (let i = 0; i < 120; i++) update(w, {direction: 0}, 1 / 120);
  assert.ok(Math.abs(charger.x - cx0) > Math.abs(patrol.x - px0), 'charger covers more ground per second');
  assert.ok(Math.abs(charger.x - charger.origin) <= 110);
  for (let i = 0; i < 600; i++) update(w, {direction: 0}, 1 / 120);
  assert.ok(Math.abs(charger.x - charger.origin) <= 110, 'charger never leaves its range');
});

test("stomps work on hopping enemies with the same rules", () => {
  const w = createWorld(1);
  const hopper = w.enemies.find((e) => e.kind === 'hopper');
  w.player.x = hopper.x;
  w.player.y = hopper.y - w.player.h - 1;
  w.player.vy = 240;
  update(w, {direction: 0}, 1 / 120);
  assert.equal(hopper.alive, false);
  assert.equal(w.deaths, 0);
});

test("ducking tucks under vines that catch a standing puppy", () => {
  for (const n of [0, 2, 4]) {
    const standing = createWorld(n);
    const vx = standing.vines[0].x;
    standing.player.x = vx + 5;
    standing.player.y = 430 - standing.player.h;
    standing.player.grounded = true;
    update(standing, {direction: 0, duck: false}, 1 / 120);
    assert.equal(standing.deaths, 1, `trail ${n + 1}: standing under a vine hurts`);
    const ducked = createWorld(n);
    ducked.player.x = vx + 5;
    ducked.player.y = 430 - ducked.player.h;
    ducked.player.grounded = true;
    update(ducked, {direction: 0, duck: true}, 1 / 120);
    assert.equal(ducked.deaths, 0, `trail ${n + 1}: a tuck slips through`);
    assert.equal(ducked.player.ducking, true);
    assert.equal(ducked.player.h, 18);
  }
});

test("releasing duck under a vine keeps the tuck until headroom clears", () => {
  const w = createWorld(0);
  const vx = w.vines[0].x;
  w.player.x = vx + 5;
  w.player.y = 430 - w.player.h;
  w.player.grounded = true;
  update(w, {direction: 0, duck: true}, 1 / 120);
  assert.equal(w.player.ducking, true);
  update(w, {direction: 0, duck: false}, 1 / 120);
  assert.equal(w.player.ducking, true, 'no headroom, no standing');
  assert.equal(w.deaths, 0);
  w.player.x = vx + 200;
  update(w, {direction: 0, duck: false}, 1 / 120);
  assert.equal(w.player.ducking, false);
  assert.equal(w.player.h, 34);
});

test("a held duck persists off ledges instead of popping up", () => {
  const w = createWorld(0);
  w.player.x = 700;
  w.player.y = 430 - w.player.h;
  w.player.grounded = true;
  update(w, {direction: 1, duck: true}, 1 / 120);
  assert.equal(w.player.ducking, true);
  let guard = 0;
  while (w.player.grounded && guard++ < 300) update(w, {direction: 1, duck: true}, 1 / 120);
  assert.equal(w.player.grounded, false, 'walked off the 760 edge');
  assert.equal(w.player.ducking, true, 'still tucked in the air');
  assert.equal(w.deaths, 0);
});

test("landing with duck held tucks on touchdown", () => {
  const w = createWorld(0);
  // Jump from open ground and hold duck: the landing frame tucks immediately
  // instead of standing for a frame first.
  w.player.x = 2300;
  w.player.y = 430 - w.player.h;
  w.player.grounded = true;
  update(w, {direction: 1, run: true, jumpPressed: true}, 1 / 120);
  let guard = 0;
  while (!w.player.grounded && guard++ < 600) update(w, {direction: 1, run: true, duck: true}, 1 / 120);
  assert.equal(w.player.ducking, true);
  assert.equal(w.player.h, 18);
  assert.equal(w.deaths, 0);
});

test("ducking never grants enemy immunity", () => {
  const w = createWorld(0);
  const e = w.enemies[0];
  w.player.x = e.x + 5;
  w.player.y = 430 - w.player.h;
  w.player.grounded = true;
  update(w, {direction: 0, duck: true}, 1 / 120);
  assert.equal(w.deaths, 1, 'beetles meet the full standing height');
});

test("jumping from a tuck needs headroom and diving accelerates falls", () => {
  const w = createWorld(0);
  const vx = w.vines[0].x;
  w.player.x = vx + 5;
  w.player.y = 430 - w.player.h;
  w.player.grounded = true;
  update(w, {direction: 0, duck: true}, 1 / 120);
  update(w, {direction: 0, duck: true, jumpPressed: true}, 1 / 120);
  assert.equal(w.player.ducking, true, 'no headroom, no takeoff');
  assert.equal(w.deaths, 0);
  const open = createWorld(0);
  open.player.y = 200;
  open.player.vy = 100;
  open.player.grounded = false;
  update(open, {direction: 0, duck: true}, 1 / 120);
  assert.ok(open.player.vy >= 500 - 1e-9, 'holding duck dives');
  const rising = createRunLikeJump();
  function createRunLikeJump() {
    const r = createWorld(0);
    r.player.y = 200;
    r.player.vy = -570;
    r.player.grounded = false;
    r.player.jumps = 1;
    update(r, {direction: 0, duck: true}, 1 / 120);
    return r;
  }
  assert.ok(rising.player.vy < 0, 'a rising jump is never cut into a dive');
});

test("a duck signpost stands before each world's first vines", () => {
  for (let n = 0; n < 5; n++) {
    const w = createWorld(n);
    assert.equal(w.signs.length, 1);
    assert.equal(w.signs[0].x, w.spec.vines[0] - 130);
    assert.match(w.signs[0].text, /DUCK/);
    // The sign stands on open ground with room to read it before tucking.
    assert.ok(w.signs[0].x > 300, 'not at the spawn doorstep');
  }
});

test("moving platforms patrol deterministically and ferry riders", () => {
  const a = createWorld(1);
  const b = createWorld(1);
  assert.equal(a.movers.length, 1);
  for (let i = 0; i < 600; i++) {
    update(a, {direction: 0}, 1 / 120);
    update(b, {direction: 0}, 1 / 120);
  }
  assert.equal(a.movers[0].x, b.movers[0].x, 'same world time, same platform');
  assert.ok(a.movers[0].x >= 1900 && a.movers[0].x <= 2050, 'stays on its patrol beat');
  // Stand on the mover and ride without touching input.
  const m = a.movers[0];
  a.player.x = m.x + 40;
  a.player.y = m.y - a.player.h;
  a.player.vy = 10;
  a.player.grounded = false;
  for (let i = 0; i < 120; i++) update(a, {direction: 0}, 1 / 120);
  assert.ok(a.player.grounded, 'lands on the moving platform');
  const carried = a.player.x;
  for (let i = 0; i < 120; i++) update(a, {direction: 0}, 1 / 120);
  assert.notEqual(a.player.x.toFixed(2), carried.toFixed(2), 'rider keeps the platform delta');
  assert.equal(a.deaths, 0);
});

test("movers are shortcuts: trails finish for runners who ignore them", () => {
  for (let n = 1; n < 5; n++) {
    const w = createWorld(n);
    assert.ok(w.movers.length > 0);
    for (let i = 0; i < 120 * 60 && !w.finished; i++) {
      const p = w.player;
      const ground = w.spec.ground.find(([x, width]) => p.x >= x && p.x < x + width);
      const enemy = w.enemies.find((e) => e.alive && e.x > p.x && e.x - p.x < 100);
      const vine = w.vines.find((v) => v.x + v.w > p.x && v.x - p.x < 110);
      const jump = (p.grounded && ((ground && ground[0] + ground[1] - p.x < 95) || enemy)) || (!p.grounded && p.jumps === 1 && p.vy > 30);
      update(w, {direction: 1, run: true, jumpPressed: Boolean(jump && !vine), duck: Boolean(vine)}, 1 / 120);
    }
    assert.equal(w.finished, true, `trail ${n + 1} needs no ferry`);
  }
});
