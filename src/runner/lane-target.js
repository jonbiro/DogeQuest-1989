import {movingGateSafeLane} from './moving-gate.js';

// The lane strip is a visual affordance, not a second steering system. It
// answers one small question at a time: which lane is worth aiming for next?
// Keeping the forecast pure means the renderer can draw it without mutating a
// restored run or changing seeded collision timing.
const HAZARDS = new Set([
  'rock', 'log', 'arch', 'branch', 'gate', 'moving-gate', 'gap',
  'mogul', 'ice', 'ski-gate', 'yeti', 'snowball', 'snowman',
]);
const OVERHEAD = new Set(['arch', 'branch', 'gate', 'moving-gate']);
const PICKUPS = new Set(['bone', 'magnet', 'shield', 'gem', 'double', 'heart', 'gift', 'zoomies', 'relic']);
const LANE_COUNT = 3;

function laneIndex(value) {
  if (!Number.isFinite(value)) return null;
  const lane = Math.round(value);
  return lane >= 0 && lane < LANE_COUNT ? lane : null;
}

function aheadBy(object, distance) {
  return Number.isFinite(object?.at) && Number.isFinite(distance)
    ? object.at - distance
    : Infinity;
}

function openLaneForBlocked(blocked, current) {
  const choices = [current, current - 1, current + 1, 0, 2, 1]
    .filter((lane, index, all) => lane >= 0 && lane < LANE_COUNT && all.indexOf(lane) === index);
  return choices.find(lane => !blocked.has(lane)) ?? null;
}

function explicitSafeLane(object, run, current) {
  if (object?.movingGate) return movingGateSafeLane(object, object.at, current);
  for (const key of ['raftSafeLane', 'minecartSafeLane', 'skiSafeLane', 'safeLane']) {
    const lane = laneIndex(object?.[key]);
    if (lane !== null) return lane;
  }
  const blockedLane = laneIndex(object?.blockedLane);
  if (blockedLane !== null) return openLaneForBlocked(new Set([blockedLane]), current);
  // Very old restored course objects only carried their region. Recover the
  // authored safe lane from the matching beat when available.
  const beat = run?.course?.beats?.find(candidate => candidate?.at === object?.at);
  const beatLane = laneIndex(beat?.safeLane);
  if (beatLane !== null) return beatLane;
  if (laneIndex(beat?.blockedLane) !== null)
    return openLaneForBlocked(new Set([laneIndex(beat.blockedLane)]), current);
  return null;
}

function hazardForecast(run, current, lookahead) {
  const objects = Array.isArray(run?.objects) ? run.objects : [];
  const hazards = objects
    .filter(object => HAZARDS.has(object?.type) && !object.used && !object.passed)
    .map(object => ({object, distance: aheadBy(object, run.distance)}))
    .filter(entry => entry.distance > 2 && entry.distance <= lookahead)
    .sort((a, b) => a.distance - b.distance);
  if (!hazards.length) return null;

  // Course, raft, cart and moving-gate encounters carry an authored safe
  // lane. Prefer their first actionable beat over a later ordinary row.
  for (const entry of hazards) {
    const target = explicitSafeLane(entry.object, run, current);
    if (target !== null) {
      const type = entry.object.raftHazard ? 'raft'
        : entry.object.minecartHazard ? 'cart'
          : entry.object.skiHazard || entry.object.skiObstacle ? 'ski'
          : entry.object.movingGate ? 'gate'
            : entry.object.courseRegion !== undefined ? 'course' : 'hazard';
      return {
        target,
        source: type,
        distance: Math.ceil(entry.distance),
        urgency: Math.max(0, Math.min(1, 1 - entry.distance / lookahead)),
        overhead: OVERHEAD.has(entry.object.type),
      };
    }
  }

  // Compatibility fallback for pre-v4 saves and hand-authored fixtures. If a
  // row has one or two lane hazards, reveal the nearest open lane; full-width
  // action rows intentionally return no target because jump/slide owns them.
  const first = hazards[0];
  const row = hazards.filter(entry => Math.abs(entry.object.at - first.object.at) < 1.5);
  const blocked = new Set(row.map(entry => laneIndex(entry.object.lane)).filter(lane => lane !== null));
  const target = openLaneForBlocked(blocked, current);
  if (target === null || blocked.size === 0) return null;
  return {
    target,
    source: 'hazard',
    distance: Math.ceil(first.distance),
    urgency: Math.max(0, Math.min(1, 1 - first.distance / lookahead)),
    overhead: false,
  };
}

function pickupForecast(run, current, lookahead) {
  const objects = Array.isArray(run?.objects) ? run.objects : [];
  const hazards = objects.filter(object => HAZARDS.has(object?.type) && !object.used && !object.passed);
  const pickups = objects
    .filter(object => PICKUPS.has(object?.type) && !object.used && !object.passed)
    .map(object => ({object, distance: aheadBy(object, run.distance)}))
    .filter(entry => entry.distance > 4 && entry.distance <= lookahead)
    .sort((a, b) => {
      // Special items teach their effect; a nearby bone line is a fallback.
      const specialA = a.object.type === 'bone' ? 1 : 0;
      const specialB = b.object.type === 'bone' ? 1 : 0;
      return specialA - specialB || a.distance - b.distance;
    });
  const entry = pickups.find(candidate => {
    const lane = laneIndex(candidate.object.lane);
    if (lane === null) return false;
    return !hazards.some(hazard => Math.abs(aheadBy(hazard, run.distance) - candidate.distance) < 9 &&
      laneIndex(hazard.lane) === lane);
  });
  if (!entry) return null;
  return {
    target: laneIndex(entry.object.lane),
    source: entry.object.type === 'bone' ? 'bones' : 'pickup',
    distance: Math.ceil(entry.distance),
    urgency: Math.max(0, Math.min(1, 1 - entry.distance / lookahead)),
    overhead: Boolean(entry.object.airborne),
  };
}

/**
 * Forecast the next lane affordance. `target` deliberately remains the
 * current lane during a calm opening so the renderer can still show a quiet
 * “you are here” pad without flashing a false instruction.
 */
export function laneTargetFor(run = {}, {lookahead = 38, pickupLookahead = 28} = {}) {
  const current = laneIndex(run.lane) ?? 1;
  const hazard = hazardForecast(run, current, lookahead);
  const pickup = hazard ? null : pickupForecast(run, current, pickupLookahead);
  const recommendation = hazard || pickup;
  return {
    current,
    target: recommendation?.target ?? current,
    source: recommendation?.source ?? 'steady',
    distance: recommendation?.distance ?? null,
    urgency: recommendation?.urgency ?? 0,
    overhead: recommendation?.overhead ?? false,
    recommended: Boolean(recommendation && recommendation.target !== current),
  };
}
