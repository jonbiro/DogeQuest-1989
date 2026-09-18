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
import {CURRENT_TRAIL_VERSION,supportsTrailVersion} from './trail-version.js';
import {chargeFetch, activateFetch} from './ability.js';
import {cleanMove} from './flow.js';
import {mistakeDetail} from './mistakes.js';
import { jump, steer, moveVertical, JUMP_BUFFER, SLIDE_BUFFER } from "./motion.js";
import { ZIPLINE_FIRST, ZIPLINE_PERIOD, ZIPLINE_LENGTH, ZIPLINE_HEIGHT } from "./ziplines.js";
import {courseAt, COURSE_LENGTH, COURSE_RECOVERY, advanceCourse} from './courses.js';
import {REGION_LENGTH,regionAt} from './regions.js';
import {AREA_LENGTH,areaAt,areaGameplayAt} from './areas.js';
import {encounterFor,recoveryUntilFor,encounterPhaseAt} from './encounter-director.js';
import {raftIntersecting,raftEncounter,advanceRaft,moveRaft} from './rafts.js';
import {
  MINECART_FIRST,
  MINECART_PERIOD,
  MINECART_CHOICE_VERSION,
  minecartByIndex,
  minecartIntersecting,
  minecartEncounter,
  advanceMinecart,
  moveMinecart,
} from './minecart.js';
import {
  MOVING_GATE_FIRST,
  MOVING_GATE_PERIOD,
  movingGateByIndex,
  movingGateEncounter,
  movingGateIntersecting,
  movingGateX,
} from './moving-gate.js';
import {
  BRIDGE_COLLAPSE_FIRST,
  BRIDGE_COLLAPSE_PERIOD,
  bridgeCollapseByIndex,
  bridgeCollapseIntersecting,
} from './bridges.js';
import {
  DOG_CHASE_FIRST,
  DOG_CHASE_PERIOD,
  DOG_CHASE_REWARD,
  dogChaseByIndex,
} from './dog-chase.js';
import {
  SKI_FIRST,
  SKI_PERIOD,
  skiByIndex,
  skiIntersecting,
  skiEncounter,
  advanceSki,
  moveSki,
  skiHopHeight,
  skiYetiX,
  skiSnowballX,
  SKI_HOP_DURATION,
} from './ski.js';
import {
  TURN_SKILL_REWARD,
  applyTurnInput,
  cornerByIndex,
  cornerIntersecting,
  cornersBetween,
} from "./turns.js";
import {routeBranchFor, routeTrailFor} from './route-branch.js';
import {applyRunModifier} from './run-modifiers.js';
import {
  SOLID_HAZARDS as CAST_SOLID_HAZARDS,
  HAZARDS as CAST_HAZARDS,
  HAZARD_CAST,
} from './hazard-cast.js';
// The live-only character hazard (pound worker) breaks up the endless
// rock/log silhouette. It lives in the cast but stays out of SOLID_HAZARDS so
// legacy seeded streams remain byte-for-byte stable; current browser runs opt
// into it through the shelter encounter beat. The lists live in
// `hazard-cast.js` so rules and appearance share one source.
const SOLID_HAZARDS = CAST_SOLID_HAZARDS;
export const BASE_SLIDE_DURATION = .58;
export const SLIDE_UPGRADE_DURATION = .07;
// Re-exported so existing `world.js` import sites keep working while the
// canonical lists live in `hazard-cast.js`.
export const HAZARDS = CAST_HAZARDS;
export {HAZARD_CAST};
export const AREA_RELIC_REWARD = 160;
export const NEAR_MISS_REWARD = 15;
// The live trail earns its first real hazard only after a short runway. This
// is intentionally row-based so seeded historical streams remain untouched,
// while a new player gets room to try a lane tap and read the first turn.
export const OPENING_RUNWAY_ROWS = 3;
export const PICKUPS = ["bone", "magnet", "shield", "gem", "double", "heart", 'gift', 'zoomies', 'relic'];
export function createRun(seed = Date.now(), upgrades = {}, generatorVersion = CURRENT_TRAIL_VERSION, modifier = null, options = {}) {
  generatorVersion=supportsTrailVersion(generatorVersion)?generatorVersion:CURRENT_TRAIL_VERSION;
  const encounterPacing = options?.encounterPacing === true && generatorVersion >= 5;
  const run = {
    seed,
    generatorVersion,
    // The live app opts current trails into authored warm-up/recovery pacing.
    // Keeping this explicit lets deterministic unit/replay fixtures compare
    // historical streams without silently rewriting their opening rows.
    encounterPacing,
    raftPrototype:generatorVersion>=4,
    // Current prototype trails add a short mine-cart beat after the established
    // river/sky chapters. Versions 1–3 retain their exact object streams.
    minecartPrototype:generatorVersion>=4,
    // Version five adds a clearly optional scenic gem line to the cart. Keep
    // version four's object stream intact so existing shared links replay the
    // same ride they were authored with.
    minecartChoicePrototype: generatorVersion >= MINECART_CHOICE_VERSION,
    // The moving-gate chapter is a light timing encounter. It is opt-in for
    // version four so historical shared trails keep their exact object stream.
    movingGatePrototype: generatorVersion >= 4,
    // A friendly chase-pup beat is a version-four presentation/reward chapter.
    // It has no collision type of its own; the existing lane and bone rules
    // stay authoritative while the companion leads a short reward line.
    dogChasePrototype: generatorVersion >= 4,
    // Frostpeak is a current-trail chapter. It deliberately lives outside the
    // six-area palette so old saves and area progress remain compatible.
    skiPrototype: generatorVersion >= 5,
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
    nearMisses: 0,
    nearMissPoints: 0,
    bonusPoints: 0,
    pickupBonusPoints: 0,
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
    modifier: null,
    bones: 0,
    combo: 0,
    bestCombo: 0,
    cleanStreak: 0,
    bestCleanStreak: 0,
    flowPoints: 0,
    lastFlowBonus: 0,
    clears: 0,
    weaves: 0,
    gifts: 0,
    // Presentation-only receipt data: the results sheet can explain each
    // special item without changing score, persistence or seeded generation.
    pickupCounts: {
      magnet: 0,
      shield: 0,
      gem: 0,
      double: 0,
      heart: 0,
      gift: 0,
      zoomies: 0,
      relic: 0,
    },
    relics: 0,
    relicPoints: 0,
    relicsByArea: Array(6).fill(0),
    score: 0,
    ended: false,
    objects: [],
    // Keep the established 45m opening so modifier previews and older shared
    // links see the same seeded start. Quiet warm-up rows take over at later
    // area boundaries where the director has room to breathe.
    nextRow: 45,
    nextChoice: 350,
    choicePending: null,
    route: null,
    routeChoices: 0,
    routeTrailBones: 0,
    routeTrailPoints: 0,
    // The director also paces current trails. Historical versions stay frozen
    // below so shared links continue to replay their authored object streams.
    encounter: null,
    encounterRecoveryUntil: 0,
    nextCorner: 0,
    turnAttempt: null,
    turns: 0,
    missedTurns: 0,
    nextZipline: ZIPLINE_FIRST,
    zipline: null,
    ziplines: 0,
    nextMinecart: generatorVersion>=4 ? MINECART_FIRST : Infinity,
    minecart: null,
    minecartChoice: null,
    minecarts: 0,
    minecartGemChoices: 0,
    minecartBoneChoices: 0,
    nextMovingGate: generatorVersion >= 4 ? MOVING_GATE_FIRST : Infinity,
    movingGates: 0,
    nextDogChase: generatorVersion >= 4 ? DOG_CHASE_FIRST : Infinity,
    dogChaseUpcoming: null,
    dogChase: null,
    dogChases: 0,
    nextSki: generatorVersion >= 5 ? SKI_FIRST : Infinity,
    ski: null,
    skis: 0,
    skiJumps: 0,
    skiDodges: 0,
    skiGates: 0,
    skiYetiDodges: 0,
    skiYetiEncounters: 0,
    skiSnowballClears: 0,
    skiSnowballDodges: 0,
    skiSnowballEncounters: 0,
    skiSnowmenDodged: 0,
    skiSnowmanEncounters: 0,
    skiObstaclePoints: 0,
    skiUpcoming: null,
    // Collapsing bridges are version-four spectacle beats. They reuse the
    // proven full-width gap collision, but carry their own metadata so the
    // renderer, guidance, sound and results can describe the set piece.
    nextBridgeCollapse: generatorVersion >= 4 ? BRIDGE_COLLAPSE_FIRST : Infinity,
    bridgeCollapses: 0,
    course: null,
    lastCourseVisit: -1,
    regionalCourses: [0,0,0],
    row: 0,
    lastSafeLane: 1,
    // The renderer and feedback layer use this to announce a destination
    // transition once, even when a large restored step crosses the boundary.
    // It is ephemeral run context and does not affect seeded generation.
    lastArea: areaAt(0),
    id: 0,
    events: [],
    effects: [],
    // Ephemeral HUD context for instant pickups. The next frame can explain
    // what a reward did without turning a collection into a centre-screen
    // toast or putting UI wording into the deterministic save data.
    lastPickup: null,
    lastMistake: null,
    lastMistakeDetail: null,
    slideExpiredAt: null,
    // The first-run touch cue is opt-in from the UI layer. Count accepted
    // action attempts so it can disappear as soon as the player finds a move.
    inputCount: 0,
    // Keep touch onboarding independent from simulation/keyboard inputs. A
    // novice can press Jump while airborne or tap a lane boundary without
    // actually learning the touch controls; those attempts should not spend
    // the small lesson budget.
    touchActionCount: 0,
    // The UI only teaches no-lift swipes after a real swipe has been
    // recognized; button-first players keep a simpler lesson.
    touchSwipeSeen: false,
    // Set when a touch arrives as one unusually large sample. The next
    // thumb-length snap clears it and the dock explains that held drags can
    // continue one lane at a time without lifting.
    touchOverdrag: false,
    // A short or ambiguous touch should never fail silently. The UI renders
    // this beside the controls until the next touch attempt/action clears it.
    touchFeedback: '',
    previous: { x: 0, y: 0, distance: 0 },
  };
  applyRunModifier(run, modifier);
  fillTrack(run);
  run.encounter = encounterFor(run);
  return run;
}
function add(run, type, lane, at) {
  const object = { id: run.id++, type, lane, at, used: false, skillReward:run.route?.kind==="challenge"&&at<run.route.until?60:20 };
  run.objects.push(object);
  return object;
}

function skiObjectX(object, distance) {
  if (object?.skiYeti) return skiYetiX(object, distance);
  if (object?.skiSnowball) return skiSnowballX(object, distance);
  return LANES[object?.lane] ?? 0;
}

function dogChaseByNext(run) {
  if (!run?.dogChasePrototype || !Number.isFinite(run.nextDogChase)) return null;
  const index = Math.round((run.nextDogChase - DOG_CHASE_FIRST) / DOG_CHASE_PERIOD);
  return dogChaseByIndex(index);
}

function dogChaseReserved(run, chase) {
  if (!chase) return true;
  const start = chase.approach;
  const end = chase.recovery;
  const courseOverlap = run.course && run.course.end >= start && run.course.start <= end;
  const ziplineStart = Number.isFinite(run.nextZipline) ? run.nextZipline : Infinity;
  const ziplineOverlap = ziplineStart <= end + 45 &&
    ziplineStart + ZIPLINE_LENGTH + 45 >= start;
  const choiceOverlap = Number.isFinite(run.nextChoice) &&
    run.nextChoice >= start - 45 && run.nextChoice <= end + 45;
  return Boolean(
    cornerIntersecting(start, end) ||
    (run.raftPrototype && raftIntersecting(start, end)) ||
    (run.minecartPrototype && minecartIntersecting(start, end)) ||
    (run.movingGatePrototype && movingGateIntersecting(start, end)) ||
    (run.skiPrototype && skiIntersecting(start, end)) ||
    bridgeCollapseIntersecting(start, end) ||
    courseOverlap || ziplineOverlap || choiceOverlap,
  );
}

function scheduleDogChase(run, chase) {
  if (!chase || dogChaseReserved(run, chase)) return false;
  // A small, alternating line lets the player chase the companion through the
  // familiar lanes without adding a new hazard or changing collision timing.
  const lanes = chase.lane === 1 ? [1, 1, 1, 2, 2, 2, 2] : [0, 0, 0, 1, 1, 1, 1];
  lanes.forEach((lane, index) => {
    const bone = add(run, 'bone', lane, chase.start + 10 + index * 10);
    bone.chasePickup = true;
    bone.encounter = 'Dog chase';
  });
  const gift = add(run, 'gift', lanes.at(-1), chase.end - 8);
  gift.chasePickup = true;
  gift.encounter = 'Dog chase';
  run.dogChaseUpcoming = chase;
  run.nextRow = chase.recovery + 5;
  run.nextDogChase = chase.start + DOG_CHASE_PERIOD;
  run.row++;
  return true;
}
function areaPattern(at, row) {
  const profile = areaGameplayAt(at);
  const patterns = profile.patterns || [];
  if (!patterns.length) return null;
  const index = (Math.max(0, row) + Math.floor(Math.max(0, at) / AREA_LENGTH)) % patterns.length;
  return patterns[index];
}
function areaHazard(run, at, row) {
  const profile=areaGameplayAt(at);
  // Every named pattern now has its own hazard rhythm. The vocabulary stays
  // familiar, but alternating low/high beats and turn-safe shapes stop a
  // destination from feeling like the same four-row loop with a new backdrop.
  // Legacy generators deliberately keep the original profile cadence.
  const pattern = run?.generatorVersion >= 4 ? areaPattern(at, row) : null;
  const sequence = pattern?.hazardOrder?.length ? pattern.hazardOrder : profile.hazards;
  return sequence[(row+Math.floor(at/AREA_LENGTH))%sequence.length];
}
function areaActionHazard(run, at, row) {
  const type=areaHazard(run,at,row);
  // Full-width beats are a single, unmistakable input. Rocks need the
  // runner's higher jump clearance and become too tight after a delayed
  // takeoff, so keep that destination flavor in lane beats and use the
  // proven low-clearance jump for the shared action beat.
  return type==='rock'?'log':type;
}

// Which character crosses in this shelter beat. The cast joins one crossing
// at a time: the familiar worker first, the slide-demanding officer second,
// then the full trio rotates. Crossings land hundreds of meters apart, so the
// introduction is staged by distance in practice, while the encounter count
// keeps every seed and shared replay deterministic without consuming the
// seeded random.
function shelterCast(run) {
  const index = Number.isInteger(run.shelterBeats) ? run.shelterBeats : 0;
  if (index === 0) return 'pound-worker';
  if (index === 1) return 'pound-officer';
  return ['pound-worker', 'pound-officer', 'crate-cart'][index % 3];
}

function scheduleRouteTrail(run) {
  if (run.generatorVersion < 4 || !run.route ||
      !Number.isFinite(run.route.forkAt) || run.route.branchTrailSpawned) return false;
  // Only routes committed by the current v4 fork carry a fork distance. This
  // keeps hand-authored fixtures and older restored route objects unchanged.
  const branch = routeBranchFor(run.route.kind, run.route.forkAt, run.route.until);
  Object.assign(run.route, {
    forkAt: branch.forkAt,
    branchId: run.route.branchId || branch.branchId,
    branchTitle: run.route.branchTitle || branch.branchTitle,
    branchDetail: run.route.branchDetail || branch.branchDetail,
    branchPreview: run.route.branchPreview || branch.branchPreview,
    branchColor: run.route.branchColor || branch.branchColor,
    shortcut: Object.hasOwn(run.route, 'shortcut') ? run.route.shortcut : branch.shortcut,
    trailStart: run.route.trailStart ?? branch.trailStart,
    trailEnd: run.route.trailEnd ?? branch.trailEnd,
    trailLanes: run.route.trailLanes ?? branch.trailLanes,
  });
  for (const station of routeTrailFor(run.route)) {
    const bone = add(run, 'bone', station.lane, station.at);
    bone.routeTrail = true;
    bone.routeKind = run.route.kind;
    bone.routeBranchId = run.route.branchId;
    bone.optional = true;
    bone.encounter = run.route.branchTitle;
  }
  run.route.branchTrailSpawned = true;
  return true;
}
export function fillTrack(run) {
  if (run.practice) return;
  // A chase can fit before a pending fork. Schedule that quiet reward beat
  // first, then leave the fork's own clear approach untouched. Other pending
  // choices keep the historical early return so ordinary rows never crowd the
  // decision gate.
  if (run.choicePending !== null) {
    const chase = dogChaseByNext(run);
    if (chase && run.nextRow >= chase.approach && chase.approach < run.choicePending - 45) {
      if (scheduleDogChase(run, chase)) return;
    }
    return;
  }
  // Restored fixtures from before the cart rollout may not carry the new
  // scheduler field. Keep those runs deterministic and opt them in only when
  // their generator version explicitly supports carts.
  if (run.minecartPrototype && !Number.isFinite(run.nextMinecart)) run.nextMinecart = MINECART_FIRST;
  // Restored version-four runs created before the moving-gate rollout may not
  // carry the scheduler field. Opt them in deterministically without changing
  // legacy trail versions or manufacturing a gate behind the runner.
  if (run.movingGatePrototype && !Number.isFinite(run.nextMovingGate)) run.nextMovingGate = MOVING_GATE_FIRST;
  // Older restored version-four sessions may not carry the chase scheduler.
  // Opt them into the first deterministic beat without changing legacy trails.
  if (run.dogChasePrototype && !Number.isFinite(run.nextDogChase)) run.nextDogChase = DOG_CHASE_FIRST;
  // Restored version-five sessions may predate the Frostpeak rollout. Opt
  // them into the first deterministic descent without touching older trails.
  if (run.skiPrototype && !Number.isFinite(run.nextSki)) run.nextSki = SKI_FIRST;
  // Older restored version-four sessions may not carry the bridge scheduler.
  // Opt them into the first deterministic beat without changing legacy trail
  // versions or manufacturing a collapse behind the runner.
  if (run.generatorVersion >= 4 && !Number.isFinite(run.nextBridgeCollapse))
    run.nextBridgeCollapse = BRIDGE_COLLAPSE_FIRST;
  if (run.route && run.generatorVersion >= 4) scheduleRouteTrail(run);
  // Mark upcoming turns independently from obstacle rows so the renderer can
  // telegraph them early even when generation resumes after a route choice.
  for (const corner of cornersBetween(run.distance - 8, run.distance + 170)) {
    if (!run.objects.some((object) => object.turnIndex === corner.index)) {
      const marker = add(run, `corner-${corner.direction}`, 1, corner.at);
      marker.direction = corner.direction;
      marker.turnIndex = corner.index;
    }
    // Turn approaches intentionally stay hazard-free, but a completely empty
    // approach makes the next decision feel disconnected from the run. Give
    // version-four trails one short, center-lane reward line just before the
    // clear window. It ends before `corner.approach`, so it never competes with
    // the turn cue or changes the established collision reservation.
    if (run.generatorVersion >= 4 && Number.isFinite(run.nextRow) &&
        corner.approach > run.distance + 3 &&
        !run.objects.some((object) => object.turnReward === corner.index)) {
      const rewardAt = corner.approach - 12;
      for (let i = 0; i < 3; i++) {
        const reward = add(run, 'bone', 1, rewardAt + i * 3);
        reward.turnReward = corner.index;
        reward.encounter = 'Turn warm-up';
      }
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
    // River reservations belong to version 4; historical shared trails retain
    // their original generator, course sequencing and scenery-boundary rules.
    const river=run.raftPrototype&&raftIntersecting(run.nextRow,run.nextRow+19);
    if(river){
      const challenge=run.route?.kind==='challenge'&&river.start<run.route.until;
      for(const spec of raftEncounter(river,challenge))Object.assign(add(run,spec.type,spec.lane,spec.at),spec);
      run.nextRow=river.recovery+5;
      continue;
    }
    const minecart = run.minecartPrototype && Number.isFinite(run.nextMinecart)
      ? minecartByIndex(Math.round((run.nextMinecart - MINECART_FIRST) / MINECART_PERIOD))
      : null;
    // A restored/shared run can resume after a cart's recovery window. Advance
    // its scheduler rather than re-inserting an already-passed ride in front
    // of the next authored cable or course.
    if (minecart && run.nextRow > minecart.recovery) {
      run.nextMinecart = minecart.start + MINECART_PERIOD;
      continue;
    }
    if (minecart && run.nextRow >= minecart.approach) {
      add(run, 'minecart-start', 1, minecart.start);
      add(run, 'minecart-end', 1, minecart.end);
      const challenge = run.route?.kind === 'challenge' && minecart.start < run.route.until;
      for (const spec of minecartEncounter(minecart, challenge, run.minecartChoicePrototype))
        Object.assign(add(run, spec.type, spec.lane, spec.at), spec);
      run.nextRow = minecart.recovery + 5;
      run.nextMinecart = minecart.start + MINECART_PERIOD;
      continue;
    }
    const ski = run.skiPrototype && Number.isFinite(run.nextSki)
      ? skiByIndex(Math.round((run.nextSki - SKI_FIRST) / SKI_PERIOD))
      : null;
    if (ski && run.nextRow > ski.recovery) {
      run.nextSki = ski.start + SKI_PERIOD;
      continue;
    }
    if (ski && run.nextRow >= ski.approach) {
      const courseOverlap = run.course && run.course.end >= ski.approach &&
        run.course.start <= ski.recovery;
      const ziplineStart = Number.isFinite(run.nextZipline) ? run.nextZipline : Infinity;
      const ziplineOverlap = ziplineStart <= ski.recovery + 45 &&
        ziplineStart + ZIPLINE_LENGTH + 45 >= ski.approach;
      const choiceOverlap = Number.isFinite(run.nextChoice) &&
        run.nextChoice >= ski.approach - 45 && run.nextChoice <= ski.recovery + 45;
      const reserved = cornerIntersecting(ski.approach, ski.recovery) ||
        (run.raftPrototype && raftIntersecting(ski.approach, ski.recovery)) ||
        (run.minecartPrototype && minecartIntersecting(ski.approach, ski.recovery)) ||
        (run.movingGatePrototype && movingGateIntersecting(ski.approach, ski.recovery)) ||
        bridgeCollapseIntersecting(ski.approach, ski.recovery) ||
        courseOverlap || ziplineOverlap || choiceOverlap;
      if (!reserved) {
        const startMarker = add(run, 'ski-start', 1, ski.start);
        startMarker.skiSection = ski.index;
        startMarker.encounter = 'Frostpeak descent';
        const endMarker = add(run, 'ski-end', 1, ski.end);
        endMarker.skiSection = ski.index;
        endMarker.encounter = 'Frostpeak finish';
        const challenge = run.route?.kind === 'challenge' && ski.start < run.route.until;
        for (const spec of skiEncounter(ski, challenge))
          Object.assign(add(run, spec.type, spec.lane, spec.at), spec);
        run.skiUpcoming = ski;
        run.nextRow = ski.recovery + 5;
        run.nextSki = ski.start + SKI_PERIOD;
        run.row++;
        continue;
      }
      run.nextSki = ski.start + SKI_PERIOD;
      continue;
    }
    const movingGate = run.movingGatePrototype && Number.isFinite(run.nextMovingGate)
      ? movingGateByIndex(Math.round((run.nextMovingGate - MOVING_GATE_FIRST) / MOVING_GATE_PERIOD))
      : null;
    // Moving gates reserve their approach and recovery just like a ride. If a
    // course, corner or traversal beat already owns that space, skip this
    // gate and let the next deterministic one land in a clean chapter.
    if (movingGate && run.nextRow > movingGate.recovery) {
      run.nextMovingGate = movingGate.start + MOVING_GATE_PERIOD;
      continue;
    }
    if (movingGate && run.nextRow >= movingGate.approach) {
      const courseOverlap = run.course && run.course.end >= movingGate.approach &&
        run.course.start <= movingGate.recovery;
      // A cable owns its whole approach, aerial line and landing. Do not let
      // a moving gate be generated into that space; otherwise a gate could
      // sweep through a puppy that is safely hanging from the handle.
      const ziplineStart = Number.isFinite(run.nextZipline) ? run.nextZipline : Infinity;
      const ziplineOverlap = ziplineStart <= movingGate.recovery + 45 &&
        ziplineStart + ZIPLINE_LENGTH + 45 >= movingGate.approach;
      const reserved = cornerIntersecting(movingGate.approach, movingGate.recovery) ||
        (run.raftPrototype && raftIntersecting(movingGate.approach, movingGate.recovery)) ||
        (run.minecartPrototype && minecartIntersecting(movingGate.approach, movingGate.recovery)) ||
        courseOverlap || ziplineOverlap;
      if (!reserved) {
        const challenge = run.route?.kind === 'challenge' && movingGate.start < run.route.until;
        for (const spec of movingGateEncounter(movingGate, challenge))
          Object.assign(add(run, spec.type, spec.lane, spec.at), spec);
        run.nextRow = movingGate.recovery + 5;
        run.nextMovingGate = movingGate.start + MOVING_GATE_PERIOD;
        continue;
      }
      run.nextMovingGate = movingGate.start + MOVING_GATE_PERIOD;
      continue;
    }
    const bridgeCollapse = run.generatorVersion >= 4 && Number.isFinite(run.nextBridgeCollapse)
      ? bridgeCollapseByIndex(Math.round((run.nextBridgeCollapse - BRIDGE_COLLAPSE_FIRST) / BRIDGE_COLLAPSE_PERIOD))
      : null;
    // The bridge beat occupies one paving tile, but its visual collapse starts
    // before the gap and settles after it. Keep the complete window free of
    // turns, rides, courses, forks and ziplines so the required jump is never
    // hidden behind another authored action.
    if (bridgeCollapse && bridgeCollapse.at < run.distance - 1e-6) {
      run.nextBridgeCollapse = bridgeCollapse.at + BRIDGE_COLLAPSE_PERIOD;
      continue;
    }
    if (bridgeCollapse && run.nextRow >= bridgeCollapse.approach) {
      const courseOverlap = run.course && run.course.end >= bridgeCollapse.approach &&
        run.course.start <= bridgeCollapse.recovery;
      const ziplineStart = Number.isFinite(run.nextZipline) ? run.nextZipline : Infinity;
      const ziplineOverlap = ziplineStart <= bridgeCollapse.recovery + 45 &&
        ziplineStart + ZIPLINE_LENGTH + 45 >= bridgeCollapse.approach;
      const choiceOverlap = Number.isFinite(run.nextChoice) &&
        run.nextChoice >= bridgeCollapse.approach - 45 &&
        run.nextChoice <= bridgeCollapse.recovery + 45;
      const reserved = cornerIntersecting(bridgeCollapse.approach, bridgeCollapse.recovery) ||
        (run.raftPrototype && raftIntersecting(bridgeCollapse.approach, bridgeCollapse.recovery)) ||
        (run.minecartPrototype && minecartIntersecting(bridgeCollapse.approach, bridgeCollapse.recovery)) ||
        (run.movingGatePrototype && movingGateIntersecting(bridgeCollapse.approach, bridgeCollapse.recovery)) ||
        courseOverlap || ziplineOverlap || choiceOverlap;
      if (!reserved) {
        for (const lane of [0, 1, 2]) {
          const gap = add(run, 'gap', lane, bridgeCollapse.at);
          gap.bridgeCollapse = true;
          gap.bridgeIndex = bridgeCollapse.index;
          gap.bridgeStart = bridgeCollapse.bridgeStart;
          gap.bridgeEnd = bridgeCollapse.bridgeEnd;
          gap.encounter = 'Collapsing bridge';
        }
        run.nextRow = bridgeCollapse.recovery + 5;
        run.nextBridgeCollapse = bridgeCollapse.at + BRIDGE_COLLAPSE_PERIOD;
        run.row++;
        continue;
      }
      // A ride or fork owns this bridge's traversal window. Leave the bridge
      // intact and advance to the next alternating bridge rather than creating
      // a decorative collapse without a matching jump gap.
      run.nextBridgeCollapse = bridgeCollapse.at + BRIDGE_COLLAPSE_PERIOD;
      continue;
    }
    const dogChase = dogChaseByNext(run);
    // The companion owns a short, clean reward window. It is deliberately
    // checked after bridges and before the next ride so a spectacular action
    // always wins when two authored schedules land close together.
    if (dogChase && dogChase.start < run.distance - 1e-6) {
      run.nextDogChase = dogChase.start + DOG_CHASE_PERIOD;
      continue;
    }
    if (dogChase && run.nextRow >= dogChase.approach) {
      if (scheduleDogChase(run, dogChase)) continue;
      // A corner, ride, bridge, course or fork owns this space. Advance to the
      // next deterministic chase instead of inserting a companion into a
      // busy action window.
      run.nextDogChase = dogChase.start + DOG_CHASE_PERIOD;
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
    if (start >= 195 && !run.course && visit !== run.lastCourseVisit && (route !== "scenic" || run.generatorVersion>=3) &&
        sequenceEnd < Math.min(
          run.nextChoice,
          run.nextZipline,
          Number.isFinite(run.nextMinecart) ? run.nextMinecart : Infinity,
          Number.isFinite(run.nextSki) ? run.nextSki : Infinity,
          Number.isFinite(run.nextMovingGate) ? run.nextMovingGate : Infinity,
        ) - 45 &&
        // A landscape transition is not a gameplay hazard. Prototype courses
        // may finish across it; actual encounter reservations still take priority.
        (run.raftPrototype || sequenceEnd <= (visit+1)*REGION_LENGTH) &&
        !cornerIntersecting(start, sequenceEnd) &&
        (!run.raftPrototype||!raftIntersecting(start,sequenceEnd)) &&
        (!run.minecartPrototype||!minecartIntersecting(start,sequenceEnd)) &&
        (!run.movingGatePrototype||!movingGateIntersecting(start,sequenceEnd)) &&
        (!run.route || start >= run.route.until || sequenceEnd - COURSE_RECOVERY <= run.route.until)) {
      const region=regionAt(start);
      const ordinal=run.raftPrototype?(run.courseOrdinals?.[region]??0):null;
      run.course = courseAt(start,run.generatorVersion,route==='scenic',ordinal);
      if(run.raftPrototype&&!run.course.scenic){
        run.courseOrdinals??=[0,0,0];run.courseOrdinals[region]++;
      }
      run.lastCourseVisit = visit;
      for (const beat of run.course.beats) {
        for (let lane = 0; lane < 3; lane++)
          if (run.course.scenic ? lane===beat.blockedLane : lane !== beat.safeLane) {
            const obstacle=add(run, beat.type, lane, beat.at);
            if(!run.course.scenic) {
              obstacle.courseRegion=run.course.region;
              // Version four can carry the authored destination lane so the
              // visual strip and restored runs can explain a weave directly.
              // Keep versions 1–3 byte-for-byte compatible: their object
              // streams are part of the shared-trail contract.
              if (run.generatorVersion >= 4) obstacle.safeLane=beat.safeLane;
            } else if (run.generatorVersion >= 4) {
              obstacle.blockedLane=beat.blockedLane;
            }
          }
        for (let i = 1; i <= 3; i++) add(run, "bone", beat.safeLane ?? 1, beat.at + i * 4);
      }
      add(run, "gift", 1, start + 88);
      if(run.generatorVersion>=4){
        const finalBeat=run.course.beats.at(-1);
        const relic=add(run,'relic',finalBeat?.safeLane??1,start+COURSE_LENGTH-8);
        relic.relicArea=areaAt(relic.at);
      }
      run.nextRow = sequenceEnd;
      run.row++;
      continue;
    }
    const phase = run.encounterPacing ? encounterPhaseAt(run.nextRow) : null;
    // Warm-up and recovery are deliberately quiet. Authored rides, courses,
    // turns and route challenges above still own their windows; this only
    // prevents ordinary rows from stacking hazards into a breathing beat.
    const openingRunway = run.encounterPacing && run.distance < 120 &&
      run.row < OPENING_RUNWAY_ROWS;
    const quietPhase = run.encounterPacing &&
      ((phase === 'warmup' && route !== 'challenge') ||
       (phase === 'recovery' && route !== 'challenge') ||
       openingRunway);
    // Scenic detours are the low-pressure choice, so keep their optional
    // route free of surprise full-width gaps (the route record remains around
    // briefly after rejoining). Challenge and uncommitted current trails keep
    // the familiar gap rhythm; authored collapsing bridges add the spectacle
    // version on top. Historical generators remain byte-for-byte unchanged.
    const scenicDetour = run.encounterPacing && run.route?.kind === 'scenic';
    const gapRow = !quietPhase && !scenicDetour && run.row > 5 && run.row % 12 === 10;
    const at = gapRow ? Math.round(run.nextRow/5)*5 : run.nextRow;
    const pattern = run.generatorVersion >= 4 ? areaPattern(at, run.row) : null;
    // Later rows force a lane decision instead of rewarding camping in one lane.
    let safe;
    if(run.generatorVersion>=4) {
      if (quietPhase) safe = run.lane;
      else if(run.row>5&&route!=="scenic") {
        const profile=areaGameplayAt(at);
        const preferred=profile.safeLanes[(run.row+Math.floor(at/AREA_LENGTH)+(pattern?.safeShift||0))%profile.safeLanes.length];
        const fallback=(run.lastSafeLane+1+Math.floor(run.random()*2))%3;
        safe=preferred!==run.lastSafeLane&&run.random()<.68?preferred:fallback;
      } else safe=Math.floor(run.random()*3);
    } else safe = run.row > 5 && route !== "scenic"
      ? (run.lastSafeLane + 1 + Math.floor(run.random() * 2)) % 3
      : Math.floor(run.random() * 3);
    run.lastSafeLane = safe;
    const blocked = (safe + 1 + Math.floor(run.random() * 2)) % 3;
    const actionRow = !quietPhase && route!=="scenic" && run.row > 5 && (route==="challenge" ? run.row%2===0 : run.row % 4 === 2);
    // Shelter beats are short character encounters, not a new ruleset: each
    // occupies one lane, clears by its own familiar move, and arrives with a
    // second ordinary hazard so the open lane remains legible. The live pacing
    // guard keeps historical/replay generators unchanged while giving current
    // runs a memorable human-scale beat after the warm-up. Beats cycle through
    // a staged cast (see shelterCast) so the trail is not just a long sequence
    // of rocks with a single shelter cameo.
    const shelterBeat = run.encounterPacing && run.generatorVersion >= 5 &&
      route !== 'scenic' && !actionRow && !quietPhase && !gapRow && at >= 135 && run.row % 7 === 4;
    const shelterType = shelterBeat ? shelterCast(run) : null;
    if (actionRow) {
      const type = gapRow ? "gap" : run.generatorVersion>=4
        ? areaActionHazard(run,at,run.row)
        : (route==="challenge" ? Math.floor(run.row/2)%2===0 : run.row % 8 === 2) ? "log" : "gate";
      const split = at > 800 && !gapRow && run.row % 8 === 6;
      for (let lane = 0; lane < 3; lane++) {
        const obstacle=add(run, split ? lane === safe ? 'gate' : 'log' : type, lane, at);
        if(split) obstacle.splitChoice=true;
        if (pattern?.label) obstacle.encounter = pattern.label;
      }
    } else if (run.row > 0 && !quietPhase) {
      const primary=shelterBeat ? shelterType : run.generatorVersion>=4
        ? areaHazard(run,at,run.row)
        : SOLID_HAZARDS[Math.floor(run.random() * SOLID_HAZARDS.length)];
      const first=add(run, primary, blocked, at);
      if (run.generatorVersion >= 4) first.safeLane = safe;
      if (pattern?.label) first.encounter = pattern.label;
      if (shelterBeat) {
        first.shelterWorker = true;
        first.encounter = 'Shelter crossing';
        run.shelterBeats = (Number.isInteger(run.shelterBeats) ? run.shelterBeats : 0) + 1;
      }
      if (route!=="scenic" && run.row > 2 && (shelterBeat || run.random() > 0.15 || at > 600)) {
        const second=add(run,
          run.generatorVersion>=4 ? areaHazard(run,at,run.row+1)
            : SOLID_HAZARDS[Math.floor(run.random() * SOLID_HAZARDS.length)],
          3-safe-blocked,at);
          if (run.generatorVersion >= 4) second.safeLane = safe;
        if (shelterBeat) second.shelterSupport = true;
        if (pattern?.label) second.encounter = pattern.label;
      }
    }
    const offsets = quietPhase ? [0] : (pattern?.boneOffsets || [0]);
    const boneLane = quietPhase || run.row < 3 || run.random() < 0.4 ? safe : blocked;
    for (let i = 0; i < 4; i++) {
      const laneOffset = pattern && run.row >= 3 ? offsets[i % offsets.length] : 0;
      const lane = pattern && run.row >= 3 ? (safe + laneOffset) % 3 : boneLane;
      const bone = add(run, "bone", lane, at + i * 3);
      if (pattern?.label) bone.encounter = pattern.label;
      if (phase === 'warmup') bone.encounter = 'Warm-up line';
      if (phase === 'recovery') {
        bone.encounter = 'Recovery line';
        bone.recovery = true;
      }
      if (pattern && laneOffset !== 0) bone.weave = true;
    }
    if (run.row > 0 && run.row % 3 === 0) {
      const profile = areaGameplayAt(at);
      const cyclic = ["gem", "magnet", "double", "zoomies", "shield", "heart"];
      // Clustered beats deliberately repeat a recognizable effect family so
      // the item card and the nearby bone line reinforce one another. Other
      // rows keep the full six-item rotation for long-run variety.
      const clustered = pattern?.cluster
        ? ['magnet', 'double', 'zoomies'][(run.row / 3 + Math.floor(at / AREA_LENGTH)) % 3]
        : null;
      const pickupType = clustered || cyclic[(run.row / 3 - 1 + (run.generatorVersion>=4?profile.pickupOffset:0)) % cyclic.length];
      const pickupAt = at + 15;
      const pickup = add(run, pickupType, safe, pickupAt);
      if (pattern?.label) pickup.encounter = pattern.label;
      if (phase === 'warmup') pickup.encounter = 'Warm-up reward';
      if (phase === 'recovery') {
        pickup.encounter = 'Recovery reward';
        pickup.recovery = true;
      }
      if (pattern?.cluster && !quietPhase) {
        // Four short bones frame the special item as a deliberate reward line,
        // making its purpose readable before the player reaches the pickup.
        for (const [index, offset] of [8, 11, 19, 22].entries()) {
          const lane = (safe + (index > 1 ? 0 : (pattern.boneOffsets?.[index] || 0))) % 3;
          const bone = add(run, 'bone', lane, at + offset);
          bone.rewardLine = true;
          bone.encounter = pattern.label;
        }
      }
    }
    // Give a first-time runner one low-pressure, explained powerup before the
    // opening turn. It shares the starter bone lane, has no hazard beside it,
    // and lets the contextual guide teach the magnet while there is still
    // plenty of road to react.
    if (run.generatorVersion >= 4 && run.row === 1) {
      const tutorialPickup = add(run, 'magnet', safe, at + 15);
      tutorialPickup.tutorial = true;
      tutorialPickup.encounter = pattern?.label || 'First fetch';
    }
    run.row++;
    if (run.row % 9 === 0) add(run,'gift',safe,at+19);
    // Keep full-width actions far enough apart for an unupgraded jump to land.
    // Lane rows tighten gradually; Scenic remains the gentler alternative.
    const pressure = route === "scenic" ? 0 : Math.min(1, at / 1200);
    // Keep the seeded meter cadence stable in the quiet beats; the pacing
    // change is the removal of ordinary hazards, not a hidden speed-up of the
    // authored row clock. This preserves reaction margins for long replays.
    const phaseGap = quietPhase ? 26 - pressure * 4 : null;
    run.nextRow += (phaseGap ?? (actionRow ? 42 : 26 - pressure * 4)) + run.random() * 6;
  }
}
export function act(run, action) {
  if (run.ended) return;
  run.inputCount = (run.inputCount || 0) + 1;
  if (action === 'fetch') { activateFetch(run); return; }
  if (action === "left" && !applyTurnInput(run, action)) run.lane = Math.max(0, run.lane - 1);
  if (action === "right" && !applyTurnInput(run, action)) run.lane = Math.min(2, run.lane + 1);
  if (run.zipline || run.raft || run.minecart) return;
  if (run.ski) {
    if (action === "jump") {
      if ((run.skiHop || 0) <= 0) {
        run.skiHop = SKI_HOP_DURATION;
        run.events.push('ski-jump');
      }
    }
    // Skiing is a crouched carving posture. Sliding is intentionally ignored
    // here so a stray downward swipe cannot cancel a hop or create an
    // ambiguous second action on a small touchscreen.
    return;
  }
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
  const impactType=run.shield ? 'shield-break' : 'hit';
  if (run.shield) {
    run.shield = 0;
    run.events.push("shield-break");
  } else {
    run.hearts--;
    run.events.push("hit");
  }
  run.combo = 0;
  run.effects.push({type:impactType,time:run.time,x:run.x,y:run.y+.75});
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
  const eventStart = run.events.length;
  run.fetchTime = Math.max(0, run.fetchTime - dt);
  syncUnvisitedCorners(run);
  run.previous = { x: run.x, y: run.y, distance: run.distance };
  run.time += dt;
  const wasZooming = run.zoomies > 0;
  run.zoomies = Math.max(0, run.zoomies - dt);
  // Ease in and out; expiry cannot leave the puppy unprotected inside a row.
  // Focused drills build toward adventure pace only after successful moves.
  // Other lessons stay gentle; mistakes never trigger another speed increase.
  const practiceSpeed=run.practice&&(run.practice.kind==='jump'||run.practice.kind==='slide')
    ? 12+5*Math.min(2,run.practice.correct) : 12;
  const baseSpeed = run.practice ? practiceSpeed : Math.min(36, 22 + run.distance / 90);
  const targetSpeed = baseSpeed * (run.ski ? 1.18 : 1) * (run.zoomies > 0 ? 1.3 : 1);
  run.speed += (targetSpeed - run.speed) * (1 - Math.exp(-6 * dt));
  if (wasZooming && run.zoomies === 0) {
    run.invulnerable = Math.max(run.invulnerable, 1.2);
    run.events.push("zoomies-end");
  }
  run.distance += run.speed * dt;
  const currentArea = areaAt(run.distance);
  if (currentArea !== run.lastArea) {
    run.lastArea = currentArea;
    run.events.push('area-enter');
  }
  // Start/end the friendly chase on the same fixed simulation clock as rides.
  // The renderer can therefore animate a companion without maintaining a
  // second timer, and a restored run cannot award the completion bonus twice.
  if (run.dogChaseUpcoming && !run.dogChase &&
      run.previous.distance < run.dogChaseUpcoming.start &&
      run.distance >= run.dogChaseUpcoming.start) {
    run.dogChase = {...run.dogChaseUpcoming, startedAt: run.time};
    run.events.push('dog-chase-start');
  }
  if (run.dogChase && run.distance >= run.dogChase.end) {
    const completed = run.previous.distance < run.dogChase.end;
    const chase = run.dogChase;
    run.dogChase = null;
    run.dogChaseUpcoming = null;
    if (completed) {
      run.dogChases = (run.dogChases || 0) + 1;
      run.bonusPoints += DOG_CHASE_REWARD;
      run.invulnerable = Math.max(run.invulnerable, .8);
      run.events.push('dog-chase-end');
      run.lastDogChase = chase.index;
    }
  }
  // A bridge announces itself once as the runner reaches the first falling
  // planks. The notice is tied to a real generated gap, so a skipped bridge or
  // a legacy trail never produces a phantom spectacle cue.
  for (const object of run.objects) {
    if (!object.bridgeCollapse || object.lane !== 1 || object.bridgeWarned) continue;
    const warningAt = object.at - 28;
    if (run.previous.distance < warningAt && run.distance >= warningAt) {
      object.bridgeWarned = true;
      run.events.push('bridge-collapse');
    }
  }
  // Zoomies can smash or vault physical hazards, but steering through a corner
  // remains a player decision.
  resolveCorner(run, run.previous.distance, run.distance);
  if (run.ended) {
    run.score = Math.floor(run.distance) + run.bonePoints + run.bonusPoints;
    return;
  }
  if(run.zoomies>0 && run.y===0 && run.objects.some(object=>object.type==="gap" && object.at-run.distance>0 && object.at-run.distance<run.speed*.45)) act(run,"jump");
  if(run.raftPrototype)advanceRaft(run,run.previous.distance,run.distance);
  if(run.minecartPrototype)advanceMinecart(run,run.previous.distance,run.distance);
  if(run.skiPrototype)advanceSki(run,run.previous.distance,run.distance);
  if(!moveRaft(run,LANES[run.lane],dt) && !moveMinecart(run,LANES[run.lane],dt) &&
     !moveSki(run,LANES[run.lane],dt))
    steer(run, LANES[run.lane], dt);
  if(run.choicePending!==null && run.distance>=run.choicePending) {
    const kind=run.x>1.2?"challenge":"scenic";
    // Branch metadata and optional reward trails are version-four additions.
    // Keep older shared-trail route objects as small as they were when those
    // links were authored.
    run.route = run.generatorVersion >= 4
      ? routeBranchFor(kind, run.choicePending, run.choicePending + 220)
      : {kind, until: run.choicePending + 220};
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
  } else if (run.ski) {
    run.skiHop = Math.max(0, (run.skiHop || 0) - dt);
    run.y = skiHopHeight(run);
    run.vy = 0;
    run.diving = false;
    run.slide = 0;
    run.slideNext = 0;
    run.jumpBuffer = 0;
  } else if(!run.raft && !run.minecart) {
    moveVertical(run, dt);
  }
  run.invulnerable = Math.max(0, run.invulnerable - dt);
  run.magnet = Math.max(0, run.magnet - dt);
  run.double = Math.max(0, run.double - dt);
  run.effects = run.effects.filter((effect) => run.time - effect.time < 0.45);
  for (const object of run.objects) {
    if (object.used) continue;
    const dz = object.at - run.distance;
    const objectX = object.movingGate
      ? movingGateX(object, run.distance)
      : object.skiObstacle ? skiObjectX(object, run.distance) : LANES[object.lane];
    // Most hazards occupy one lane. Crossing Frostpeak yetis are wider than a
    // lane at the midpoint of their patrol, so their authored envelope is
    // carried with the object instead of leaving a visual-only dodge. The
    // fallback width comes from the hazard cast so the contract stays in one
    // place; per-object overrides (yeti patrol) still win.
    const collisionWidth = Number.isFinite(object.skiCollisionWidth)
      ? object.skiCollisionWidth
      : (HAZARD_CAST[object.type]?.width ?? 0.95);
    const sameLane = Math.abs(objectX - run.x) < collisionWidth;
    if (object.type === "zipline-start" && !object.caught && Math.abs(dz) < 3 && run.y > .65 && !run.zipline) {
      object.caught = true;
      run.zipline = {start: object.at, end: object.at + ZIPLINE_LENGTH};
      run.slide = 0;
      run.slideNext = 0;
      run.jumpBuffer = 0;
      run.events.push("zipline-start");
    }
    // Airborne treats belong to the cable route, not to runners underneath it.
    const reachable = !object.airborne || Boolean(run.zipline) ||
      Boolean(object.skiAirborne && run.ski && run.y > .45);
    if (object.type === "bone") {
      if (!object.pull && reachable && run.magnet > 0 && dz > -3 && dz < 16) {
        object.pull = {
          elapsed: 0,
          duration: 0.24,
          fromX: LANES[object.lane],
          fromAt: object.at,
          fromY: object.airborne ? (object.skiAirborne ? run.y + 1.05 : ZIPLINE_HEIGHT + 1.1) : 1.1,
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
        if (object.minecartChoice === 'bone') run.minecartBoneChoices++;
        const boneValue = (25 + run.upgrades.value * 5) * (run.double > 0 ? 2 : 1);
        run.bonePoints += boneValue;
        if (object.routeTrail) {
          run.routeTrailBones = (run.routeTrailBones || 0) + 1;
          run.routeTrailPoints = (run.routeTrailPoints || 0) + boneValue;
        }
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
      if (run.pickupCounts && Object.hasOwn(run.pickupCounts, object.type))
        run.pickupCounts[object.type]++;
      let pickupResult = null;
      if (object.type === "magnet") run.magnet = 10 + run.upgrades.magnet * 3;
      const bonusesBeforePickup=run.bonusPoints;
      if (object.type === "shield") {
        if (run.shield) {
          run.bonusPoints += 100;
          run.events.push('spare-shield');
          pickupResult = 'Already protected · +100 points';
        } else {
          run.shield = 1;
          pickupResult = 'Blocks one hit';
        }
      }
      if (object.type === "gem") {
        run.bonusPoints += 250;
        if (object.minecartChoice === 'gem') run.minecartGemChoices++;
        pickupResult = object.minecartChoice === 'gem' ? 'Gem shortcut · +250 points' : '+250 points';
      }
      if (object.type === "double") {
        run.double = 10;
        pickupResult = '2× bone points · 10s';
      }
      if (object.type === "zoomies") {
        run.zoomies = 6;
        pickupResult = 'Speed + smash · 6s';
      }
      if (object.type === "heart") {
        if (run.hearts < 3) {
          run.hearts++;
          pickupResult = 'Restored 1 heart';
        } else {
          run.bonusPoints += 100;
          run.events.push('full-heart');
          pickupResult = 'Full hearts · +100 points';
        }
      }
      if (object.type === 'magnet') {
        pickupResult = `Pulls nearby bones · ${Math.ceil(run.magnet)}s`;
      }
      if (object.type === 'gift') {
        run.gifts++;
        run.bonusPoints+=100;
        pickupResult = '+100 points';
      }
      if (object.type === 'relic') {
        const area=Number.isInteger(object.relicArea)?object.relicArea:areaAt(object.at);
        run.relics++;
        run.relicPoints+=AREA_RELIC_REWARD;
        run.bonusPoints+=AREA_RELIC_REWARD;
        run.relicsByArea??=Array(6).fill(0);
        run.relicsByArea[area]=(run.relicsByArea[area]||0)+1;
        pickupResult = '+160 points · area complete';
      }
      run.pickupBonusPoints+=run.bonusPoints-bonusesBeforePickup;
      run.lastPickup = {type: object.type, time: run.time, result: pickupResult};
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
      if (object.bridgeCollapse && object.lane === 1 && !object.counted) {
        object.counted = true;
        run.bridgeCollapses = (run.bridgeCollapses || 0) + 1;
      }
      if (object.movingGate && !object.counted) {
        // Count the authored timing beat once it reaches the collision plane,
        // whether it was cleared, dodged, or absorbed by a shield. This keeps
        // results and weekly ride/encounter summaries honest without letting a
        // pooled object increment the stat on later frames.
        object.counted = true;
        run.movingGates = (run.movingGates || 0) + 1;
      }
      if (object.skiObstacle && !object.counted) {
        // Count a snow set piece once it reaches the collision plane. The
        // dodge/clear stats below describe the player's response; this count
        // keeps results useful even when a player takes the hit.
        object.counted = true;
        if (object.type === 'yeti') run.skiYetiEncounters = (run.skiYetiEncounters || 0) + 1;
        if (object.type === 'snowball') run.skiSnowballEncounters = (run.skiSnowballEncounters || 0) + 1;
        if (object.type === 'snowman') run.skiSnowmanEncounters = (run.skiSnowmanEncounters || 0) + 1;
      }
      if (sameLane && run.zoomies > 0 && object.type !== "gap") {
        object.used = true;
        run.smashes++;
        run.bonusPoints += 40;
        run.events.push("smash");
        run.effects.push({id:object.id,type:"smash",time:run.time,x:run.x,y:1});
        continue;
      }
      // Low trail hazards clear by out-jumping their cast height. Gap and ski
      // obstacles keep their own flags below; the slide family derives from
      // the cast so a new duck can never miss the branch.
      const jumpClearHeight = ['log', 'rock', 'pound-worker', 'crate-cart'].includes(object.type)
        ? HAZARD_CAST[object.type].jumpHeight : null;
      const cleared =
        (object.type === "gap" && (run.y > HAZARD_CAST.gap.jumpHeight || run.zoomies > 0)) ||
        (Number.isFinite(jumpClearHeight) && run.y > jumpClearHeight) ||
        (object.skiHazard && object.type === 'mogul' && run.y > HAZARD_CAST.mogul.jumpHeight) ||
        (object.skiObstacle && object.skiJumpable && run.y > HAZARD_CAST.snowball.jumpHeight) ||
        (HAZARD_CAST[object.type]?.clear === 'slide' &&
          run.slide > 0 &&
          run.y < 0.2);
      if (sameLane && cleared) {
        run.clears++;
        if (object.skiHazard && object.type === 'mogul') {
          run.skiJumps = (run.skiJumps || 0) + 1;
          run.events.push('ski-mogul-clear');
        }
        if (object.skiObstacle && object.type === 'snowball') {
          run.skiSnowballClears = (run.skiSnowballClears || 0) + 1;
          run.skiObstaclePoints = (run.skiObstaclePoints || 0) + (object.skillReward || 90);
          run.events.push('ski-snowball-clear');
        }
        if (run.zoomies === 0) { chargeFetch(run, 12); cleanMove(run); }
        run.bonusPoints += (object.skillReward || 20);
        run.events.push("clear");
      }
      // A dodge is only a near miss when the puppy was still inside the
      // hazard's lane envelope on the previous fixed step, then crossed out
      // of it before the collision plane. Ordinary scenery in another lane
      // never qualifies, and the passed flag keeps the reward one-shot.
      const previousX = Number.isFinite(run.previous?.x) ? run.previous.x : run.x;
      const previousObjectX = object.movingGate
        ? movingGateX(object, run.previous?.distance)
        : object.skiObstacle ? skiObjectX(object, run.previous?.distance) : LANES[object.lane];
      const previousNear = Math.abs(previousObjectX - previousX) < 1.75;
      const dodgedAtTheLine = !sameLane && previousNear;
      if (dodgedAtTheLine) {
        run.nearMisses++;
        run.nearMissPoints += NEAR_MISS_REWARD;
        run.bonusPoints += NEAR_MISS_REWARD;
        run.events.push('near-miss');
        run.effects.push({id:object.id,type:'near-miss',time:run.time,x:run.x,y:run.y+.72});
      }
      if (!sameLane && (object.skiHazard || object.skiObstacle) && dodgedAtTheLine) {
        run.skiDodges = (run.skiDodges || 0) + 1;
        if (object.type === 'ice') run.events.push('ski-ice-dodge');
        if (object.type === 'yeti') {
          run.skiYetiDodges = (run.skiYetiDodges || 0) + 1;
          run.bonusPoints += (object.skillReward || 80);
          run.skiObstaclePoints = (run.skiObstaclePoints || 0) + (object.skillReward || 80);
          cleanMove(run);
          run.events.push('ski-yeti-dodge');
        }
        if (object.type === 'snowball') {
          run.skiSnowballDodges = (run.skiSnowballDodges || 0) + 1;
          run.bonusPoints += (object.skillReward || 90);
          run.skiObstaclePoints = (run.skiObstaclePoints || 0) + (object.skillReward || 90);
          cleanMove(run);
          run.events.push('ski-snowball-dodge');
        }
        if (object.type === 'snowman') {
          run.skiSnowmenDodged = (run.skiSnowmenDodged || 0) + 1;
          run.bonusPoints += (object.skillReward || 72);
          run.skiObstaclePoints = (run.skiObstaclePoints || 0) + (object.skillReward || 72);
          cleanMove(run);
          run.events.push('ski-snowman-dodge');
        }
      }
      if (sameLane && !cleared && run.invulnerable === 0) {
        object.used = true;
        harm(run, (object.skiHazard || object.skiObstacle) ? {type:object.type,skiHazard:true,skiObstacle:Boolean(object.skiObstacle),skiSafeLane:object.skiSafeLane} : object.raftHazard ? {type:'rock',raftHazard:true,safeLane:object.raftSafeLane} : object.minecartHazard ? {type:'rock',minecartHazard:true,safeLane:object.minecartSafeLane} : object.type==='rock' && [0,1,2].includes(object.courseRegion)
          ? {type:'rock',courseWeave:true,safeLane:run.course?.beats.find(beat=>beat.at===object.at)?.safeLane} : object.bridgeCollapse
            ? {type:'gap',bridgeCollapse:true} : {type: object.type});
        if (run.ended) break;
      }
    }
  }
  run.objects = run.objects.filter(
    (object) => object.at > run.distance - 8 || (object.pull && !object.used),
  );
  if (!run.ended) {
    const weaves=advanceCourse(run, LANES);
    for(let i=0;i<weaves;i++) {
      run.weaves++;
      chargeFetch(run,12);
      cleanMove(run);
      run.events.push('weave');
    }
  }
  run.score = Math.floor(run.distance) + run.bonePoints + run.bonusPoints;
  const newEvents = run.events.slice(eventStart);
  if (newEvents.some(event => [
    'zipline-end', 'raft-end', 'minecart-end', 'course-complete',
    'course-recovery', 'route-scenic', 'route-challenge', 'turn-left', 'turn-right',
    'dog-chase-end', 'ski-end',
  ].includes(event))) {
    run.encounterRecoveryUntil = recoveryUntilFor(run, run.distance);
  }
  fillTrack(run);
  // Refresh after generation so a newly reserved course, fork or ride can be
  // named on the very next HUD tick instead of waiting for another step.
  run.encounter = encounterFor(run);
}
