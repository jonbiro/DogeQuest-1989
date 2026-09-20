import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorld, update, respawn, WORLDS, botInput, enemyKindOf } from "../src/rebuild/world.js";
import { draw, dog } from "../src/rebuild/render.js";
import { loadSoundPreference, saveSoundPreference, prefersReducedMotion, SETTINGS_KEY } from "../src/rebuild/settings.js";
const tick = (w, input = {}, count = 1) => {
  for (let i = 0; i < count; i++)
    update(w, { direction: 0, ...input }, 1 / 120);
};
test("every dealt trail has a safe start, a grounded checkpoint and jumpable gaps", () => {
  // Layouts are generated per game, so the invariants must hold for any seed,
  // not one remembered arrangement.
  for (let i = 0; i < WORLDS.length; i++) {
    for (const seed of [11, 222]) {
      const w = createWorld(i, seed);
      tick(w, {}, 120);
      assert.equal(w.player.grounded, true);
      assert.equal(w.deaths, 0);
      assert.ok(
        w.spec.ground.some(
          ([x, width]) =>
            w.spec.checkpoint >= x + 40 && w.spec.checkpoint + 30 <= x + width - 30,
        ),
        `biome ${i} seed ${seed}: checkpoint stands clear on solid ground`,
      );
      for (let j = 1; j < w.spec.ground.length; j++)
        assert.ok(
          w.spec.ground[j][0] -
            (w.spec.ground[j - 1][0] + w.spec.ground[j - 1][1]) <=
            180,
          `biome ${i} seed ${seed}: every gap stays directly jumpable`,
        );
    }
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
  w.bones = [];
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
test("every dealt trail can be completed through simulated input with enemies enabled", () => {
  // The shared casual-player oracle also drives the generator's verifier, so
  // this is the same play the deal itself was proven against.
  for (let n = 0; n < 5; n++) {
    const w = createWorld(n, 11);
    for (let i = 0; i < 120 * 60 && !w.finished; i++)
      update(w, botInput(w), 1 / 120);
    assert.equal(w.finished, true, `trail ${n + 1} must be completable`);
  }
});

test("enemy rosters mix patrols, hoppers, chargers and flyers by biome theme", () => {
  // Every deal keeps its biome's rhythm: the backyard stays patrols, later
  // trails guarantee their signature kinds, and night trails add crows.
  for (const seed of [11, 222, 3333]) {
    const kinds = (n) => createWorld(n, seed).enemies.map((e) => e.kind);
    assert.ok(kinds(0).every((k) => k === 'patrol'), `seed ${seed}: backyard stays patrols`);
    assert.ok(kinds(0).length >= 2);
    assert.ok(kinds(1).includes('hopper'), `seed ${seed}: woods hop`);
    assert.ok(kinds(2).filter((k) => k === 'hopper').length >= 2, `seed ${seed}: honeyhill hops twice`);
    assert.ok(kinds(3).includes('charger'), `seed ${seed}: blue hour charges`);
    assert.ok(kinds(3).includes('flyer'), `seed ${seed}: blue hour crows`);
    assert.ok(kinds(4).includes('charger') && kinds(4).includes('hopper') && kinds(4).includes('flyer'), `seed ${seed}: home mixes`);
    assert.ok(createWorld(4, seed).enemies.every((e) => ['patrol', 'hopper', 'charger', 'flyer'].includes(e.kind)));
  }
});

test("plain numbers stay patrols and unknown kinds fall back safely", () => {
  assert.equal(enemyKindOf(1310), 'patrol');
  assert.equal(enemyKindOf({x: 1030, kind: 'hopper'}), 'hopper');
  assert.equal(enemyKindOf({x: 1050, kind: 'flyer'}), 'flyer');
  assert.equal(enemyKindOf({x: 9999, kind: 'dragon'}), 'patrol');
  assert.equal(createWorld(0, 11).enemies.at(-1).kind, 'patrol');
});

test("hoppers bounce on a fixed period and land back on the patrol line", () => {
  const w = createWorld(1, 11);
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
  const again = createWorld(1, 11);
  const other = again.enemies.find((e) => e.kind === 'hopper');
  for (let i = 0; i < Math.round(4.7 * 120); i++) update(again, {direction: 0}, 1 / 120);
  assert.equal(other.y, hopper.y);
  assert.equal(other.x, hopper.x);
});

test("chargers stalk, telegraph and dash on a learnable cycle", () => {
  const w = createWorld(4, 8);
  const charger = w.enemies.find((e) => e.kind === 'charger');
  const patrol = w.enemies.find((e) => e.kind === 'patrol');
  const cx0 = charger.x, px0 = patrol.x;
  // A full 3.4s period averages faster than a patrol at any phase alignment.
  for (let i = 0; i < Math.round(4.2 * 120); i++) update(w, {direction: 0}, 1 / 120);
  assert.ok(Math.abs(charger.x - cx0) > Math.abs(patrol.x - px0), 'charger covers more ground per period');
  assert.ok(Math.abs(charger.x - charger.origin) <= 110);
  assert.ok(w.events.some((e) => e.type === 'dash'), 'dashes puff dust as a tell');
  for (let i = 0; i < 600; i++) update(w, {direction: 0}, 1 / 120);
  assert.ok(Math.abs(charger.x - charger.origin) <= 110, 'charger never leaves its range');
});

test("flyers ride a deterministic sine between fixed patrol ends", () => {
  const w = createWorld(3, 11);
  const flyer = w.enemies.find((e) => e.kind === 'flyer');
  assert.ok(flyer);
  assert.equal(flyer.y, 372);
  let minY = 372, maxY = 372;
  for (let i = 0; i < Math.round(4.4 * 120); i++) {
    update(w, {direction: 0}, 1 / 120);
    minY = Math.min(minY, flyer.y);
    maxY = Math.max(maxY, flyer.y);
  }
  assert.ok(minY < 360, `flyer dips, reached ${minY}`);
  assert.ok(maxY > 384, `flyer crests, reached ${maxY}`);
  assert.ok(Math.abs(flyer.x - flyer.origin) <= 80, 'flyer holds its beat');
  // A second identical run flaps in lockstep: the rhythm is deterministic.
  const again = createWorld(3, 11);
  const other = again.enemies.find((e) => e.kind === 'flyer');
  for (let i = 0; i < Math.round(4.4 * 120); i++) update(again, {direction: 0}, 1 / 120);
  assert.equal(other.y, flyer.y);
  assert.equal(other.x, flyer.x);
});

test("stomps work on dipping flyers and tucks slip through troughs", () => {
  const w = createWorld(3, 11);
  const flyer = w.enemies.find((e) => e.kind === 'flyer');
  // A falling puppy that meets the dip bonks it like any beetle.
  w.player.x = flyer.x;
  w.player.y = flyer.y - w.player.h - 1;
  w.player.vy = 240;
  update(w, {direction: 0}, 1 / 120);
  assert.equal(flyer.alive, false);
  assert.equal(w.deaths, 0);
  // A tucked puppy slips under a trough flyer unharmed.
  const low = createWorld(3, 11);
  const bird = low.enemies.find((e) => e.kind === 'flyer');
  bird.flyPhase = -Math.PI / 2;
  bird.flyT = 0;
  low.player.x = bird.x + 5;
  low.player.y = 430 - low.player.h;
  low.player.grounded = true;
  update(low, {direction: 0, duck: true}, 1 / 120);
  assert.equal(low.deaths, 0, 'a trough clears a tuck');
  assert.equal(low.player.ducking, true);
});

test("stomps work on hopping enemies with the same rules", () => {
  const w = createWorld(1, 11);
  const hopper = w.enemies.find((e) => e.kind === 'hopper');
  w.player.x = hopper.x;
  w.player.y = hopper.y - w.player.h - 1;
  w.player.vy = 240;
  update(w, {direction: 0}, 1 / 120);
  assert.equal(hopper.alive, false);
  assert.equal(w.deaths, 0);
});

test("ducking tucks under vines that catch a standing puppy", () => {
  for (const [n, seed] of [[0, 11], [2, 222], [4, 3333]]) {
    const standing = createWorld(n, seed);
    const vx = standing.vines[0].x;
    standing.player.x = vx + 5;
    standing.player.y = 430 - standing.player.h;
    standing.player.grounded = true;
    update(standing, {direction: 0, duck: false}, 1 / 120);
    assert.equal(standing.deaths, 1, `trail ${n + 1}: standing under a vine hurts`);
    const ducked = createWorld(n, seed);
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
  const w = createWorld(0, 11);
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
  const w = createWorld(0, 11);
  // Start near the end of the opening meadow and walk off its edge, wherever
  // this deal put it.
  const [sx, sw] = w.spec.ground[0];
  w.player.x = sx + sw - 60;
  w.player.y = 430 - w.player.h;
  w.player.grounded = true;
  update(w, {direction: 1, duck: true}, 1 / 120);
  assert.equal(w.player.ducking, true);
  let guard = 0;
  while (w.player.grounded && guard++ < 300) update(w, {direction: 1, duck: true}, 1 / 120);
  assert.equal(w.player.grounded, false, 'walked off the meadow edge');
  assert.equal(w.player.ducking, true, 'still tucked in the air');
  assert.equal(w.deaths, 0);
});

test("landing with duck held tucks on touchdown", () => {
  const w = createWorld(0, 11);
  // Jump from open ground and hold duck: the landing frame tucks immediately
  // instead of standing for a frame first.
  w.player.x = 250;
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

test("a duck signpost stands before each dealt trail's first vines", () => {
  for (let n = 0; n < 5; n++) {
    const w = createWorld(n, 222);
    assert.ok(w.vines.length > 0, `trail ${n + 1} hangs vines`);
    assert.equal(w.signs.length, 1);
    assert.equal(w.signs[0].x, w.spec.vines[0] - 130);
    assert.match(w.signs[0].text, /DUCK/);
    // The sign stands on open ground with room to read it before tucking.
    assert.ok(w.signs[0].x > 300, 'not at the spawn doorstep');
  }
});

test("moving platforms patrol deterministically and ferry riders", () => {
  const a = createWorld(1, 11);
  const b = createWorld(1, 11);
  assert.ok(a.movers.length >= 1, 'bramble deals a ferry');
  for (let i = 0; i < 600; i++) {
    update(a, {direction: 0}, 1 / 120);
    update(b, {direction: 0}, 1 / 120);
  }
  assert.equal(a.movers[0].x, b.movers[0].x, 'same world time, same platform');
  assert.ok(a.movers[0].x >= a.movers[0].x0 && a.movers[0].x <= a.movers[0].x1, 'stays on its patrol beat');
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
    const w = createWorld(n, 222);
    assert.ok(w.movers.length > 0);
    for (let i = 0; i < 120 * 60 && !w.finished; i++)
      update(w, botInput(w), 1 / 120);
    assert.equal(w.finished, true, `trail ${n + 1} needs no ferry`);
  }
});

test("every world renders sky grades, suns and night stars without a canvas", () => {
  const calls = [];
  const gradient = {addColorStop() {}};
  const mock = {
    canvas: {width: 960},
    fillStyle: null,
    globalAlpha: 1,
    font: '',
    textAlign: 'left',
    save() {}, restore() {}, translate() {}, scale() {},
    beginPath() {}, fill() {}, moveTo() {}, lineTo() {},
    ellipse() {}, fillText() {},
    createLinearGradient() { calls.push(['gradient']); return gradient; },
    fillRect(x, y, w, h) { calls.push(['rect', x, y, w, h, this.fillStyle]); },
  };
  const {draw: drawWorld, dog: drawDog} = {draw, dog};
  for (let n = 0; n < 5; n++) {
    const w = createWorld(n);
    calls.length = 0;
    drawWorld(mock, w, 1.5, [], false);
    assert.ok(calls.some(([k]) => k === 'gradient'), `trail ${n + 1} grades its sky`);
  }
  // The buddy blinks: eyelid pixels replace the open eye briefly.
  function eyePixels(t) {
    calls.length = 0;
    drawDog(mock, 0, 400, 1, t, false, 1);
    return calls.filter(([, , , , h, color]) => color === '#283b34').map(([, , y, w, h]) => `${y},${w},${h}`);
  }
  assert.notDeepEqual(eyePixels(0), eyePixels(3.65), 'blink changes the eye');
});

test("moods grade skies, fireflies glow and the tail wags", () => {
  const calls = [];
  const gradient = {addColorStop() {}};
  const mock = {
    canvas: {width: 960},
    fillStyle: null,
    globalAlpha: 1,
    font: '',
    textAlign: 'left',
    save() {}, restore() {}, translate() {}, scale() {},
    beginPath() {}, fill() {}, moveTo() {}, lineTo() {},
    ellipse() {}, fillText() {},
    createLinearGradient() { calls.push(['gradient']); return gradient; },
    fillRect(x, y, w, h) { calls.push(['rect', x, y, w, h, this.fillStyle]); },
  };
  // Every lighting mood paints its own sky through the same gradient path.
  const byMood = {};
  for (const seed of [11, 222, 3333, 4, 5, 6, 7, 8])
    for (let n = 0; n < 5; n++) {
      const w = createWorld(n, seed);
      byMood[w.spec.mood] ??= w;
    }
  assert.deepEqual(Object.keys(byMood).sort(), ['day', 'dusk', 'golden', 'night']);
  for (const [mood, w] of Object.entries(byMood)) {
    calls.length = 0;
    draw(mock, w, 1.5, [], false);
    assert.ok(calls.some(([k]) => k === 'gradient'), `${mood} grades its sky`);
    if (mood === 'dusk' || mood === 'night') {
      assert.equal(w.spec.stars, true, `${mood} brings the stars`);
      assert.ok(
        calls.some(([, , , , , color]) => color === '#ffe98a'),
        `${mood} glows fireflies`,
      );
    }
  }
  // A crow beats amber wings over Blue hour. (Coats paint as ovals, which the
  // mock does not record; wing rects prove the flyer renders.)
  {
    const w = createWorld(3, 11);
    assert.ok(w.enemies.some((e) => e.kind === 'flyer'));
    calls.length = 0;
    draw(mock, w, 1.5, [], false);
    assert.ok(
      calls.some(([, , , , , color]) => color === '#8a6d24'),
      'flyer beats its wings',
    );
  }
  // The tail wags on its own phase while running and rests when still.
  function tailPixels(t, moving) {
    calls.length = 0;
    dog(mock, 0, 400, 1, t, moving, 1);
    return calls
      .filter(([, , , , h, color]) => h === 14 && color === '#e9ac65')
      .map(([, x, y]) => `${x},${y}`);
  }
  assert.notDeepEqual(tailPixels(0, true), tailPixels(0.07, true), 'tail wags while running');
  assert.deepEqual(tailPixels(0, false), tailPixels(0.07, false), 'tail rests when still');
});

test("sound preference persists safely and motion follows the OS", () => {
  assert.equal(SETTINGS_KEY, "puppy-quest-settings");
  assert.equal(loadSoundPreference(null), true);
  assert.equal(loadSoundPreference({getItem() { throw new Error("blocked"); }}), true);
  assert.equal(loadSoundPreference({getItem: () => '{"sound":false}'}), false);
  assert.equal(loadSoundPreference({getItem: () => '{bad'}), true);
  const calls = [];
  assert.equal(saveSoundPreference({setItem: (...a) => calls.push(a)}, false), true);
  assert.deepEqual(calls, [[SETTINGS_KEY, '{"sound":false}']]);
  assert.equal(saveSoundPreference({setItem() { throw new Error("quota"); }}, true), false);
  assert.equal(saveSoundPreference(null, true), false);
  assert.equal(prefersReducedMotion(null), false);
  assert.equal(prefersReducedMotion(() => { throw new Error("nope"); }), false);
  assert.equal(prefersReducedMotion((q) => ({matches: q.includes("reduce")})), true);
  assert.equal(prefersReducedMotion(() => ({matches: false})), false);
});
