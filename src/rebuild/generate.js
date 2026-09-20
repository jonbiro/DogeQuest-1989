// Seeded trail generation for Puppy Quest: every new game deals a fresh layout
// from the biome's grammar, so no two sessions ever run the same ground. All
// randomness flows from one integer seed through mulberry32, which makes any
// trail replayable and testable: the same (biome, seed) always deals the same
// dirt. Fairness is constructive, not luck: gaps stay inside a running jump,
// vines keep clear takeoff and landing aprons, enemies keep clear margins, and
// the checkpoint always lands on solid ground with room to stand.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  return (Math.random() * 0x7fffffff) | 0;
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v) => Math.min(255, Math.round(v * f));
  const parts = [mix((n >> 16) & 255), mix((n >> 8) & 255), mix(n & 255)];
  return "#" + parts.map((v) => v.toString(16).padStart(2, "0")).join("");
}

// Lighting moods multiply the biome palette so the same trail theme can greet
// the player at golden hour, at dusk or under the stars. Gameplay colors stay
// untouched: grass, dirt and enemy coats keep their contrast on every mood.
const MOODS = [
  { id: "day", weight: 0.45, label: "" },
  { id: "golden", weight: 0.2, label: "at golden hour" },
  { id: "dusk", weight: 0.2, label: "at dusk" },
  { id: "night", weight: 0.15, label: "under the stars" },
];

export function applyMood(biome, moodId) {
  const base = {
    sky: biome.sky,
    horizon: biome.horizon,
    sun: biome.sun,
    stars: biome.stars,
    far: biome.far,
    cloud: "#edf2df",
  };
  if (moodId === "golden")
    return {
      ...base,
      sky: "#f2bd85",
      horizon: "#fdeccb",
      sun: "#ffedb5",
      cloud: "#fbeed3",
    };
  if (moodId === "dusk")
    return {
      ...base,
      sky: shade(biome.sky, 0.55),
      horizon: shade(biome.horizon, 0.7),
      sun: "#f6e3c0",
      stars: true,
      far: shade(biome.far, 0.8),
      cloud: "#8f9bb3",
    };
  if (moodId === "night")
    return {
      ...base,
      sky: shade(biome.sky, 0.32),
      horizon: shade(biome.horizon, 0.42),
      sun: "#e8ecf7",
      stars: true,
      far: shade(biome.far, 0.6),
      cloud: "#3a4763",
    };
  return base;
}

function pickMood(rng) {
  const r = rng();
  let acc = 0;
  for (const mood of MOODS) {
    acc += mood.weight;
    if (r < acc) return mood;
  }
  return MOODS[0];
}

export function generateSpec(biome, seed) {
  const rng = mulberry32(seed);
  const ri = (min, max) => min + Math.floor(rng() * (max - min + 1));
  const rf = (min, max) => min + rng() * (max - min);
  const knobs = biome.knobs;
  const length = biome.length;

  // Ground: an opening meadow, then segment/gap rhythm. The final meadow is
  // always long enough to land the last jump and trot home.
  const ground = [];
  const firstLen = ri(500, 700);
  ground.push([0, firstLen]);
  let x = firstLen;
  for (;;) {
    const remaining = length - x;
    if (remaining <= 750) {
      ground.push([x, remaining]);
      break;
    }
    const gap = ri(knobs.gap[0], knobs.gap[1]);
    const maxSeg = Math.min(700, remaining - gap - 260);
    if (maxSeg < 420) {
      ground.push([x, remaining]);
      break;
    }
    const segLen = ri(420, maxSeg);
    ground.push([x + gap, segLen]);
    x += gap + segLen;
  }

  const segEnd = ([sx, w]) => sx + w;
  const gaps = [];
  for (let i = 1; i < ground.length; i++)
    gaps.push({ start: segEnd(ground[i - 1]), width: ground[i][0] - segEnd(ground[i - 1]) });

  // Vines hang over long meadows with clear ground on both sides, so the tuck
  // never swallows a jump. They are placed BEFORE enemies and enemies keep
  // their distance, since tucking slips under strands but never through
  // shells. 170px aprons each side leave the bot room to stand back up and
  // jump: it ducks only while a strand is near, then jumps at the gap edge.
  const vines = [];
  const vineSegs =
    ground.filter(([sx, w]) => w >= 420 && sx + w >= 800).length > 0
      ? ground.filter(([sx, w]) => w >= 420 && sx + w >= 800)
      : ground.filter(([, w]) => w >= 420);
  // Each strand tries every candidate meadow in shuffled order, so one crowded
  // meadow never starves the trail: requested counts actually appear.
  const shuffled = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  for (let n = 0; n < knobs.vines; n++) {
    let placed = false;
    for (const [sx, w] of shuffled(vineSegs)) {
      if (placed) break;
      for (let t = 0; t < 8 && !placed; t++) {
        const vx = Math.round(sx + 170 + rng() * (w - 366));
        if (vx + 26 > sx + w - 170) continue;
        if (vines.some((v) => Math.abs(v - vx) < 200)) continue;
        vines.push(vx);
        placed = true;
      }
    }
  }
  vines.sort((a, b) => a - b);

  // Enemies stand on long meadows with a clear landing apron ahead and a clear
  // takeoff apron behind, never at the spawn doorstep, and clear of vines.
  // The trailing apron fits a full single-jump landing past a beetle hop, so
  // a beetle hop never throws the runner into the next pit.
  const enemies = [];
  const poolFor = (minLen) => ground.filter(([, w]) => w >= minLen);
  const placeEnemy = (kind, strong) => {
    const tries = strong ? 60 : 10;
    for (let t = 0; t < tries; t++) {
      const tier = t < tries / 2 ? 0 : 1;
      const pool = poolFor(tier === 0 ? 420 : 320);
      if (!pool.length) continue;
      const [sx, w] = pool[ri(0, pool.length - 1)];
      const ms = tier === 0 ? 200 : 150;
      const ex = Math.round(Math.max(450, sx + ms + rng() * (w - ms - 160)));
      if (ex + 30 > sx + w - 130) continue;
      if (enemies.some((e) => Math.abs((typeof e === "number" ? e : e.x) - ex) < 320))
        continue;
      if (vines.some((v) => Math.abs(v - ex) < 100)) continue;
      enemies.push(kind === "patrol" ? ex : { x: ex, kind });
      return true;
    }
    return false;
  };
  for (const kind of knobs.guaranteed) placeEnemy(kind, true);
  const wantEnemies = ri(knobs.enemies[0], knobs.enemies[1]);
  let guard = 0;
  while (enemies.length < wantEnemies && guard++ < 40) {
    const kind = knobs.allowed[ri(0, knobs.allowed.length - 1)];
    placeEnemy(kind, false);
  }
  enemies.sort((a, b) => (typeof a === "number" ? a : a.x) - (typeof b === "number" ? b : b.x));

  // Platforms grow as reachable staircases from the meadow: the first plank
  // stays inside a single jump, each next link rises at most 80px. No plank
  // ever crosses a vine column: strands hang to y=404, so a plank under one
  // would wall off its own walking line and trap runners up top.
  const platforms = [];
  const chains = ri(knobs.chains[0], knobs.chains[1]);
  const platSegs = ground.filter(([sx, w]) => sx >= 300 && w >= 380);
  const clearsVines = (px, pw) =>
    vines.every((vx) => px + pw < vx - 40 || px > vx + 66);
  for (let c = 0; c < chains; c++) {
    if (!platSegs.length) break;
    const [sx, w] = platSegs.splice(ri(0, platSegs.length - 1), 1)[0];
    let px = sx + 60 + rng() * 80;
    let py = 350 + ri(0, 18);
    const links = ri(2, 3);
    for (let l = 0; l < links; l++) {
      const pw = ri(120, 180);
      for (let nudge = 0; nudge < 4 && !clearsVines(px, pw); nudge++) {
        const push = vines
          .filter((vx) => vx + 66 >= px && vx - 40 <= px + pw)
          .reduce((edge, vx) => Math.max(edge, vx + 66 + 1), px);
        if (push <= px) break;
        px = push;
      }
      if (!clearsVines(px, pw)) break;
      if (px + pw > sx + w - 30) break;
      platforms.push([Math.round(px), py, pw]);
      px += ri(100, 160);
      py = Math.max(245, py - ri(0, 80));
    }
  }

  // Movers ferry across a real gap as one-way shortcuts; the gap beneath stays
  // directly jumpable so the ferry is never required.
  const movers = [];
  const wideGaps = gaps.filter((g) => g.width >= 90);
  for (let m = 0; m < Math.min(knobs.movers, wideGaps.length); m++) {
    const gap = wideGaps.splice(ri(0, wideGaps.length - 1), 1)[0];
    movers.push([gap.start - 100, gap.start + gap.width - 10, 340, 110]);
  }

  // The checkpoint lands on solid ground near the middle of the trail with
  // room to stand: respawns never drop the puppy into a gap, onto a strand,
  // or inside a patrol beat, which would loop death into death.
  const enemyX = (e) => (typeof e === "number" ? e : e.x);
  const target = length * 0.55;
  const roomy = ground.filter(([, w]) => w >= 300);
  const byDistance = (roomy.length ? roomy : ground)
    .slice()
    .sort(
      (a, b) =>
        Math.abs(a[0] + a[1] / 2 - target) - Math.abs(b[0] + b[1] / 2 - target),
    );
  let checkpoint = null;
  for (const [sx, w] of byDistance) {
    if (checkpoint !== null) break;
    for (let cx = sx + 40; cx <= sx + w - 60; cx += 10) {
      if (vines.some((vx) => Math.abs(vx + 13 - cx) < 80)) continue;
      if (enemies.some((e) => Math.abs(enemyX(e) - cx) < 150)) continue;
      checkpoint = cx;
      break;
    }
  }
  if (checkpoint === null) {
    const bed = byDistance[0];
    checkpoint = Math.round(Math.min(bed[0] + 100, bed[0] + bed[1] - 60));
  }

  const mood = pickMood(rng);
  const colors = applyMood(biome, mood.id);
  // Fireflies drift over Blue hour always and over other trails at dusk and
  // night, when the subtitle's promise and the dark sky agree.
  const fireflyCount = biome.fireflies || mood.id === "dusk" || mood.id === "night" ? 14 : 0;
  const fireflies = [];
  for (let i = 0; i < fireflyCount; i++)
    fireflies.push({
      x: Math.round(rng() * length),
      y: Math.round(120 + rng() * 220),
      ph: Math.round(rf(0, Math.PI * 2) * 100) / 100,
    });

  return {
    name: biome.name,
    subtitle: biome.subtitle,
    length,
    par: biome.par,
    ...colors,
    grass: biome.grass,
    dirt: biome.dirt,
    mood: mood.id,
    moodLabel: mood.label,
    props: {
      treePhase: ri(0, 239),
      hillPhase: ri(0, 219),
      cloudPhase: ri(0, 1199),
    },
    fireflies,
    ground,
    platforms,
    enemies,
    vines,
    movers,
    checkpoint,
  };
}
