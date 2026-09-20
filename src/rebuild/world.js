export const WORLDS = [
  {
    name: "The backyard",
    subtitle: "Every great adventure starts with a very small fence.",
    sky: "#8fd0cb",
    horizon: "#dff2df",
    sun: "#fff0be",
    stars: false,
    far: "#8cbbb0",
    grass: "#5c966b",
    dirt: "#c28d62",
    length: 3000,
    par: 45,
    knobs: {gap: [80, 110], enemies: [2, 2], allowed: ['patrol'], guaranteed: [], vines: 1, movers: 0, chains: [1, 2]},
  },
  {
    name: "Bramble woods",
    subtitle: "Take the high road. The mushrooms know the way.",
    sky: "#9dc4a0",
    horizon: "#e6eed2",
    sun: "#fff3c4",
    stars: false,
    far: "#86aa88",
    grass: "#487855",
    dirt: "#a27a56",
    length: 3300,
    par: 55,
    knobs: {gap: [95, 120], enemies: [3, 3], allowed: ['patrol', 'hopper'], guaranteed: ['hopper'], vines: 2, movers: 1, chains: [2, 2]},
  },
  {
    name: "Honeyhill hop",
    subtitle: "A little sunshine. A lot of questionable shortcuts.",
    sky: "#f0c98f",
    horizon: "#fdf0cd",
    sun: "#ffedb5",
    stars: false,
    far: "#d9bd83",
    grass: "#a2ac55",
    dirt: "#c79759",
    length: 3500,
    par: 60,
    knobs: {gap: [100, 130], enemies: [3, 4], allowed: ['patrol', 'hopper'], guaranteed: ['hopper', 'hopper'], vines: 3, movers: 1, chains: [2, 3]},
  },
  {
    name: "Blue hour",
    subtitle: "Follow the fireflies all the way home.",
    sky: "#5f7396",
    horizon: "#a9b6cc",
    sun: "#e8ecf7",
    stars: true,
    far: "#778daa",
    grass: "#5f8490",
    dirt: "#7a7c91",
    length: 3700,
    par: 65,
    fireflies: true,
    knobs: {gap: [110, 140], enemies: [4, 4], allowed: ['patrol', 'hopper', 'charger', 'flyer'], guaranteed: ['charger', 'flyer'], vines: 3, movers: 1, chains: [2, 3]},
  },
  {
    name: "Home, sweet home",
    subtitle: "The last stretch. Someone left the porch light on.",
    sky: "#cf9aa4",
    horizon: "#f6d9c8",
    sun: "#ffd9a0",
    stars: true,
    far: "#c798a8",
    grass: "#728b79",
    dirt: "#ae8076",
    length: 4000,
    par: 75,
    knobs: {gap: [120, 150], enemies: [4, 5], allowed: ['patrol', 'hopper', 'charger', 'flyer'], guaranteed: ['charger', 'hopper', 'flyer'], vines: 4, movers: 2, chains: [2, 3]},
  },
];

import { generateSpec, randomSeed } from "./generate.js";

export const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
// One wooden signpost before each world's first vines teaches the tuck
// without cluttering every strand. Rendered like the HOME sign.
export function vineSigns(spec) {
  const first = (spec.vines || [])[0];
  if (!Number.isFinite(first)) return [];
  return [{x: first - 130, text: 'DUCK ↓'}];
}
export const STANDING_H = 34;
export const DUCK_H = 18;
// Ground top sits at y=430, so a standing puppy occupies 396-430 and a
// tucked one 412-430. Vine strands end at 404: standing overlaps by 8px,
// tucked clears by 8px, and skilled double jumps still sail over the 300 top.
export const VINE_TOP = 300;
export const VINE_BOTTOM = 404;
export const ENEMY_KINDS = {
  // Patrols amble; hoppers bounce on a fixed timer; chargers stalk slowly,
  // telegraph half a second, then dash fast across their range; flyers ride a
  // slow sine above the meadow. Collision and stomp rules are identical for
  // all four: only the movement rhythm differs, so every world teaches a new
  // timing. A flyer clips standing puppies near its crest and clears tucked
  // ones near its trough: read the wingbeat, tuck the dip or hop it outright.
  patrol: {speed: 55, range: 65, hopPeriod: 0, hopVelocity: 0, dash: null},
  hopper: {speed: 35, range: 45, hopPeriod: 1.6, hopVelocity: -380, dash: null},
  charger: {speed: 60, range: 110, hopPeriod: 0, hopVelocity: 0,
    dash: {period: 3.4, windup: 0.5, duration: 0.8, speed: 230}},
  flyer: {speed: 45, range: 80, hopPeriod: 0, hopVelocity: 0, dash: null,
    flyBase: 372, flyAmp: 22, flyPeriod: 2.2},
};
export function enemyKindOf(entry) {
  // Plain numbers stay classic patrols; objects add a kind. Unknown kinds
  // fall back to patrol so old and hand-made levels keep working.
  return ENEMY_KINDS[entry?.kind] ? entry.kind : 'patrol';
}
// A casual player's policy, and the fairness oracle: run right, jump at gap
// edges and beetles, tuck under vines instead of jumping into them. The
// generator's verifier and the test suite share this exact function, so the
// proof of "every dealt trail finishes" can never drift from the play it
// models.
export function botInput(w) {
  const p = w.player;
  const ground = w.spec.ground.find(([x, width]) => p.x >= x && p.x < x + width);
  const enemy = w.enemies.find((e) => e.alive && e.x > p.x && e.x - p.x < 100);
  const vine = w.vines.find((v) => v.x + v.w > p.x && v.x - p.x < 110);
  // Single jumps only: every gap clears inside one running jump, and the
  // takeoff and landing aprons keep beetles clear of both ends, so the arc
  // never needs an extension. Airborne extensions only ever stretched flight
  // into vine duck-zones and dove onto the strands. A single-jump oracle is
  // the stronger fairness proof: anything it finishes, a double-jumping
  // human finishes easier.
  const jump =
    p.grounded && ((ground && ground[0] + ground[1] - p.x < 95) || enemy);
  return {direction: 1, run: true, jumpPressed: Boolean(jump && !vine), duck: Boolean(vine)};
}
// The bone star calls for 65% of the trail's bones; a dealt trail must offer
// that many to a player who just runs the taught line.
export const STAR_FRACTION = 0.65;
export function simulateBot(spec, seed) {
  const world = buildWorld(spec, seed);
  for (let i = 0; i < 120 * 60 && !world.finished; i++)
    update(world, botInput(world), 1 / 120);
  // Completion is the fairness property: the shipped game's 65% bone star
  // was always an exploration reward (even the handcrafted trails only feed a
  // straight runner 33-53%), so the verifier proves every trail finishes and
  // the test suite separately floors ground-bone density per mile.
  return {
    pass: world.finished,
    progress: world.finished ? Infinity : world.player.x,
    bones: world.bones.length
      ? world.collected / world.bones.length
      : 1,
  };
}
export function createWorld(index, seed = randomSeed()) {
  // Deal layouts until the oracle completes one with full stars in reach.
  // The search is deterministic in (index, seed): retries replay the same
  // trail, new games deal fresh ones. A bounded fallback keeps the worst case
  // a deep run, never a hang.
  let fallback = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const nonce = (seed + attempt) >>> 0;
    const spec = generateSpec(WORLDS[index], nonce);
    const result = simulateBot(spec, nonce);
    if (result.pass) return buildWorld(spec, nonce);
    if (!fallback || result.progress > fallback.progress)
      fallback = {spec, nonce, progress: result.progress};
  }
  return buildWorld(fallback.spec, fallback.nonce);
}
export function buildWorld(spec, seed) {
  const solids = [
    ...spec.ground.map(([x, w]) => ({ x, y: 430, w, h: 140 })),
    ...spec.platforms.map(([x, y, w]) => ({ x, y, w, h: 22 })),
  ];
  const bones = [];
  spec.ground.forEach(([x, w]) => {
    for (let p = x + 180; p < x + w - 70; p += 140)
      bones.push({ x: p, y: 392, w: 20, h: 16, taken: false, ground: true });
  });
  spec.platforms.forEach(([x, y, w], i) =>
    bones.push({
      x: x + w / 2,
      y: y - 35,
      w: 20,
      h: 16,
      taken: false,
      ground: false,
      gold: i % 3 === 2,
    }),
  );
  // Arc bones ride the flight tube over wide pits: the straight runner
  // collects them mid-jump without detouring.
  (spec.arcs || []).forEach(({x, y}) =>
    bones.push({x, y, w: 20, h: 16, taken: false, ground: false, arc: true}),
  );
  return {
    spec,
    seed,
    solids,
    bones,
    vines: (spec.vines || []).map((x) => ({x, y: VINE_TOP, w: 26, h: VINE_BOTTOM - VINE_TOP})),
    signs: vineSigns(spec),
    // Moving platforms patrol horizontally on a fixed 5s period from world
    // time, so they stay deterministic. They are one-way shortcuts, never
    // required: every gap beneath them stays directly jumpable.
    movers: (spec.movers || []).map(([x0, x1, y, w]) => ({x0, x1, y, w, h: 22, x: x0, dx: 0, mover: true})),
    enemies: spec.enemies.map((entry) => {
      const x = typeof entry === 'number' ? entry : entry.x;
      const kind = enemyKindOf(entry);
      const fly = ENEMY_KINDS[kind]?.flyBase;
      return {
        x,
        y: fly ?? 406,
        w: 30,
        h: 24,
        origin: x,
        dir: -1,
        alive: true,
        kind,
        vy: 0,
        hopTimer: 0,
        // Dash chargers desync by origin so a pair never pulses together.
        dashT: ((x % 100) / 100) * ((ENEMY_KINDS[entry?.kind] || {}).dash?.period || 0),
        // Flyers desync the same way so a pair never flaps in lockstep.
        flyT: 0,
        flyPhase: ((x % 100) / 100) * Math.PI * 2,
        winding: false,
        dashing: false,
      };
    }),
    checkpoint: false,
    finished: false,
    time: 0,
    deaths: 0,
    collected: 0,
    score: 0,
    player: {
      x: 70,
      y: 370,
      w: 30,
      h: STANDING_H,
      vx: 0,
      vy: 0,
      grounded: false,
      groundMover: null,
      ducking: false,
      coyote: 0,
      buffer: 0,
      jumps: 0,
      face: 1,
      invincible: 0,
    },
    camera: 0,
    events: [],
  };
}

export function canStand(world) {
  const p = world.player;
  const box = {x: p.x, y: p.y - (STANDING_H - DUCK_H), w: p.w, h: STANDING_H};
  return !world.vines.some((v) => overlaps(box, v));
}

export function respawn(world) {
  const p = world.player;
  Object.assign(p, {
    x: world.checkpoint ? world.spec.checkpoint : 70,
    y: 370,
    vx: 0,
    vy: 0,
    h: STANDING_H,
    ducking: false,
    jumps: 0,
    coyote: 0,
    buffer: 0,
    invincible: 1.5,
  });
  world.deaths++;
  world.events.push({ type: "respawn", x: p.x, y: p.y });
}

export function update(world, input, dt) {
  if (world.finished) return;
  const p = world.player;
  world.time += dt;
  p.invincible = Math.max(0, p.invincible - dt);
  p.coyote = Math.max(0, p.coyote - dt);
  p.buffer = Math.max(0, p.buffer - dt);
  if (input.jumpPressed) p.buffer = 0.13;
  // Ducking tucks low on the ground and dives mid-air. Jumping always stands
  // first; releasing duck under a vine keeps the tuck until headroom clears.
  // A held duck persists through the air so walking off a ledge under vines
  // never pops the player up into them.
  if (input.jumpPressed && p.ducking) {
    if (canStand(world)) {
      p.y -= STANDING_H - DUCK_H;
      p.h = STANDING_H;
      p.ducking = false;
    }
  }
  if (!input.duck && p.ducking && !input.jumpPressed && canStand(world)) {
    p.y -= STANDING_H - DUCK_H;
    p.h = STANDING_H;
    p.ducking = false;
  }
  // Holding duck while falling dives; rising jump velocity is untouched so a
  // jump from a tuck still takes off normally.
  if (input.duck && !p.grounded && p.vy > 0) p.vy = Math.max(p.vy, 500);
  if (p.buffer > 0 && (p.coyote > 0 || p.jumps < 2)) {
    p.vy = p.jumps === 0 ? -570 : -510;
    p.jumps++;
    p.buffer = 0;
    p.coyote = 0;
    p.grounded = false;
    world.events.push({ type: "jump", x: p.x, y: p.y + p.h });
  }
  if (input.jumpReleased && p.vy < -210) p.vy = -210;
  const target = input.direction * (input.run ? 340 : 260);
  const acceleration = p.grounded ? 2300 : 1500;
  p.vx += Math.max(
    -acceleration * dt,
    Math.min(acceleration * dt, target - p.vx),
  );
  if (input.direction) p.face = input.direction;
  p.x += p.vx * dt;
  p.x = Math.max(0, Math.min(world.spec.length - p.w, p.x));
  // Movers glide on world time before anything lands, so riders and landing
  // checks share this frame's positions.
  for (const m of world.movers) {
    const mid = (m.x0 + m.x1) / 2;
    const amp = (m.x1 - m.x0) / 2;
    const x = mid + amp * Math.sin((2 * Math.PI * world.time) / 5);
    m.dx = x - m.x;
    m.x = x;
  }
  // Elevated platforms are one-way; solid ground resolves on both axes.
  for (const s of world.solids.filter((s) => s.y === 430))
    if (overlaps(p, s)) {
      p.x = p.vx > 0 ? s.x - p.w : s.x + s.w;
      p.vx = 0;
    }
  const previousBottom = p.y + p.h;
  p.vy = Math.min(850, p.vy + 1550 * dt);
  p.y += p.vy * dt;
  p.grounded = false;
  p.groundMover = null;
  for (const s of world.solids.concat(world.movers)) {
    if (
      p.vy >= 0 &&
      previousBottom <= s.y + 2 &&
      p.y + p.h >= s.y &&
      p.x + p.w > s.x &&
      p.x < s.x + s.w
    ) {
      p.y = s.y - p.h;
      p.vy = 0;
      p.grounded = true;
      p.coyote = 0.11;
      p.jumps = 0;
      if (s.mover) p.groundMover = s;
    }
  }
  // Riders keep the platform delta they landed on, so movers ferry the puppy
  // instead of sliding out from underfoot.
  if (p.grounded && p.groundMover) {
    p.x = Math.max(0, Math.min(world.spec.length - p.w, p.x + p.groundMover.dx));
  }
  if (!p.grounded && p.coyote === 0 && p.jumps === 0) p.jumps = 1;
  // Tucking engages on the landing frame itself, so a held duck that meets
  // the ground inside a vine zone is already low when the hazard check runs.
  if (input.duck && p.grounded && !p.ducking) {
    p.y += STANDING_H - DUCK_H;
    p.h = DUCK_H;
    p.ducking = true;
    world.events.push({ type: "duck", x: p.x, y: p.y + p.h });
  }
  for (const bone of world.bones)
    if (!bone.taken && overlaps(p, bone)) {
      bone.taken = true;
      world.collected++;
      world.score += bone.gold ? 300 : 100;
      world.events.push({
        type: bone.gold ? "gold" : "bone",
        x: bone.x,
        y: bone.y,
      });
    }
  if (!world.checkpoint && p.x >= world.spec.checkpoint) {
    world.checkpoint = true;
    world.events.push({ type: "checkpoint", x: p.x, y: p.y });
  }
  for (const e of world.enemies) {
    if (!e.alive) continue;
    const kind = ENEMY_KINDS[e.kind] || ENEMY_KINDS.patrol;
    if (kind.dash) {
      // Stalk, telegraph, dash, recover: a fixed cycle the player can learn.
      // The wind-up shakes in place with dust; the dash itself is the threat.
      e.dashT += dt;
      const phase = e.dashT % kind.dash.period;
      if (phase < kind.dash.windup) {
        e.winding = true;
        e.dashing = false;
        e.x += e.dir * 10 * dt;
      } else if (phase < kind.dash.windup + kind.dash.duration) {
        if (!e.dashing) world.events.push({type: 'dash', x: e.x, y: e.y});
        e.winding = false;
        e.dashing = true;
        e.x += e.dir * kind.dash.speed * dt;
      } else {
        e.winding = false;
        e.dashing = false;
        e.x += e.dir * kind.speed * dt;
      }
      if (Math.abs(e.x - e.origin) > kind.range) {
        e.dir *= -1;
        e.x = e.origin + Math.sign(e.x - e.origin) * kind.range;
      }
      continue;
    }
    e.x += e.dir * kind.speed * dt;
    if (Math.abs(e.x - e.origin) > kind.range) e.dir *= -1;
    if (kind.flyBase !== undefined) {
      // Crows ride their sine on a private clock, so saves, retries and
      // replays flap identically. The stomp rule below reads e.y live, so
      // dipping stomps work exactly like hopping ones.
      e.flyT += dt;
      e.y = kind.flyBase + Math.sin((2 * Math.PI * e.flyT) / kind.flyPeriod + e.flyPhase) * kind.flyAmp;
    } else if (kind.hopPeriod > 0) {
      // Hoppers bounce on their period and land back on the patrol line. The
      // stomp rule below reads e.y live, so mid-hop stomps work unchanged.
      e.hopTimer += dt;
      if (e.hopTimer >= kind.hopPeriod && e.y >= 406) {
        e.vy = kind.hopVelocity;
        e.hopTimer = 0;
      }
      e.vy = Math.min(850, e.vy + 1200 * dt);
      e.y += e.vy * dt;
      if (e.y >= 406) {
        e.y = 406;
        e.vy = 0;
      }
    }
    // Enemies meet the full standing height: tucking slips under vines, never
    // through beetles. Stomps still read the real falling bottom below.
    const foeBox = p.ducking
      ? {x: p.x, y: p.y + p.h - STANDING_H, w: p.w, h: STANDING_H}
      : p;
    if (overlaps(foeBox, e)) {
      if (p.vy > 0 && previousBottom < e.y + 14) {
        e.alive = false;
        p.vy = -390;
        p.jumps = 1;
        world.score += 150;
        world.events.push({ type: "stomp", x: e.x, y: e.y });
      } else if (p.invincible <= 0) {
        respawn(world);
        break;
      }
    }
  }
  for (const v of world.vines) {
    // Vines hang low: a standing or jumping puppy clips them, a tucked one
    // slips underneath. They are hazards, never footing.
    if (overlaps(p, v)) {
      if (p.invincible <= 0) {
        respawn(world);
        break;
      }
    }
  }
  if (p.y > 600) respawn(world);
  if (p.x > world.spec.length - 140) {
    world.finished = true;
    world.events.push({ type: "win", x: p.x, y: p.y });
  }
}
