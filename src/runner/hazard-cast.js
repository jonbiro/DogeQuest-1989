// Hazard cast: the gameplay contract split from appearance (spec step 1).
//
// `HAZARD_CAST` owns one entry per gameplay hazard type: its clearing rule,
// collision width, palette family and human-readable label. `SOLID_HAZARDS`
// and the clearing branch in `world.js` derive from this table instead of
// being hand-listed in five places, so a future character (pound officer,
// crate cart, re-dressed gate/rock) can be added without touching every
// consumer. Gameplay keeps referring to types exactly as it does now;
// fairness, collision timing and seeded generation are unchanged.
//
// `appearanceFor` owns the visual contract: it maps a gameplay object to a
// render key. Today that is the identity mapping plus the single established
// `crystal-rock` exception (a rock whose course beat carries region 2). The
// `area` parameter is reserved for future per-destination re-dresses
// (warden's gate, feed sacks) and is intentionally unused beyond the crystal
// row, so the seam exists before the art does.

import {hazardTone} from './theme-tokens.js';

export const HAZARD_CAST = Object.freeze({
  rock: Object.freeze({clear: 'jump', jumpHeight: 1.25, width: 0.95, palette: 'stone', legacy: true, label: 'Boulder'}),
  log: Object.freeze({clear: 'jump', jumpHeight: 0.65, width: 0.95, palette: 'organic', legacy: true, label: 'Fallen log'}),
  arch: Object.freeze({clear: 'slide', jumpHeight: null, width: 0.95, palette: 'stone', legacy: true, label: 'Stone arch'}),
  branch: Object.freeze({clear: 'slide', jumpHeight: null, width: 0.95, palette: 'organic', legacy: true, label: 'Overhead branch'}),
  gate: Object.freeze({clear: 'slide', jumpHeight: null, width: 0.95, palette: 'stone', legacy: true, label: 'Trail gate'}),
  'pound-worker': Object.freeze({clear: 'jump', jumpHeight: 0.65, width: 0.95, palette: 'none', character: true, label: 'Shelter worker'}),
  'pound-officer': Object.freeze({clear: 'slide', jumpHeight: null, width: 0.95, palette: 'none', character: true, label: 'Pound officer'}),
  'crate-cart': Object.freeze({clear: 'jump', jumpHeight: 0.65, width: 0.95, palette: 'none', character: true, label: 'Crate cart'}),
  'moving-gate': Object.freeze({clear: 'slide', jumpHeight: null, width: 0.95, palette: 'stone', label: 'Moving gate'}),
  gap: Object.freeze({clear: 'jump', jumpHeight: 0.8, width: 0.95, palette: 'none', label: 'Broken trail'}),
  mogul: Object.freeze({clear: 'jump', jumpHeight: 0.58, width: 0.95, palette: 'none', label: 'Mogul'}),
  snowball: Object.freeze({clear: 'jump', jumpHeight: 0.58, width: 0.95, palette: 'none', label: 'Rolling snowball'}),
  ice: Object.freeze({clear: 'steer', jumpHeight: null, width: 0.95, palette: 'none', label: 'Blue ice'}),
  'ski-gate': Object.freeze({clear: 'steer', jumpHeight: null, width: 0.95, palette: 'none', label: 'Ski gate'}),
  yeti: Object.freeze({clear: 'steer', jumpHeight: null, width: 1.45, palette: 'none', label: 'Yeti patrol'}),
  snowman: Object.freeze({clear: 'steer', jumpHeight: null, width: 0.95, palette: 'none', label: 'Snowman'}),
});

// Legacy seeded streams pick from these five in this exact order. Derived
// from the cast so the list cannot drift, but the order is contractual.
export const SOLID_HAZARDS = Object.freeze(
  ['rock', 'log', 'arch', 'branch', 'gate'].filter(type => HAZARD_CAST[type]?.legacy),
);

export const CHARACTER_HAZARDS = Object.freeze(['pound-worker', 'pound-officer', 'crate-cart']);

export const HAZARDS = Object.freeze([
  ...SOLID_HAZARDS,
  ...CHARACTER_HAZARDS,
  'moving-gate',
  'gap',
  'mogul',
  'ice',
  'ski-gate',
  'yeti',
  'snowball',
  'snowman',
]);

// Ground-trail hazards considered by lane cues, mistake details and the lane
// forecast. Ski/ride hazards carry their own safe-lane metadata and cues.
export const TRAIL_HAZARDS = Object.freeze([
  'rock',
  'log',
  'arch',
  'branch',
  'gate',
  'moving-gate',
  'gap',
  'pound-worker',
  'pound-officer',
  'crate-cart',
]);

// Every slide-clearing hazard reads as overhead: duck under it. The officer's
// net hangs at dog height, so it joins the overhead family even though it is
// a character rather than architecture. This drives dive cues, slide mistake
// reasons and passed-mesh hiding — never collision, which lives in the cast.
export const OVERHEAD_HAZARDS = Object.freeze(['arch', 'branch', 'gate', 'moving-gate', 'pound-officer']);

export const CLEARED_BY_JUMP = Object.freeze(
  new Set(Object.keys(HAZARD_CAST).filter(type => HAZARD_CAST[type].clear === 'jump')),
);

export const CLEARED_BY_SLIDE = Object.freeze(
  new Set(Object.keys(HAZARD_CAST).filter(type => HAZARD_CAST[type].clear === 'slide')),
);

export function clearedBy(type) {
  return HAZARD_CAST[type]?.clear ?? null;
}

export function toneFor(type) {
  return hazardTone(type);
}

export function jumpHeightFor(type) {
  return HAZARD_CAST[type]?.jumpHeight ?? null;
}

export function collisionWidthFor(type, fallback = 0.95) {
  const width = HAZARD_CAST[type]?.width;
  return Number.isFinite(width) ? width : fallback;
}

export function isOverhead(type) {
  return OVERHEAD_HAZARDS.includes(type);
}

export function isTrailHazard(type) {
  return TRAIL_HAZARDS.includes(type);
}

function normalizedType(typeOrObject) {
  return typeof typeOrObject === 'string' ? typeOrObject : typeOrObject?.type;
}

function normalizedCourseRegion(typeOrObject) {
  return typeof typeOrObject === 'string' ? undefined : typeOrObject?.courseRegion;
}

// Map a gameplay object to its render template key. `area` is the visual
// destination index. Re-dresses cost no taxonomy change: a gate near the
// Sunleaf shelter renders as the warden's fence-gate, and a boulder by the
// Oasis market renders as stacked feed sacks. Same silhouette family, same
// clearing rule, different dress. The crystal course region keeps precedence.
export function appearanceFor(typeOrObject, area) {
  const type = normalizedType(typeOrObject);
  if (type === 'rock' && normalizedCourseRegion(typeOrObject) === 2) return 'crystal-rock';
  if (type === 'gate' && area === 0) return 'warden-gate';
  if (type === 'rock' && area === 3) return 'feed-sacks';
  return type;
}

// Map a render key back to its gameplay type for palette grouping.
export function baseTypeFor(renderKey) {
  if (renderKey === 'crystal-rock' || renderKey === 'feed-sacks') return 'rock';
  if (renderKey === 'warden-gate') return 'gate';
  return renderKey;
}
