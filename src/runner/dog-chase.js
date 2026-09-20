// A friendly chase-pup set piece. The chase is a presentation/reward beat,
// not another collision system: the runner follows the existing three-lane
// rules while a companion leads a short, readable bone line.

export const DOG_CHASE_FIRST = 1400;
export const DOG_CHASE_PERIOD = 2400;
export const DOG_CHASE_LENGTH = 84;
export const DOG_CHASE_APPROACH = 28;
export const DOG_CHASE_RECOVERY = 24;
export const DOG_CHASE_REWARD = 140;
// Version-six trails move the chase to 2780, after the climb and before the
// 2950 corner: the moving gate takes the old 1400 slot so adventures keep
// every verb. Later trails keep the 1400 chase and every shared link replays.
export const DOG_CHASE_V6_FIRST = 2780;
export function dogChaseFirst(version) {
  return version >= 6 ? DOG_CHASE_V6_FIRST : DOG_CHASE_FIRST;
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function dogChaseByIndex(index, first = DOG_CHASE_FIRST) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const start = first + index * DOG_CHASE_PERIOD;
  if (!Number.isSafeInteger(start + DOG_CHASE_LENGTH + DOG_CHASE_RECOVERY)) return null;
  const lane = index % 2 === 0 ? 1 : 0;
  return {
    index,
    start,
    end: start + DOG_CHASE_LENGTH,
    approach: start - DOG_CHASE_APPROACH,
    recovery: start + DOG_CHASE_LENGTH + DOG_CHASE_RECOVERY,
    lane,
  };
}

export function dogChaseAt(distance, first = DOG_CHASE_FIRST) {
  if (!Number.isFinite(distance) || distance < first) return null;
  const index = Math.floor((distance - first) / DOG_CHASE_PERIOD);
  const chase = dogChaseByIndex(index, first);
  return chase && distance >= chase.start && distance < chase.end ? chase : null;
}

export function dogChaseIntersecting(start, end, first = DOG_CHASE_FIRST) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const index = Math.max(
    0,
    Math.floor((start - first - DOG_CHASE_LENGTH - DOG_CHASE_RECOVERY) / DOG_CHASE_PERIOD),
  );
  for (let i = index; i <= index + 2; i++) {
    const chase = dogChaseByIndex(i, first);
    if (chase && end >= chase.approach && start <= chase.recovery) return chase;
  }
  return null;
}

export function dogChaseProgress(distance, chase) {
  if (!chase || !Number.isFinite(distance)) return null;
  const progress = Math.max(0, Math.min(1, (distance - chase.start) / DOG_CHASE_LENGTH));
  const eased = progress * progress * (3 - 2 * progress);
  // A gentle side-to-side lead keeps the companion alive without making the
  // bone lane ambiguous. The lane changes only at the midpoint of the beat.
  const lane = progress < .5 ? chase.lane : chase.lane === 1 ? 2 : 1;
  return {
    progress,
    eased,
    lane,
    x: (lane - 1) * 2.4,
    bob: Math.sin(progress * Math.PI * 4) * .06,
    wag: Math.sin(progress * Math.PI * 8) * .14,
  };
}

export function dogChaseWindow(distance, chase) {
  if (!chase || !Number.isFinite(distance)) return null;
  const start = finite(chase.start);
  const end = finite(chase.end, start + DOG_CHASE_LENGTH);
  if (distance < start - DOG_CHASE_APPROACH || distance > end + DOG_CHASE_RECOVERY) return null;
  return {
    chase,
    remaining: Math.max(0, end - distance),
    active: distance >= start && distance < end,
  };
}
