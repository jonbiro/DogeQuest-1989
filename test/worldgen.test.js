import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWorld,
  buildWorld,
  update,
  botInput,
  simulateBot,
  WORLDS,
} from "../src/rebuild/world.js";
import { generateSpec, mulberry32, applyMood } from "../src/rebuild/generate.js";

const SEEDS = [11, 222, 3333];
const MOOD_LABELS = {day: "", golden: "at golden hour", dusk: "at dusk", night: "under the stars"};

test("the same seed always deals the same trail, and retries replay it", () => {
  for (let i = 0; i < WORLDS.length; i++) {
    for (const seed of SEEDS) {
      const a = createWorld(i, seed);
      const b = createWorld(i, seed);
      assert.deepEqual(a.spec, b.spec, `biome ${i} seed ${seed} is deterministic`);
      assert.equal(a.seed, b.seed);
      // Retrying with the dealt seed replays the identical trail.
      const retry = createWorld(i, a.seed);
      assert.deepEqual(retry.spec, a.spec, `biome ${i} retries its own deal`);
    }
  }
  assert.notEqual(
    JSON.stringify(createWorld(0, 1).spec.ground),
    JSON.stringify(createWorld(0, 2).spec.ground),
    "different seeds deal different dirt",
  );
});

test("mulberry32 streams are deterministic per seed", () => {
  const draw = (seed) => {
    const rng = mulberry32(seed);
    return [rng(), rng(), rng()];
  };
  assert.deepEqual(draw(7), draw(7));
  assert.notDeepEqual(draw(7), draw(8));
});

test("every deal honors the fairness grammar", () => {
  for (let i = 0; i < WORLDS.length; i++) {
    for (const seed of SEEDS) {
      const w = createWorld(i, seed);
      const spec = w.spec;
      const tag = `biome ${i} seed ${seed}`;
      // Gaps stay inside a running jump.
      for (let j = 1; j < spec.ground.length; j++) {
        const gap = spec.ground[j][0] - (spec.ground[j - 1][0] + spec.ground[j - 1][1]);
        assert.ok(gap <= 150, `${tag}: gap ${gap} is jumpable`);
      }
      // The checkpoint stands clear on solid ground.
      const bed = spec.ground.find(
        ([x, width]) => spec.checkpoint >= x + 40 && spec.checkpoint + 30 <= x + width - 30,
      );
      assert.ok(bed, `${tag}: checkpoint rests on a meadow`);
      // Vines keep clear takeoff and landing aprons on a real meadow.
      for (const vx of spec.vines) {
        const seg = [...spec.ground].reverse().find(([x]) => vx >= x);
        assert.ok(seg, `${tag}: vine sits over ground`);
        assert.ok(vx >= seg[0] + 170 && vx + 26 <= seg[0] + seg[1] - 170, `${tag}: vine keeps its aprons`);
      }
      // No plank ever crosses a vine column.
      for (const [px, , pw] of spec.platforms)
        assert.ok(
          spec.vines.every((vx) => px + pw < vx - 40 || px > vx + 66),
          `${tag}: platforms dodge vines`,
        );
      // Platforms on a meadow climb as one reachable staircase.
      const bySeg = new Map();
      for (const p of spec.platforms) {
        const seg = spec.ground.find(([x, width]) => p[0] >= x + 40 && p[0] + p[2] <= x + width - 20);
        assert.ok(seg, `${tag}: plank stays on its meadow`);
        if (!bySeg.has(seg)) bySeg.set(seg, []);
        bySeg.get(seg).push(p);
      }
      for (const chain of bySeg.values()) {
        chain.sort((a, b) => a[0] - b[0]);
        assert.ok(chain[0][1] >= 350 && chain[0][1] <= 368, `${tag}: first plank inside one jump`);
        for (let l = 1; l < chain.length; l++) {
          assert.ok(chain[l][1] <= chain[l - 1][1], `${tag}: stairs only rise`);
          assert.ok(chain[l - 1][1] - chain[l][1] <= 80, `${tag}: each step inside one jump`);
          assert.ok(chain[l][1] >= 245, `${tag}: stairs stay in the sky`);
        }
      }
      // Enemies keep landing and takeoff aprons, spacing, and vine distance.
      const ex = (e) => (typeof e === "number" ? e : e.x);
      for (const e of spec.enemies) {
        assert.ok(ex(e) >= 450, `${tag}: nothing at the spawn doorstep`);
        const seg = spec.ground.find(([x, width]) => ex(e) >= x + 150 && ex(e) + 30 <= x + width - 130);
        assert.ok(seg, `${tag}: beetle keeps its aprons`);
        assert.ok(spec.vines.every((vx) => Math.abs(vx - ex(e)) >= 100), `${tag}: beetles clear of strands`);
      }
      for (let a = 0; a < spec.enemies.length; a++)
        for (let b = a + 1; b < spec.enemies.length; b++)
          assert.ok(Math.abs(ex(spec.enemies[a]) - ex(spec.enemies[b])) >= 320, `${tag}: patrols spread out`);
      // Movers ferry across real gaps as shortcuts.
      for (const [x0, x1, y, mw] of spec.movers) {
        assert.equal(y, 340);
        assert.equal(mw, 110);
        const prevEnd = x0 + 100;
        const nextStart = x1 + 10;
        assert.ok(nextStart - prevEnd >= 90, `${tag}: ferry spans a real gap`);
        assert.ok(spec.ground.some(([x, width]) => x + width === prevEnd), `${tag}: ferry leaves a meadow`);
        assert.ok(spec.ground.some(([x]) => x === nextStart), `${tag}: ferry reaches a meadow`);
      }
      // Ground bones keep the star economy at least as rich as shipped.
      const groundBones = w.bones.filter((bone) => bone.ground).length;
      assert.ok(
        (groundBones / spec.length) * 1000 >= 3.2,
        `${tag}: ${(groundBones / spec.length * 1000).toFixed(1)} ground bones per mile`,
      );
    }
  }
});

test("moods recolor skies and fireflies follow the dark", () => {
  const seen = new Set();
  for (let i = 0; i < WORLDS.length; i++) {
    for (const seed of SEEDS) {
      const spec = createWorld(i, seed).spec;
      seen.add(spec.mood);
      assert.equal(spec.moodLabel, MOOD_LABELS[spec.mood]);
      if (spec.mood === "dusk" || spec.mood === "night") {
        assert.equal(spec.stars, true, "dark moods bring stars");
        assert.equal(spec.fireflies.length, 14, "dark moods bring fireflies");
      }
      if (i === 3) assert.equal(spec.fireflies.length, 14, "Blue hour always glows");
      assert.ok(spec.props.treePhase >= 0 && spec.props.treePhase < 240);
      assert.ok(spec.props.hillPhase >= 0 && spec.props.hillPhase < 220);
      assert.ok(spec.props.cloudPhase >= 0 && spec.props.cloudPhase < 1200);
    }
  }
  assert.deepEqual([...seen].sort(), ["day", "dusk", "golden", "night"]);
  // Mood transforms keep gameplay colors while day stays untouched.
  const day = applyMood(WORLDS[0], "day");
  assert.equal(day.sky, WORLDS[0].sky);
  assert.equal(day.stars, WORLDS[0].stars);
  const night = applyMood(WORLDS[0], "night");
  assert.notEqual(night.sky, WORLDS[0].sky);
  assert.equal(night.stars, true);
  assert.match(night.sky, /^#[0-9a-f]{6}$/);
  assert.match(night.horizon, /^#[0-9a-f]{6}$/);
});

test("dealt trails finish for the casual-player oracle", () => {
  for (let n = 0; n < 5; n++) {
    for (const seed of [5, 999]) {
      const w = createWorld(n, seed);
      for (let i = 0; i < 120 * 60 && !w.finished; i++)
        update(w, botInput(w), 1 / 120);
      assert.equal(w.finished, true, `biome ${n} seed ${seed} finishes`);
    }
  }
});

test("the oracle rejects an unfair deal", () => {
  const base = generateSpec(WORLDS[0], 11);
  // A 500px pit can never clear inside one running jump.
  const mean = {
    ...base,
    ground: [[0, 400], [900, base.length - 900]],
    platforms: [],
    enemies: [],
    vines: [],
    movers: [],
    checkpoint: 200,
  };
  const result = simulateBot(mean, 11);
  assert.equal(result.pass, false, "an unjumpable pit fails verification");
  assert.ok(result.progress < 900, "progress stalls at the pit");
  // And the world still builds for inspection.
  const world = buildWorld(mean, 11);
  assert.equal(world.spec.ground.length, 2);
});

test("the biome registry keeps its five themes and sane knobs", () => {
  assert.equal(WORLDS.length, 5);
  assert.deepEqual(
    WORLDS.map((w) => w.name),
    ["The backyard", "Bramble woods", "Honeyhill hop", "Blue hour", "Home, sweet home"],
  );
  assert.deepEqual(WORLDS.map((w) => w.length), [3000, 3300, 3500, 3700, 4000]);
  for (const biome of WORLDS) {
    assert.ok(biome.knobs.gap[1] <= 150, `${biome.name}: gaps stay jumpable`);
    assert.ok(
      biome.knobs.guaranteed.every((k) => biome.knobs.allowed.includes(k)),
      `${biome.name}: guaranteed kinds are allowed`,
    );
  }
});
