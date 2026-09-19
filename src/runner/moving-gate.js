// A moving gate is a short timing encounter layered onto the three-lane trail.
// It sweeps between the outside lanes while the runner approaches, so the
// player can either follow the opening or use the familiar slide under the
// gate. The schedule is deterministic and deliberately independent from the
// seeded ordinary rows.

export const MOVING_GATE_FIRST = 2850;
export const MOVING_GATE_PERIOD = 1800;
export const MOVING_GATE_LENGTH = 56;
export const MOVING_GATE_APPROACH = 32;
export const MOVING_GATE_RECOVERY = 28;
// Version-six trails debut the gate at 1900 so adventures meet it; later
// trails keep the established 2850 opening and every shared link replays.
export const MOVING_GATE_V6_FIRST = 1900;
export function movingGateFirst(version) {
  return version >= 6 ? MOVING_GATE_V6_FIRST : MOVING_GATE_FIRST;
}

// Keep this local instead of importing `LANES` from world.js: world owns the
// scheduler and importing it here would create a module cycle.
export const MOVING_GATE_LANES = Object.freeze([-2.4, 0, 2.4]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function laneX(lane) {
  return MOVING_GATE_LANES[clamp(Math.round(lane), 0, 2)];
}

export function movingGateByIndex(index, first = MOVING_GATE_FIRST) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const start = first + index * MOVING_GATE_PERIOD;
  if (!Number.isSafeInteger(start + MOVING_GATE_LENGTH + MOVING_GATE_RECOVERY)) return null;
  // Alternating sweeps keep the visual rhythm learnable without making every
  // encounter a fixed left-to-right metronome.
  const startLane = index % 2 === 0 ? 0 : 2;
  const endLane = startLane === 0 ? 2 : 0;
  return {
    index,
    start,
    end: start + MOVING_GATE_LENGTH,
    approach: start - MOVING_GATE_APPROACH,
    recovery: start + MOVING_GATE_LENGTH + MOVING_GATE_RECOVERY,
    startLane,
    endLane,
    startX: laneX(startLane),
    endX: laneX(endLane),
  };
}

export function movingGateAt(distance, first = MOVING_GATE_FIRST) {
  if (!Number.isFinite(distance) || distance < first) return null;
  const index = Math.floor((distance - first) / MOVING_GATE_PERIOD);
  const section = movingGateByIndex(index, first);
  return section && distance < section.end ? section : null;
}

export function movingGateIntersecting(start, end, first = MOVING_GATE_FIRST) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const index = Math.max(
    0,
    Math.floor((start - first - MOVING_GATE_LENGTH - MOVING_GATE_RECOVERY) / MOVING_GATE_PERIOD),
  );
  if (!Number.isSafeInteger(index)) return null;
  for (let i = index; i <= index + 1; i++) {
    const section = movingGateByIndex(i, first);
    if (section && end >= section.approach && start <= section.recovery) return section;
  }
  return null;
}

/**
 * Return the gate's horizontal position at a distance along the trail.
 * Movement is a smooth ping-pong sweep with a stationary position at each
 * extreme, which gives a player a readable opening instead of a teleport.
 */
export function movingGateX(object, distance) {
  if (!object) return 0;
  const startX = Number.isFinite(object.startX) ? object.startX : laneX(object.startLane ?? object.lane ?? 1);
  const endX = Number.isFinite(object.endX) ? object.endX : laneX(object.endLane ?? object.lane ?? 1);
  const start = Number.isFinite(object.start) ? object.start : Number(object.at) || 0;
  const length = Number.isFinite(object.end) && object.end > start
    ? object.end - start : MOVING_GATE_LENGTH;
  const progress = clamp(((Number.isFinite(distance) ? distance : start) - start) / length, 0, 1);
  const pingPong = progress <= .5 ? progress * 2 : 2 - progress * 2;
  const eased = pingPong * pingPong * (3 - 2 * pingPong);
  return startX + (endX - startX) * eased;
}

export function movingGateLane(object, distance = object?.at) {
  const x = movingGateX(object, distance);
  let lane = 0;
  let nearest = Infinity;
  for (let index = 0; index < MOVING_GATE_LANES.length; index++) {
    const gap = Math.abs(MOVING_GATE_LANES[index] - x);
    if (gap < nearest) {
      nearest = gap;
      lane = index;
    }
  }
  return lane;
}

// Pick the closest lane that is visibly outside the gate's collision envelope.
// A lane remains open even when the bar is between two lane centres.
export function movingGateSafeLane(object, distance = object?.at, currentLane = 1) {
  const x = movingGateX(object, distance);
  const candidates = MOVING_GATE_LANES
    .map((lane, index) => ({lane: index, distance: Math.abs(lane - currentLane), gap: Math.abs(lane - x)}))
    .filter(candidate => candidate.gap >= 1.2)
    .sort((a, b) => a.distance - b.distance || b.gap - a.gap);
  return candidates[0]?.lane ?? (movingGateLane(object, distance) === 1 ? 0 : 1);
}

export function movingGateEncounter(section, challenge = false) {
  if (!section) return [];
  const at = section.start + Math.round(MOVING_GATE_LENGTH * .52);
  const gate = {
    type: 'moving-gate',
    // Keep the authored end lane on the serialised object so old guidance and
    // replay tooling still have a stable lane to display.
    lane: section.endLane,
    at,
    movingGate: true,
    start: section.start,
    end: section.end,
    startLane: section.startLane,
    endLane: section.endLane,
    startX: section.startX,
    endX: section.endX,
    challenge,
    skillReward: challenge ? 80 : 45,
  };
  // Keep compatibility with older route policies that only know the original
  // `gate` vocabulary. This inert, already-passed marker lets those policies
  // see the timing row and choose an open lane without adding another visible
  // mesh or a second collision. New guidance ignores it because it is marked
  // used/passed; the real moving gate remains the first return value.
  const compatibilityMarker = {
    type: 'gate',
    lane: gate.lane,
    at: gate.at,
    used: true,
    passed: true,
    movingGateShadow: true,
    skillReward: 0,
  };
  const safeLane = movingGateSafeLane(gate, at, section.endLane);
  const rewards = [
    {type: 'bone', lane: safeLane, at: section.start + 9},
    {type: 'bone', lane: safeLane, at: section.start + 14},
    {type: 'bone', lane: safeLane, at: section.start + 19},
    {type: 'gift', lane: safeLane, at: section.end + 8},
  ];
  return [gate, compatibilityMarker, ...rewards.map(reward => ({...reward, movingGateReward: true}))];
}
