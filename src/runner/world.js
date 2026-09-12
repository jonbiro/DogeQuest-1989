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
import {CURRENT_TRAIL_VERSION} from './trail-version.js';
import {chargeFetch, activateFetch} from './ability.js';
import {cleanMove} from './flow.js';
import {mistakeDetail} from './mistakes.js';
import { jump, steer, moveVertical, JUMP_BUFFER, SLIDE_BUFFER } from "./motion.js";
import { ZIPLINE_FIRST, ZIPLINE_PERIOD, ZIPLINE_LENGTH, ZIPLINE_HEIGHT } from "./ziplines.js";
import {courseAt, COURSE_LENGTH, COURSE_RECOVERY, advanceCourse} from './courses.js';
import {REGION_LENGTH} from './regions.js';
import {
  TURN_SKILL_REWARD,
  applyTurnInput,
  cornerByIndex,
  cornerIntersecting,
  cornersBetween,
} from "./turns.js";
const SOLID_HAZARDS = ["rock", "log", "arch", "branch", "gate"];
export const BASE_SLIDE_DURATION = .58;
export const SLIDE_UPGRADE_DURATION = .07;
export const HAZARDS = [...SOLID_HAZARDS,"gap"];
export const PICKUPS = ["bone", "magnet", "shield", "gem", "double", "heart", 'gift', 'zoomies'];
export function createRun(seed = Date.now(), upgrades = {}, generatorVersion = CURRENT_TRAIL_VERSION) {
  const run = {
    seed,
    generatorVersion: generatorVersion === 1 ? 1 : CURRENT_TRAIL_VERSION,
    random: seededRandom(seed),
    distance: 0,
    time: 0,
    resumeRemaining: 0,
    speed: 22,
    upgrades: levels(upgrades),
    jumpBuffer: 0,
    double: 0,
    zoomies: 0,
    fetchCharge: 0,
    fetchTime: 0,
    fetchUses: 0,
    smashes: 0,
    bonusPoints: 0,
    bonePoints: 0,
    streakPoints: 0,
    lane: 1,
    x: 0,
    vx: 0,
    y: 0,
    vy: 0,
    diving: false,
    landing: null,
    slide: 0,
    slideNext: 0,
    hearts: 3,
    invulnerable: 0,
    shield: 0,
    magnet: 0,
    bones: 0,
    combo: 0,
    bestCombo: 0,
    cleanStreak: 0,
    bestCleanStreak: 0,
    flowPoints: 0,
    lastFlowBonus: 0,
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
    nextCorner: 0,
    turnAttempt: null,
    turns: 0,
    missedTurns: 0,
    nextZipline: ZIPLINE_FIRST,
    zipline: null,
    ziplines: 0,
    course: null,
    lastCourseVisit: -1,
    regionalCourses: [0,0,0],
    row: 0,
    lastSafeLane: 1,
    id: 0,
    events: [],
    effects: [],
    lastMistake: null,
    lastMistakeDetail: null,
    slideExpiredAt: null,
    previous: { x: 0, y: 0, distance: 0 },
  };
  fillTrack(run);
  return run;
}
function add(run, type, lane, at) {
  const object = { id: run.id++, type, lane, at, used: false, skillReward:run.route?.kind==="challenge"&&at<run.route.until?60:20 };
  run.objects.push(object);
  return object;
}
export function fillTrack(run) {
  if (run.practice) return;
  if(run.choicePending!==null)return;
  // Mark upcoming turns independently from obstacle rows so the renderer can
  // telegraph them early even when generation resumes after a route choice.
  for (const corner of cornersBetween(run.distance - 8, run.distance + 170)) {
    if (!run.objects.some((object) => object.turnIndex === corner.index)) {
      const marker = add(run, `corner-${corner.direction}`, 1, corner.at);
      marker.direction = corner.direction;
      marker.turnIndex = corner.index;
    }
  }
  while (run.nextRow < run.distance + 170) {
    // Include the row's furthest ordinary reward in the reservation. A turn
    // approach should be readable, not hidden behind a bone or power-up trail.
    const corner = cornerIntersecting(run.nextRow, run.nextRow + 19);
    if (corner) {
      run.nextRow = Math.ceil((corner.recovery + .001) / 5) * 5;
      continue;
    }
    if (run.nextRow >= run.nextZipline - 45) {
      const start = run.nextZipline;
      add(run, "zipline-start", 1, start);
      add(run, "zipline-end", 1, start + ZIPLINE_LENGTH);
      // Long groups allow a deliberate left/center/right swing, even at Zoomies speed.
      for (let i = 0; i < 18; i++) {
        const lane = [1, 0, 1, 2, 1, 0][Math.floor(i / 3)];
        add(run, "bone", lane, start + 16 + i * 6).airborne = true;
      }
      add(run, "gift", 1, start + 128).airborne = true;
      run.nextRow = start + ZIPLINE_LENGTH + 45;
      run.nextZipline += ZIPLINE_PERIOD;
      continue;
    }
    if(run.nextRow>=run.nextChoice-45) {
      add(run,"choice-left",0,run.nextChoice);
      add(run,"choice-right",2,run.nextChoice);
      run.choicePending=run.nextChoice;
      run.nextRow=run.nextChoice+40;
      break;
    }
    const route=run.route && run.nextRow<run.route.until ? run.route.kind : null;
    // Regional courses break up random rows. Keep the entire course clear of
    // decision gates, and every hazard beat within its selected difficulty.
    const start = Math.ceil(run.nextRow/5)*5;
    const sequenceEnd = start + COURSE_LENGTH;
    const visit = Math.floor(start/REGION_LENGTH);
    if (start >= 195 && !run.course && visit !== run.lastCourseVisit && route !== "scenic" &&
        sequenceEnd < Math.min(run.nextChoice, run.nextZipline) - 45 &&
        sequenceEnd <= (visit+1)*REGION_LENGTH &&
        !cornerIntersecting(start, sequenceEnd) &&
        (!run.route || start >= run.route.until || sequenceEnd - COURSE_RECOVERY <= run.route.until)) {
      run.course = courseAt(start,run.generatorVersion);
      run.lastCourseVisit = visit;
      for (const beat of run.course.beats) {
        for (let lane = 0; lane < 3; lane++)
          if (lane !== beat.safeLane) add(run, beat.type, lane, beat.at).courseRegion = run.course.region;
        for (let i = 1; i <= 3; i++) add(run, "bone", beat.safeLane ?? 1, beat.at + i * 4);
      }
      add(run, "gift", 1, start + 88);
      run.nextRow = sequenceEnd;
      run.row++;
      continue;
    }
    const gapRow = run.row > 5 && run.row % 12 === 10;
    const at = gapRow ? Math.round(run.nextRow/5)*5 : run.nextRow;
    // Later rows force a lane decision instead of rewarding camping in one lane.
    const safe = run.row > 5 && route !== "scenic"
      ? (run.lastSafeLane + 1 + Math.floor(run.random() * 2)) % 3
      : Math.floor(run.random() * 3);
    run.lastSafeLane = safe;
    const blocked = (safe + 1 + Math.floor(run.random() * 2)) % 3;
    const actionRow = route!=="scenic" && run.row > 5 && (route==="challenge" ? run.row%2===0 : run.row % 4 === 2);
    if (actionRow) {
      const type = gapRow ? "gap" : (route==="challenge" ? Math.floor(run.row/2)%2===0 : run.row % 8 === 2) ? "log" : "gate";
      const split = at > 800 && !gapRow && run.row % 8 === 6;
      for (let lane = 0; lane < 3; lane++) {
        const obstacle=add(run, split ? lane === safe ? 'gate' : 'log' : type, lane, at);
        if(split) obstacle.splitChoice=true;
      }
    } else if (run.row > 0) {
      add(run, SOLID_HAZARDS[Math.floor(run.random() * SOLID_HAZARDS.length)], blocked, at);
      if (route!=="scenic" && run.row > 2 && (run.random() > 0.15 || at > 600))
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
    // Keep full-width actions far enough apart for an unupgraded jump to land.
    // Lane rows tighten gradually; Scenic remains the gentler alternative.
    const pressure = route === "scenic" ? 0 : Math.min(1, at / 1200);
    run.nextRow += (actionRow ? 42 : 26 - pressure * 4) + run.random() * 6;
  }
}
export function act(run, action) {
  if (run.ended) return;
  if (action === 'fetch') { activateFetch(run); return; }
  if (action === "left" && !applyTurnInput(run, action)) run.lane = Math.max(0, run.lane - 1);
  if (action === "right" && !applyTurnInput(run, action)) run.lane = Math.min(2, run.lane + 1);
  if (run.zipline) return;
  if (action === "jump") {
    if (run.y === 0 && run.vy === 0) jump(run);
    else run.jumpBuffer = JUMP_BUFFER;
  }
  if (action === "slide") {
    // Early repeats never restart a slide. A deliberate late press can queue
    // one follow-up, but cannot erase a jump already buffered during a dive.
    if (run.slide > 0) {
      if(run.slide<=SLIDE_BUFFER&&!run.diving&&!run.jumpBuffer)
        run.slideNext=BASE_SLIDE_DURATION+run.upgrades.slide*SLIDE_UPGRADE_DURATION;
      return;
    }
    run.slideExpiredAt = null;
    if (run.slide === 0) run.events.push('slide');
    run.slide = BASE_SLIDE_DURATION + run.upgrades.slide * SLIDE_UPGRADE_DURATION;
    run.diving = run.y > 0;
    if (!run.diving) run.vy = 0;
    run.jumpBuffer = 0;
  }
}

function syncUnvisitedCorners(run) {
  // Test fixtures and restored sessions may begin far down-trail. Only a corner
  // actually crossed by this simulation step can penalize the runner.
  let corner = cornerByIndex(run.nextCorner);
  while (corner && corner.at < run.distance - 1e-9) {
    run.nextCorner++;
    run.turnAttempt = null;
    corner = cornerByIndex(run.nextCorner);
  }
}

function harm(run, mistake) {
  if (run.invulnerable > 0) return false;
  run.lastMistake = mistake;
  run.lastMistakeDetail = mistakeDetail(run, mistake);
  run.cleanStreak = 0;
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
  }
  return true;
}

function resolveCorner(run, from, to) {
  const corner = cornerByIndex(run.nextCorner);
  if (!corner || from > corner.at || to < corner.at) return;
  const marker = run.objects.find((object) => object.turnIndex === corner.index);
  const success = run.turnAttempt?.index === corner.index && run.turnAttempt.correct;
  if (success) {
    run.turns++;
    cleanMove(run);
    chargeFetch(run, 20);
    run.bonusPoints += TURN_SKILL_REWARD;
    run.events.push(`turn-${corner.direction}`);
    if (marker) marker.turnState = "accepted";
  } else {
    run.missedTurns++;
    run.events.push(`missed-turn-${corner.direction}`);
    if (marker) marker.turnState = "missed";
    harm(run, {type: "corner", direction: corner.direction});
  }
  run.nextCorner++;
  run.turnAttempt = null;
}

export function step(run, dt) {
  if (run.ended || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 1 / 30);
  run.fetchTime = Math.max(0, run.fetchTime - dt);
  syncUnvisitedCorners(run);
  run.previous = { x: run.x, y: run.y, distance: run.distance };
  run.time += dt;
  const wasZooming = run.zoomies > 0;
  run.zoomies = Math.max(0, run.zoomies - dt);
  // Ease in and out; expiry cannot leave the puppy unprotected inside a row.
  const targetSpeed = run.practice ? 12 : Math.min(36, 22 + run.distance / 90) * (run.zoomies > 0 ? 1.3 : 1);
  run.speed += (targetSpeed - run.speed) * (1 - Math.exp(-6 * dt));
  if (wasZooming && run.zoomies === 0) {
    run.invulnerable = Math.max(run.invulnerable, 1.2);
    run.events.push("zoomies-end");
  }
  run.distance += run.speed * dt;
  // Zoomies can smash or vault physical hazards, but steering through a corner
  // remains a player decision.
  resolveCorner(run, run.previous.distance, run.distance);
  if (run.ended) {
    run.score = Math.floor(run.distance) + run.bonePoints + run.bonusPoints;
    return;
  }
  if(run.zoomies>0 && run.y===0 && run.objects.some(object=>object.type==="gap" && object.at-run.distance>0 && object.at-run.distance<run.speed*.45)) act(run,"jump");
  steer(run, LANES[run.lane], dt);
  if(run.choicePending!==null && run.distance>=run.choicePending) {
    const kind=run.x>1.2?"challenge":"scenic";
    run.route={kind,until:run.choicePending+220};
    run.routeChoices++;
    run.nextChoice=run.choicePending+700;
    run.choicePending=null;
    run.events.push(`route-${kind}`);
  }
  if (run.zipline) {
    run.y += (ZIPLINE_HEIGHT - run.y) * (1 - Math.exp(-8 * dt));
    run.vy = 0;
    run.diving = false;
    run.slide = 0;
    run.slideNext = 0;
    run.jumpBuffer = 0;
    if (run.distance >= run.zipline.end) {
      run.zipline = null;
      run.ziplines++;
      run.bonusPoints += 250;
      run.invulnerable = Math.max(run.invulnerable, 1.2);
      run.events.push("zipline-end");
    }
  } else {
    moveVertical(run, dt);
  }
  run.invulnerable = Math.max(0, run.invulnerable - dt);
  run.magnet = Math.max(0, run.magnet - dt);
  run.double = Math.max(0, run.double - dt);
  run.effects = run.effects.filter((effect) => run.time - effect.time < 0.45);
  for (const object of run.objects) {
    if (object.used) continue;
    const dz = object.at - run.distance;
    const sameLane = Math.abs(LANES[object.lane] - run.x) < 0.95;
    if (object.type === "zipline-start" && !object.caught && Math.abs(dz) < 3 && run.y > .65 && !run.zipline) {
      object.caught = true;
      run.zipline = {start: object.at, end: object.at + ZIPLINE_LENGTH};
      run.slide = 0;
      run.slideNext = 0;
      run.jumpBuffer = 0;
      run.events.push("zipline-start");
    }
    // Airborne treats belong to the cable route, not to runners underneath it.
    const reachable = !object.airborne || Boolean(run.zipline);
    if (object.type === "bone") {
      if (!object.pull && reachable && run.magnet > 0 && dz > -3 && dz < 16) {
        object.pull = {
          elapsed: 0,
          duration: 0.24,
          fromX: LANES[object.lane],
          fromAt: object.at,
          fromY: object.airborne ? ZIPLINE_HEIGHT + 1.1 : 1.1,
        };
      }
      if (object.pull) object.pull.elapsed += dt;
      if (
        object.pull
          ? object.pull.elapsed >= object.pull.duration
          : reachable && Math.abs(dz) < 1.8 && sameLane
      ) {
        object.used = true;
        run.bones++;
        if (!object.pull) chargeFetch(run, 2);
        run.bonePoints +=
          (25 + run.upgrades.value * 5) * (run.double > 0 ? 2 : 1);
        run.combo++;
        run.bestCombo = Math.max(run.combo, run.bestCombo);
        run.events.push("bone");
        if (run.combo % 10 === 0) {
          run.bonusPoints += 100;
          run.streakPoints += 100;
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
        // Optional cable rewards cannot be missed by a puppy on the ground.
        if (reachable) run.combo = 0;
      }
    } else if (
      Math.abs(dz) < 1.05 &&
      reachable &&
      sameLane &&
      PICKUPS.includes(object.type)
    ) {
      object.used = true;
      if (object.type === "magnet") run.magnet = 10 + run.upgrades.magnet * 3;
      if (object.type === "shield") {
        if (run.shield) run.bonusPoints += 100;
        else run.shield = 1;
      }
      if (object.type === "gem") run.bonusPoints += 250;
      if (object.type === "double") run.double = 10;
      if (object.type === "zoomies") run.zoomies = 6;
      if (object.type === "heart") {
        if (run.hearts < 3) run.hearts++;
        else run.bonusPoints += 100;
      }
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
        if (run.zoomies === 0) { chargeFetch(run, 12); cleanMove(run); }
        run.bonusPoints += object.skillReward || 20;
        run.events.push("clear");
      }
      if (sameLane && !cleared && run.invulnerable === 0) {
        object.used = true;
        harm(run, object.type==='rock' && [0,1,2].includes(object.courseRegion)
          ? {type:'rock',courseWeave:true} : {type: object.type});
        if (run.ended) break;
      }
    }
  }
  run.objects = run.objects.filter(
    (object) => object.at > run.distance - 8 || (object.pull && !object.used),
  );
  if (!run.ended) advanceCourse(run, LANES);
  run.score = Math.floor(run.distance) + run.bonePoints + run.bonusPoints;
  fillTrack(run);
}
