// Boundaries share the five-meter paving grid so neither deck overlaps nor
// missing transition slabs appear as the scenery recycles.
export const BRIDGE_PERIOD = 900, BRIDGE_START = 180, BRIDGE_END = 280;

// Every other bridge gets one authored collapse beat. Keeping the beat on its
// own period means old trail versions can continue to use the original bridge
// cadence while version four can opt into a memorable jump set piece without
// changing the position of any pre-existing object.
export const BRIDGE_COLLAPSE_FIRST = BRIDGE_START + 50;
export const BRIDGE_COLLAPSE_PERIOD = BRIDGE_PERIOD * 2;
export const BRIDGE_COLLAPSE_APPROACH = 34;
export const BRIDGE_COLLAPSE_RECOVERY = 24;

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

export function isBridge(distance) {
  const position = Math.max(0, distance) % BRIDGE_PERIOD;
  return position >= BRIDGE_START && position < BRIDGE_END;
}

export function bridgeCollapseByIndex(index) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const at = BRIDGE_COLLAPSE_FIRST + index * BRIDGE_COLLAPSE_PERIOD;
  return {
    index,
    at,
    approach: at - BRIDGE_COLLAPSE_APPROACH,
    recovery: at + BRIDGE_COLLAPSE_RECOVERY,
    // The gap stays a single paving tile so the jump is readable and
    // forgiving; the visual deck collapse starts earlier and settles later.
    bridgeStart: at - 50,
    bridgeEnd: at + 50,
  };
}

export function bridgeCollapseIntersecting(start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const first = Math.max(0, Math.floor((start - BRIDGE_COLLAPSE_FIRST - 50) / BRIDGE_COLLAPSE_PERIOD));
  for (let index = first; index <= first + 2; index++) {
    const section = bridgeCollapseByIndex(index);
    if (section && end >= section.approach && start <= section.recovery) return section;
  }
  return null;
}

/**
 * Return a small, deterministic animation state for a bridge deck at a
 * world-station. `centers` is supplied by the run so a skipped/legacy bridge
 * never collapses visually without its matching jump gap.
 */
export function bridgeCollapseState(distance, centers = []) {
  const station = finite(distance);
  let nearest = null;
  let nearestDelta = Infinity;
  for (const center of centers) {
    if (!Number.isFinite(center)) continue;
    const delta = station - center;
    if (Math.abs(delta) < Math.abs(nearestDelta)) {
      nearest = center;
      nearestDelta = delta;
    }
  }
  if (!nearest || Math.abs(nearestDelta) > 50) return null;
  // Segments nearer the approach lip begin to drop first. The smoothstep
  // curve avoids a hard pop when the recycled tile enters the camera frustum.
  const progress = Math.max(0, Math.min(1, (nearestDelta + 34) / 68));
  const eased = progress * progress * (3 - 2 * progress);
  const tremor = (1 - eased) * Math.sin((nearestDelta + 50) * 1.7) * .035;
  return {
    center: nearest,
    delta: nearestDelta,
    progress,
    eased,
    tremor,
    // Rails lag behind the deck for a fraction of a second, which makes the
    // collapse read as a structure giving way rather than a fading texture.
    railProgress: Math.max(0, Math.min(1, (nearestDelta + 26) / 58)),
  };
}
