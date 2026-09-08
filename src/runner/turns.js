// Deliberate corners repeat with the world, independent of random obstacle rows.
// Distances are measured along the trail; positive yaw turns toward runner-left.
export const CORNER_PERIOD = 1400;
export const CORNER_OFFSETS = [150, 950];
export const CORNER_ARC_LENGTH = 25;
export const CORNER_CLEAR_BEFORE = 45;
export const CORNER_CLEAR_AFTER = 45;
export const TURN_WINDOW_SECONDS = 1;
export const TURN_SKILL_REWARD = 100;

export function cornerByIndex(index) {
  if (!Number.isInteger(index) || index < 0) return null;
  const cycle = Math.floor(index / CORNER_OFFSETS.length);
  const slot = index % CORNER_OFFSETS.length;
  const at = cycle * CORNER_PERIOD + CORNER_OFFSETS[slot];
  // Alternating the pair each cycle stays learnable without becoming a fixed
  // left-right metronome. Each cycle still has zero net heading change.
  const left = (cycle + slot) % 2 === 0;
  const direction = left ? "left" : "right";
  const sign = left ? 1 : -1;
  return {
    index,
    cycle,
    slot,
    at,
    start: at,
    end: at + CORNER_ARC_LENGTH,
    direction,
    sign,
    angle: sign * Math.PI / 2,
    approach: at - CORNER_CLEAR_BEFORE,
    recovery: at + CORNER_CLEAR_AFTER,
  };
}

export function upcomingCorner(distance) {
  if (!Number.isFinite(distance)) return null;
  const cycle = Math.max(0, Math.floor(distance / CORNER_PERIOD));
  const first = cornerByIndex(cycle * CORNER_OFFSETS.length);
  if (distance <= first.at) return first;
  const second = cornerByIndex(cycle * CORNER_OFFSETS.length + 1);
  if (distance <= second.at) return second;
  return cornerByIndex((cycle + 1) * CORNER_OFFSETS.length);
}

export function cornersBetween(start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
  const firstCycle = Math.max(0, Math.floor((start - CORNER_OFFSETS[1]) / CORNER_PERIOD));
  const lastCycle = Math.max(0, Math.floor(end / CORNER_PERIOD) + 1);
  const result = [];
  for (let cycle = firstCycle; cycle <= lastCycle; cycle++) {
    for (let slot = 0; slot < CORNER_OFFSETS.length; slot++) {
      const corner = cornerByIndex(cycle * CORNER_OFFSETS.length + slot);
      if (corner.at >= start && corner.at <= end) result.push(corner);
    }
  }
  return result;
}

export function cornerIntersecting(start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const nearby = cornersBetween(start - CORNER_CLEAR_AFTER, end + CORNER_CLEAR_BEFORE);
  return nearby.find((corner) => end >= corner.approach && start <= corner.recovery) || null;
}

function pendingCorner(run) {
  const index = Number.isInteger(run.nextCorner) ? run.nextCorner : 0;
  return cornerByIndex(index);
}

export function turnPrompt(run) {
  if (!run || run.ended || run.zipline) return null;
  const corner = pendingCorner(run);
  if (!corner) return null;
  const speed = Math.max(1, Number.isFinite(run.speed) ? run.speed : 1);
  const seconds = (corner.at - run.distance) / speed;
  if (seconds < 0 || seconds > TURN_WINDOW_SECONDS) return null;
  const attempt = run.turnAttempt?.index === corner.index ? run.turnAttempt : null;
  return {
    ...corner,
    seconds,
    status: attempt?.correct ? "accepted" : attempt ? "wrong" : "ready",
    attemptedDirection: attempt?.direction || null,
  };
}

// Returns true when a horizontal input belongs to the corner. Callers can then
// avoid also treating that swipe as a lane change.
export function applyTurnInput(run, direction) {
  if (direction !== "left" && direction !== "right") return false;
  const prompt = turnPrompt(run);
  if (!prompt) return false;
  if (prompt.status === "accepted") return true;
  run.turnAttempt = {
    index: prompt.index,
    direction,
    correct: direction === prompt.direction,
  };
  return true;
}
