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
    ground: [
      [0, 760],
      [880, 690],
      [1710, 550],
      [2400, 600],
    ],
    platforms: [
      [450, 350, 150],
      [1120, 325, 170],
      [1450, 260, 130],
      [1880, 330, 180],
      [2510, 320, 140],
    ],
    enemies: [1310, 2040],
    vines: [2500],
    movers: [],
    checkpoint: 1780,
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
    ground: [
      [0, 620],
      [770, 650],
      [1580, 500],
      [2220, 1080],
    ],
    platforms: [
      [370, 330, 130],
      [930, 310, 130],
      [1190, 245, 150],
      [1680, 335, 160],
      [1970, 265, 170],
      [2520, 325, 140],
      [2790, 250, 150],
    ],
    enemies: [{x: 1030, kind: 'hopper'}, 1850, 2650],
    vines: [1200, 2400],
    movers: [[1900, 2050, 340, 110]],
    checkpoint: 1660,
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
    ground: [
      [0, 680],
      [840, 450],
      [1470, 600],
      [2240, 490],
      [2900, 600],
    ],
    platforms: [
      [380, 320, 140],
      [970, 325, 140],
      [1270, 260, 130],
      [1640, 310, 180],
      [1980, 255, 140],
      [2390, 320, 160],
      [2700, 280, 170],
      [3090, 335, 150],
    ],
    enemies: [1040, {x: 1770, kind: 'hopper'}, 2510, {x: 3220, kind: 'hopper'}],
    vines: [1200, 1950, 2650],
    movers: [[2320, 2470, 340, 110]],
    checkpoint: 1550,
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
    ground: [
      [0, 600],
      [760, 480],
      [1410, 530],
      [2120, 610],
      [2900, 800],
    ],
    platforms: [
      [320, 320, 150],
      [900, 315, 150],
      [1220, 260, 150],
      [1550, 320, 170],
      [1840, 255, 170],
      [2260, 320, 160],
      [2600, 255, 130],
      [3110, 320, 170],
    ],
    enemies: [960, 1620, {x: 2410, kind: 'charger'}, 3240],
    vines: [1100, 1850, 2650],
    movers: [[2190, 2340, 340, 110]],
    checkpoint: 2190,
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
    ground: [
      [0, 620],
      [780, 480],
      [1430, 480],
      [2090, 570],
      [2820, 480],
      [3460, 540],
    ],
    platforms: [
      [340, 325, 160],
      [950, 310, 140],
      [1270, 250, 150],
      [1550, 320, 170],
      [1840, 255, 150],
      [2260, 315, 180],
      [2600, 260, 140],
      [2970, 320, 150],
      [3300, 265, 140],
      [3630, 320, 150],
    ],
    enemies: [1010, {x: 1680, kind: 'charger'}, {x: 2360, kind: 'hopper'}, {x: 3070, kind: 'charger'}, 3700],
    vines: [1150, 1800, 2550, 3200],
    movers: [[2900, 3050, 340, 110], [3260, 3410, 300, 110]],
    checkpoint: 2160,
  },
];

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
  // telegraph half a second, then dash fast across their range. Collision and
  // stomp rules are identical for all three: only the movement rhythm differs,
  // so every world teaches a new timing.
  patrol: {speed: 55, range: 65, hopPeriod: 0, hopVelocity: 0, dash: null},
  hopper: {speed: 35, range: 45, hopPeriod: 1.6, hopVelocity: -380, dash: null},
  charger: {speed: 60, range: 110, hopPeriod: 0, hopVelocity: 0,
    dash: {period: 3.4, windup: 0.5, duration: 0.8, speed: 230}},
};
export function createWorld(index) {
  const spec = WORLDS[index];
  const solids = [
    ...spec.ground.map(([x, w]) => ({ x, y: 430, w, h: 140 })),
    ...spec.platforms.map(([x, y, w]) => ({ x, y, w, h: 22 })),
  ];
  const bones = [];
  spec.ground.forEach(([x, w]) => {
    for (let p = x + 180; p < x + w - 70; p += 140)
      bones.push({ x: p, y: 392, w: 20, h: 16, taken: false });
  });
  spec.platforms.forEach(([x, y, w], i) =>
    bones.push({
      x: x + w / 2,
      y: y - 35,
      w: 20,
      h: 16,
      taken: false,
      gold: i % 3 === 2,
    }),
  );
  return {
    spec,
    solids,
    bones,
    vines: (spec.vines || []).map((x) => ({x, y: VINE_TOP, w: 26, h: VINE_BOTTOM - VINE_TOP})),
    signs: vineSigns(spec),
    // Moving platforms patrol horizontally on a fixed 5s period from world
    // time, so they stay deterministic. They are one-way shortcuts, never
    // required: every gap beneath them stays directly jumpable.
    movers: (spec.movers || []).map(([x0, x1, y, w]) => ({x0, x1, y, w, h: 22, x: x0, dx: 0, mover: true})),
    enemies: spec.enemies.map((entry) => {
      // Plain numbers stay classic patrols; objects add a kind. Unknown kinds
      // fall back to patrol so old and hand-made levels keep working.
      const x = typeof entry === 'number' ? entry : entry.x;
      const kind = ENEMY_KINDS[entry?.kind] ? entry.kind : 'patrol';
      return {
        x,
        y: 406,
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
    // Hoppers bounce on their period and land back on the patrol line. The
    // stomp rule below reads e.y live, so mid-hop stomps work unchanged.
    if (kind.hopPeriod > 0) {
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
