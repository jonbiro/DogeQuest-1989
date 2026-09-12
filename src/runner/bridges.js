// Boundaries share the five-meter paving grid so neither deck overlaps nor
// missing transition slabs appear as the scenery recycles.
export const BRIDGE_PERIOD = 900, BRIDGE_START = 180, BRIDGE_END = 280;
export function isBridge(distance) {
  const position = Math.max(0, distance) % BRIDGE_PERIOD;
  return position >= BRIDGE_START && position < BRIDGE_END;
}
