export const ZIPLINE_FIRST = 650;
export const ZIPLINE_PERIOD = 1400;
export const ZIPLINE_LENGTH = 140;
export const ZIPLINE_HEIGHT = 3.6;
export const CABLE_SEGMENT_LENGTH = 5.4;

// Clip only the cable behind the dog, before it grows through the chase camera.
// Adjacent segments still overlap and the attachment at z=0 stays covered.
export function cableSegment(z) {
  const length=Math.max(0,Math.min(CABLE_SEGMENT_LENGTH,1.5-z+CABLE_SEGMENT_LENGTH/2));
  return {z:length<CABLE_SEGMENT_LENGTH ? 1.5-length/2 : z,scale:length/CABLE_SEGMENT_LENGTH};
}

export function ziplineAt(distance) {
  if (distance < ZIPLINE_FIRST) return null;
  const start = ZIPLINE_FIRST + Math.floor((distance - ZIPLINE_FIRST) / ZIPLINE_PERIOD) * ZIPLINE_PERIOD;
  return distance <= start + ZIPLINE_LENGTH ? {start, end: start + ZIPLINE_LENGTH} : null;
}
