// Rendering-independent runner simulation. Positions are in meters; time is seconds.
export const LANES = [-2.4, 0, 2.4];
export function seededRandom(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function createRun(seed = Date.now()) {
  const run = {
    seed,
    random: seededRandom(seed),
    distance: 0,
    time: 0,
    speed: 13,
    lane: 1,
    x: 0,
    y: 0,
    vy: 0,
    slide: 0,
    hearts: 3,
    invulnerable: 0,
    shield: 0,
    magnet: 0,
    bones: 0,
    combo: 0,
    bestCombo: 0,
    score: 0,
    ended: false,
    objects: [],
    nextRow: 45,
    row: 0,
    id: 0,
    events: [],
  };
  fillTrack(run);
  return run;
}
function add(run, type, lane, at) {
  run.objects.push({ id: run.id++, type, lane, at, used: false });
}
export function fillTrack(run) {
  while (run.nextRow < run.distance + 170) {
    const at = run.nextRow;
    const safe = Math.floor(run.random() * 3);
    const blocked = (safe + 1 + Math.floor(run.random() * 2)) % 3;
    if (run.row > 1) {
      add(
        run,
        ["rock", "log", "arch"][Math.floor(run.random() * 3)],
        blocked,
        at,
      );
      if (run.row > 8 && run.random() > 0.45)
        add(
          run,
          ["rock", "log", "arch"][Math.floor(run.random() * 3)],
          3 - safe - blocked,
          at,
        );
    }
    for (let i = 0; i < 4; i++) add(run, "bone", safe, at + i * 3);
    if (run.row > 0 && run.row % 6 === 0)
      add(run, run.row % 12 === 0 ? "shield" : "magnet", safe, at + 13);
    run.row++;
    run.nextRow += 25 + run.random() * 8;
  }
}
export function act(run, action) {
  if (run.ended) return;
  if (action === "left") run.lane = Math.max(0, run.lane - 1);
  if (action === "right") run.lane = Math.min(2, run.lane + 1);
  if (action === "jump" && run.y <= 0.001) {
    run.slide = 0;
    run.vy = 9.5;
    run.events.push("jump");
  }
  if (action === "slide") {
    run.slide = 0.85;
    if (run.y > 0) run.vy = -14;
  }
}
export function step(run, dt) {
  if (run.ended) return;
  dt = Math.min(dt, 1 / 30);
  run.time += dt;
  run.speed = Math.min(25, 13 + run.distance / 180);
  run.distance += run.speed * dt;
  run.x += (LANES[run.lane] - run.x) * Math.min(1, dt * 15);
  run.vy -= 24 * dt;
  run.y = Math.max(0, run.y + run.vy * dt);
  if (!run.y) run.vy = Math.max(0, run.vy);
  run.slide = Math.max(0, run.slide - dt);
  run.invulnerable = Math.max(0, run.invulnerable - dt);
  run.magnet = Math.max(0, run.magnet - dt);
  for (const object of run.objects) {
    if (object.used) continue;
    const dz = object.at - run.distance;
    const sameLane = Math.abs(LANES[object.lane] - run.x) < 0.95;
    if (object.type === "bone") {
      if (
        (Math.abs(dz) < 1.4 && sameLane && run.y < 2.7) ||
        (run.magnet > 0 && Math.abs(dz) < 8)
      ) {
        object.used = true;
        run.bones++;
        run.combo++;
        run.bestCombo = Math.max(run.combo, run.bestCombo);
        run.events.push("bone");
      } else if (dz < -2) run.combo = 0;
    } else if (Math.abs(dz) < 1.05 && sameLane) {
      if (object.type === "magnet" || object.type === "shield") {
        object.used = true;
        if (object.type === "magnet") run.magnet = 10;
        else run.shield = 1;
        run.events.push(object.type);
      } else {
        const cleared =
          (object.type === "log" && run.y > 1.05) ||
          (object.type === "arch" && run.slide > 0 && run.y < 0.2);
        if (!cleared && run.invulnerable === 0) {
          object.used = true;
          if (run.shield) {
            run.shield = 0;
            run.events.push("shield-break");
          } else {
            run.hearts--;
            run.events.push("hit");
          }
          run.combo = 0;
          run.invulnerable = 1.8;
          if (run.hearts <= 0) {
            run.ended = true;
            run.events.push("end");
            break;
          }
        }
      }
    }
  }
  run.objects = run.objects.filter((object) => object.at > run.distance - 8);
  run.score = Math.floor(run.distance) + run.bones * 25;
  fillTrack(run);
}
