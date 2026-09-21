// Seeded two-puff clouds for the trail sky. Positions come from one integer
// seed through a local generator (no module coupling), drift with time, and
// wrap across a fixed span so the layer never runs out. All motion is a pure
// function of (layout, distance, time): the same inputs paint the same sky on
// every device, in replays, and in tests. Clouds are sky dressing only —
// mood-tinted, fogged for depth — and never touch gameplay or light levels.
export const CLOUD_COUNT = 14;
export const CLOUD_PUFFS = 2;
export const CLOUD_SPAN = 200;
export const CLOUD_X_MIN = -100;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cloudLayout(seed = 1989) {
  const rng = mulberry32(seed);
  const clouds = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      x: rng() * CLOUD_SPAN,
      y: 26 + rng() * 38,
      z: -130 + rng() * 60,
      scale: 9 + rng() * 9,
      drift: 0.4 + rng() * 0.7,
      phase: rng() * Math.PI * 2,
      lobeDx: 8 + rng() * 6,
      lobeDy: -1 + rng() * 2,
      lobeDs: 0.55 + rng() * 0.2,
    });
  }
  return clouds;
}

export function cloudFrame(layout, index, distance, time, reducedMotion = false) {
  const c = layout[index % layout.length];
  const raw = c.x - distance * 0.06 + (reducedMotion ? 0 : time * c.drift);
  const x = ((((raw - CLOUD_X_MIN) % CLOUD_SPAN) + CLOUD_SPAN) % CLOUD_SPAN) + CLOUD_X_MIN;
  return {
    x,
    y: c.y + (reducedMotion ? 0 : Math.sin(time * 0.3 + c.phase) * 1.5),
    z: c.z,
  };
}
