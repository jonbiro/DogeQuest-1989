// Clamber walls: short vertical vine/net walls. v6+ only.
// Jump-pump to climb, steer to stay under the leaf cue. No damage on miss:
// a missed pump slides to the base and forfeits the bonus. Reuses jump/
// steer verbs and instanced box/trunk batches — zero new geometries.
export const CLIMB_FIRST = 900;
export const CLIMB_PERIOD = 1800;
export const CLIMB_LENGTH = 24;
export const CLIMB_HEIGHT = 2.6;
export const CLIMB_REWARD = 180;

export function climbByIndex(index) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const start = CLIMB_FIRST + index * CLIMB_PERIOD;
  return {index, start, end: start + CLIMB_LENGTH, approach: start - 30, recovery: start + CLIMB_LENGTH + 30};
}

export function climbAt(distance) {
  if (!Number.isFinite(distance) || distance < CLIMB_FIRST) return null;
  const section = climbByIndex(Math.floor((distance - CLIMB_FIRST) / CLIMB_PERIOD));
  return section && distance < section.end ? section : null;
}

export function climbIntersecting(start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const index = Math.max(0, Math.floor((start - CLIMB_FIRST - CLIMB_LENGTH - 30) / CLIMB_PERIOD));
  if (!Number.isSafeInteger(index)) return null;
  for (let i = index; i <= index + 2; i++) {
    const section = climbByIndex(i);
    if (section && end >= section.approach && start <= section.recovery) return section;
  }
  return null;
}
