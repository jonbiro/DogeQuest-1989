// Glide canopy: Sunleaf/Mooncap updraft zones. v6+ only.
// Jump into the shimmer (y > .65) to float; hold Jump to stay up, release to
// drop. Steer between airborne bones + gift like the zipline trail. Miss =
// safe ground route. Reuses zipline air physics + atmosphere particles.
export const GLIDE_FIRST = 1400;
export const GLIDE_PERIOD = 2000;
export const GLIDE_LENGTH = 60;
export const GLIDE_REWARD = 150;

export function glideByIndex(index) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const start = GLIDE_FIRST + index * GLIDE_PERIOD;
  return {index, start, end: start + GLIDE_LENGTH, approach: start - 36, recovery: start + GLIDE_LENGTH + 30};
}

export function glideAt(distance) {
  if (!Number.isFinite(distance) || distance < GLIDE_FIRST) return null;
  const section = glideByIndex(Math.floor((distance - GLIDE_FIRST) / GLIDE_PERIOD));
  return section && distance < section.end ? section : null;
}

export function glideIntersecting(start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const index = Math.max(0, Math.floor((start - GLIDE_FIRST - GLIDE_LENGTH - 30) / GLIDE_PERIOD));
  if (!Number.isSafeInteger(index)) return null;
  for (let i = index; i <= index + 2; i++) {
    const section = glideByIndex(i);
    if (section && end >= section.approach && start <= section.recovery) return section;
  }
  return null;
}
