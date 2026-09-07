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
import { levels } from "./progression.js";
const SOLID_HAZARDS = ["rock", "log", "arch", "branch", "gate"];
export const HAZARDS = [...SOLID_HAZARDS,"gap"];
export const PICKUPS = ["bone", "magnet", "shield", "gem", "double", "heart", 'gift', 'zoomies'];
export function createRun(seed = Date.now(), upgrades = {}) {
  const run = {
    seed,
    random: seededRandom(seed),
    distance: 0,
    time: 0,
    speed: 22,
    upgrades: levels(upgrades),
    jumpBuffer: 0,
    double: 0,
    zoomies: 0,
    smashes: 0,
    bonusPoints: 0,
    bonePoints: 0,
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
    clears: 0,
    gifts: 0,
    score: 0,
    ended: false,
    objects: [],
    nextRow: 45,
    nextChoice: 350,
    choicePending: null,
    route: null,
    routeChoices: 0,
    row: 0,
    id: 0,
    events: [],
    effects: [],
    previous: { x: 0, y: 0, distance: 0 },
  };
  fillTrack(run);
  return run;
}
function add(run, type, lane, at) {
  run.objects.push({ id: run.id++, type, lane, at, used: false, skillReward:run.route?.kind==="challenge"&&at<run.route.until?60:20 });
}
export function fillTrack(run) {
  if(run.choicePending!==null)return;
  while (run.nextRow < run.distance + 170) {
    if(run.nextRow>=run.nextChoice-45) {
      add(run,"choice-left",0,run.nextChoice);
      add(run,"choice-right",2,run.nextChoice);
      run.choicePending=run.nextChoice;
      run.nextRow=run.nextChoice+40;
      break;
    }
    const route=run.route && run.nextRow<run.route.until ? run.route.kind : null;
    const gapRow = run.row > 5 && run.row % 12 === 10;
    const at = gapRow ? Math.round(run.nextRow/5)*5 : run.nextRow;
    const safe = Math.floor(run.random() * 3);
    const blocked = (safe + 1 + Math.floor(run.random() * 2)) % 3;
    const actionRow = route!=="scenic" && run.row > 5 && (route==="challenge" ? run.row%2===0 : run.row % 4 === 2);
    if (actionRow) {
      const type = gapRow ? "gap" : (route==="challenge" ? Math.floor(run.row/2)%2===0 : run.row % 8 === 2) ? "log" : "gate";
      for (let lane = 0; lane < 3; lane++) add(run, type, lane, at);
    } else if (run.row > 0) {
      add(run, SOLID_HAZARDS[Math.floor(run.random() * SOLID_HAZARDS.length)], blocked, at);
      if (route!=="scenic" && run.row > 2 && run.random() > 0.15)
        add(
          run,
          SOLID_HAZARDS[Math.floor(run.random() * SOLID_HAZARDS.length)],
          3 - safe - blocked,
          at,
        );
    }
    const boneLane = run.row < 3 || run.random() < 0.4 ? safe : blocked;
    for (let i = 0; i < 4; i++) add(run, "bone", boneLane, at + i * 3);
    if (run.row > 0 && run.row % 3 === 0)
      add(
        run,
        ["gem", "magnet", "double", "zoomies", "shield", "heart"][(run.row / 3 - 1) % 6],
        safe,
        at + 15,
      );
    run.row++;
    if (run.row % 9 === 0) add(run,'gift',safe,at+19);
    run.nextRow += (actionRow ? 42 : 26) + run.random() * 6;
  }
}
export function act(run, action) {
  if (run.ended) return;
  if (action === "left") run.lane = Math.max(0, run.lane - 1);
  if (action === "right") run.lane = Math.min(2, run.lane + 1);
  if (action === "jump" && run.y <= 0.001) {
    run.slide = 0;
    run.vy = 12.5 * (1 + run.upgrades.leap * 0.08);
    run.events.push("jump");
  }
  if (action === "jump" && run.y > 0 && run.y < 0.6 && run.vy < 0)
    run.jumpBuffer = 0.18;
  if (action === "slide") {
    run.slide = 1.15 + run.upgrades.slide * 0.2;
    run.vy = run.y > 0 ? -22 : 0;
    run.jumpBuffer = 0;
  }
}
export function step(run, dt) {
  if (run.ended) return;
  dt = Math.min(dt, 1 / 30);
  run.previous = { x: run.x, y: run.y, distance: run.distance };
  run.time += dt;
  const wasZooming = run.zoomies > 0;
  run.zoomies = Math.max(0, run.zoomies - dt);
  // Ease in and out; expiry cannot leave the puppy unprotected inside a row.
  const targetSpeed = Math.min(36, 22 + run.distance / 90) * (run.zoomies > 0 ? 1.3 : 1);
  run.speed += (targetSpeed - run.speed) * (1 - Math.exp(-6 * dt));
  if (wasZooming && run.zoomies === 0) {
    run.invulnerable = Math.max(run.invulnerable, 1.2);
    run.events.push("zoomies-end");
  }
  run.distance += run.speed * dt;
  if(run.zoomies>0 && run.y===0 && run.objects.some(object=>object.type==="gap" && object.at-run.distance>0 && object.at-run.distance<run.speed*.45)) act(run,"jump");
  run.x += (LANES[run.lane] - run.x) * (1 - Math.exp(-15 * dt));
  if(run.choicePending!==null && run.distance>=run.choicePending) {
    const kind=run.x>1.2?"challenge":"scenic";
    run.route={kind,until:run.choicePending+220};
    run.routeChoices++;
    run.nextChoice=run.choicePending+700;
    run.choicePending=null;
    run.events.push(`route-${kind}`);
  }
  run.y = Math.max(0, run.y + run.vy * dt - 11 * dt * dt);
  run.vy -= 22 * dt;
  if (!run.y) run.vy = Math.max(0, run.vy);
  if (!run.y && run.jumpBuffer > 0) {
    run.jumpBuffer = 0;
    act(run, "jump");
  }
  run.jumpBuffer = Math.max(0, run.jumpBuffer - dt);
  run.slide = Math.max(0, run.slide - dt);
  run.invulnerable = Math.max(0, run.invulnerable - dt);
  run.magnet = Math.max(0, run.magnet - dt);
  run.double = Math.max(0, run.double - dt);
  run.effects = run.effects.filter((effect) => run.time - effect.time < 0.45);
  for (const object of run.objects) {
    if (object.used) continue;
    const dz = object.at - run.distance;
    const sameLane = Math.abs(LANES[object.lane] - run.x) < 0.95;
    if (object.type === "bone") {
      if (!object.pull && run.magnet > 0 && dz > -3 && dz < 16) {
        object.pull = {
          elapsed: 0,
          duration: 0.24,
          fromX: LANES[object.lane],
          fromAt: object.at,
          fromY: 1.1,
        };
      }
      if (object.pull) object.pull.elapsed += dt;
      if (
        object.pull
          ? object.pull.elapsed >= object.pull.duration
          : Math.abs(dz) < 1.8 && sameLane
      ) {
        object.used = true;
        run.bones++;
        run.bonePoints +=
          (25 + run.upgrades.value * 5) * (run.double > 0 ? 2 : 1);
        run.combo++;
        run.bestCombo = Math.max(run.combo, run.bestCombo);
        run.events.push("bone");
        if (run.combo % 10 === 0) {
          run.bonusPoints += 100;
          run.events.push("streak");
        }
        run.effects.push({
          id: object.id,
          type: "bone",
          time: run.time,
          x: run.x,
          y: run.y + 1,
        });
      } else if (dz < -2 && !object.pull && !object.missed) {
        object.missed = true;
        run.combo = 0;
      }
    } else if (
      Math.abs(dz) < 1.05 &&
      sameLane &&
      PICKUPS.includes(object.type)
    ) {
      object.used = true;
      if (object.type === "magnet") run.magnet = 10 + run.upgrades.magnet * 3;
      if (object.type === "shield") run.shield = 1;
      if (object.type === "gem") run.bonusPoints += 250;
      if (object.type === "double") run.double = 10;
      if (object.type === "zoomies") run.zoomies = 6;
      if (object.type === "heart") run.hearts = Math.min(3, run.hearts + 1);
      if (object.type === 'gift') { run.gifts++;run.bonusPoints+=100; }
      run.events.push(object.type);
      run.effects.push({
        id: object.id,
        type: object.type,
        time: run.time,
        x: run.x,
        y: run.y + 1,
      });
    } else if (HAZARDS.includes(object.type) && dz < -0.4 && !object.passed) {
      object.passed = true;
      if (sameLane && run.zoomies > 0 && object.type !== "gap") {
        object.used = true;
        run.smashes++;
        run.bonusPoints += 40;
        run.events.push("smash");
        run.effects.push({id:object.id,type:"smash",time:run.time,x:run.x,y:1});
        continue;
      }
      const cleared =
        (object.type === "gap" && (run.y > .8 || run.zoomies > 0)) ||
        (object.type === "log" && run.y > 0.65) ||
        (object.type === "rock" && run.y > 1.25) ||
        (["arch", "branch", "gate"].includes(object.type) &&
          run.slide > 0 &&
          run.y < 0.2);
      if (sameLane && cleared) {
        run.clears++;
        run.bonusPoints += object.skillReward || 20;
        run.events.push("clear");
      }
      if (sameLane && !cleared && run.invulnerable === 0) {
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
  run.objects = run.objects.filter(
    (object) => object.at > run.distance - 8 || (object.pull && !object.used),
  );
  run.score = Math.floor(run.distance) + run.bonePoints + run.bonusPoints;
  fillTrack(run);
}
