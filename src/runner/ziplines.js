export const ZIPLINE_FIRST = 650;
export const ZIPLINE_PERIOD = 1400;
export const ZIPLINE_LENGTH = 140;
export const ZIPLINE_HEIGHT = 3.6;

export function ziplineAt(distance) {
  if (distance < ZIPLINE_FIRST) return null;
  const start = ZIPLINE_FIRST + Math.floor((distance - ZIPLINE_FIRST) / ZIPLINE_PERIOD) * ZIPLINE_PERIOD;
  return distance <= start + ZIPLINE_LENGTH ? {start, end: start + ZIPLINE_LENGTH} : null;
}
