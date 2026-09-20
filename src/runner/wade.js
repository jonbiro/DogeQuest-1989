// Oasis water-break contract: three hop gaps on a 110m stretch. Gaps sit
// 40m apart so a full top-speed jump always has a landing zone, and Scenic
// never sees them (its contract promises no full-width gaps). First splash
// per run breaks the streak instead of costing a heart.
//
// Scheduling is positional, not row-lottery: the first stretch lands at 4160,
// clear of the 3950 river recovery and the 4350 corner approach, and repeats
// every 1400m into spans the fixed grid leaves open. Reservations still yield
// to courses, corners, rides and forks, so some periods skip instead of
// stacking.
export const WADE_FIRST = 4160;
export const WADE_PERIOD = 1400;
export const WADE_GAPS = 3;
export const WADE_GAP_STEP = 40;
export const WADE_LEAD = 10;
export const WADE_LENGTH = WADE_LEAD + (WADE_GAPS - 1) * WADE_GAP_STEP + 20;

export function wadeByIndex(index, first = WADE_FIRST) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const start = first + index * WADE_PERIOD;
  if (!Number.isSafeInteger(start + WADE_LENGTH)) return null;
  return {index, start, end: start + WADE_LENGTH};
}

export function wadeIntersecting(start, end, first = WADE_FIRST) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const index = Math.max(
    0,
    Math.floor((start - first - WADE_LENGTH) / WADE_PERIOD),
  );
  if (!Number.isSafeInteger(index)) return null;
  for (let i = index; i <= index + 2; i++) {
    const stretch = wadeByIndex(i, first);
    if (stretch && end >= stretch.start - 10 && start <= stretch.end + 10) return stretch;
  }
  return null;
}
