// Root-rail contract: a 40m steer-only log with two hop breaks. Harmless
// aboard (no hazards inside), but the stretch reserves its window so it never
// covers another beat's approach. Breaks sit 10m apart so one well-timed jump
// clears both; each break spans all three lanes so steering around them is
// impossible.
//
// Scheduling is positional: the first log lands at 3310, clear of the 3200
// gate recovery and the 3450 cable approach, and repeats every 1400m into
// spans the fixed grid leaves open. Reservations still yield, so some periods
// skip instead of stacking.
export const RAIL_FIRST = 3310;
export const RAIL_PERIOD = 1400;
export const RAIL_LENGTH = 40;

export function railByIndex(index, first = RAIL_FIRST) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const start = first + index * RAIL_PERIOD;
  if (!Number.isSafeInteger(start + RAIL_LENGTH)) return null;
  return {index, start, end: start + RAIL_LENGTH};
}

export function railIntersecting(start, end, first = RAIL_FIRST) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const index = Math.max(
    0,
    Math.floor((start - first - RAIL_LENGTH) / RAIL_PERIOD),
  );
  if (!Number.isSafeInteger(index)) return null;
  for (let i = index; i <= index + 2; i++) {
    const stretch = railByIndex(i, first);
    if (stretch && end >= stretch.start - 10 && start <= stretch.end + 10) return stretch;
  }
  return null;
}
