// A selected fork gets a small, optional reward line.  The line is authored
// from the fork distance rather than the mutable random stream so replay links
// and restored sessions always show the same branch shape.
export const ROUTE_BRANCH_LENGTH = 220;
export const ROUTE_TRAIL_START = 28;
export const ROUTE_TRAIL_END = 190;

const BRANCHES = Object.freeze({
  scenic: Object.freeze({
    title: 'MOSSY SHORTCUT',
    detail: 'Fewer hazards · follow the calm bone trail',
    preview: 'Gentler rows + optional bone line',
    color: '#a7e59e',
    lanes: Object.freeze([0, 0, 1, 1, 0, 1, 0, 0]),
  }),
  challenge: Object.freeze({
    title: 'GOLDEN RISK RUN',
    detail: 'Tighter rows · +60 points per clear',
    preview: 'Tougher rows + richer bone line',
    color: '#f0b762',
    lanes: Object.freeze([2, 2, 1, 2, 1, 2, 2, 1]),
  }),
});

function validKind(kind) {
  return kind === 'challenge' ? 'challenge' : 'scenic';
}

function finiteFork(value, until) {
  if (Number.isFinite(value)) return value;
  return Number.isFinite(until) ? until - ROUTE_BRANCH_LENGTH : 0;
}

/**
 * Return the presentation and reward metadata for a committed branch.
 * `until` remains the established 220m route window; extra fields are ignored
 * by route geometry, so older callers can safely pass this object through.
 */
export function routeBranchFor(kind, forkAt, until = forkAt + ROUTE_BRANCH_LENGTH) {
  const branchKind = validKind(kind);
  const definition = BRANCHES[branchKind];
  const fork = finiteFork(forkAt, until);
  const end = Number.isFinite(until) ? until : fork + ROUTE_BRANCH_LENGTH;
  const variant = Math.abs(Math.floor(fork / 700)) % 3;
  const lanes = definition.lanes.map((lane, index) => {
    // Every third fork nudges the middle pair to create a slightly different
    // optional line without asking the player for a new rule.
    if (variant === 1 && index === 3) return lane === 1 ? 0 : lane;
    if (variant === 2 && index === 4) return lane === 1 ? 2 : lane;
    return lane;
  });
  return {
    kind: branchKind,
    until: end,
    forkAt: fork,
    branchId: `${branchKind}-${Math.max(0, Math.floor(fork / 700))}`,
    branchTitle: definition.title,
    branchDetail: definition.detail,
    branchPreview: definition.preview,
    branchColor: definition.color,
    branchTrailSpawned: false,
    shortcut: branchKind === 'scenic',
    trailStart: fork + ROUTE_TRAIL_START,
    trailEnd: fork + ROUTE_TRAIL_END,
    trailLanes: lanes,
  };
}

/**
 * Generate the eight optional bone stations for a committed branch.  Each
 * entry is intentionally sparse (about 23m apart) so collecting it never
 * requires a forced lane snap and missing it never creates a hazard.
 */
export function routeTrailFor(route) {
  if (!route || !['scenic', 'challenge'].includes(route.kind)) return [];
  const branch = routeBranchFor(route.kind, route.forkAt, route.until);
  const lanes = Array.isArray(route.trailLanes) && route.trailLanes.length
    ? route.trailLanes
    : branch.trailLanes;
  const start = Number.isFinite(route.trailStart) ? route.trailStart : branch.trailStart;
  const end = Number.isFinite(route.trailEnd) ? route.trailEnd : branch.trailEnd;
  const count = Math.min(lanes.length, Math.max(0, Math.floor((end - start) / 20) + 1));
  if (!count) return [];
  const spacing = count === 1 ? 0 : (end - start) / (count - 1);
  return lanes.slice(0, count).map((lane, index) => ({
    lane: Math.max(0, Math.min(2, Math.floor(lane))),
    at: start + spacing * index,
    index,
  }));
}

export function routeBranchDefinition(kind) {
  return BRANCHES[validKind(kind)];
}
