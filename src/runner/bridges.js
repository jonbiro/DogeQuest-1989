// Boundaries share the five-meter paving grid so neither deck overlaps nor
// missing transition slabs appear as the scenery recycles.
export function isBridge(distance) {
  const position = Math.max(0, distance) % 900;
  return position >= 180 && position < 280;
}
