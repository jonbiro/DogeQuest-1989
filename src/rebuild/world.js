export const WORLDS = [
  {
    name: "The backyard",
    subtitle: "Every great adventure starts with a very small fence.",
    sky: "#b9dfda",
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
    checkpoint: 1780,
  },
  {
    name: "Bramble woods",
    subtitle: "Take the high road. The mushrooms know the way.",
    sky: "#c9dcbb",
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
    enemies: [1030, 1850, 2650],
    checkpoint: 1660,
  },
  {
    name: "Honeyhill hop",
    subtitle: "A little sunshine. A lot of questionable shortcuts.",
    sky: "#f3deb0",
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
    enemies: [1040, 1770, 2510, 3220],
    checkpoint: 1550,
  },
  {
    name: "Blue hour",
    subtitle: "Follow the fireflies all the way home.",
    sky: "#9aaecb",
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
    enemies: [960, 1620, 2410, 3240],
    checkpoint: 2190,
  },
  {
    name: "Home, sweet home",
    subtitle: "The last stretch. Someone left the porch light on.",
    sky: "#e8bdba",
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
    enemies: [1010, 1680, 2360, 3070, 3700],
    checkpoint: 2160,
  },
];

export const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
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
    enemies: spec.enemies.map((x) => ({
      x,
      y: 406,
      w: 30,
      h: 24,
      origin: x,
      dir: -1,
      alive: true,
    })),
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
      h: 34,
      vx: 0,
      vy: 0,
      grounded: false,
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

export function respawn(world) {
  const p = world.player;
  Object.assign(p, {
    x: world.checkpoint ? world.spec.checkpoint : 70,
    y: 370,
    vx: 0,
    vy: 0,
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
  for (const s of world.solids) {
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
    }
  }
  if (!p.grounded && p.coyote === 0 && p.jumps === 0) p.jumps = 1;
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
    e.x += e.dir * 55 * dt;
    if (Math.abs(e.x - e.origin) > 65) e.dir *= -1;
    if (overlaps(p, e)) {
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
  if (p.y > 600) respawn(world);
  if (p.x > world.spec.length - 140) {
    world.finished = true;
    world.events.push({ type: "win", x: p.x, y: p.y });
  }
}
