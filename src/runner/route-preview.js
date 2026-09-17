import {areaGameplayAt} from './areas.js';

// The route fork is a fast decision, so its copy needs to work at a glance.
// Keep the preview deterministic and dependency-free: the HUD can render it
// without touching the simulation or allocating interactive controls.
const ROUTE_OPTIONS = Object.freeze([
  Object.freeze({
    kind: 'scenic',
    title: 'SCENIC',
    arrow: '←',
    lane: 'LEFT LANE',
    effect: 'Fewer hazards',
    reward: 'Mossy shortcut · bone trail',
  }),
  Object.freeze({
    kind: 'challenge',
    title: 'CHALLENGE',
    arrow: '→',
    lane: 'RIGHT LANE',
    effect: '+60 pts per clear',
    reward: 'Golden risk · bone trail',
  }),
]);

// Forks used to read as the same two generic cards every time. Give the
// preview a small destination-specific noun so a player can understand what
// kind of place the detour enters before committing to a lane. These are
// presentation labels only; the seeded route geometry and rewards stay the
// same for shared trails and replays.
const FORK_CONTEXTS = Object.freeze({
  'roots-and-canopy': Object.freeze({
    area: 'ROOTS + CANOPY',
    scenic: 'MOSSY ROOT CUT-THROUGH',
    challenge: 'CANOPY GAUNTLET',
  }),
  'bamboo-zigzag': Object.freeze({
    area: 'BAMBOO ZIGZAG',
    scenic: 'LANTERN GROVE SHORTCUT',
    challenge: 'BAMBOO SLALOM',
  }),
  'broken-ridge': Object.freeze({
    area: 'BROKEN RIDGE',
    scenic: 'CANYON SHORTCUT',
    challenge: 'RIDGE RUN',
  }),
  'oasis-stepping-stones': Object.freeze({
    area: 'OASIS STEPPING STONES',
    scenic: 'PALM-SHADE DETOUR',
    challenge: 'WATERLINE SPRINT',
  }),
  'crystal-slalom': Object.freeze({
    area: 'CRYSTAL SLALOM',
    scenic: 'PRISM PASS',
    challenge: 'SHARD GAUNTLET',
  }),
  'moonlit-canopy': Object.freeze({
    area: 'MOONLIT CANOPY',
    scenic: 'MOONCAP MEANDER',
    challenge: 'NIGHT WEAVE',
  }),
});

function forkContext(distance) {
  const profile = areaGameplayAt(distance);
  return FORK_CONTEXTS[profile?.id] || Object.freeze({
    area: String(profile?.label || 'TRAIL FORK').toUpperCase(),
    scenic: 'MOSSY SHORTCUT',
    challenge: 'GOLDEN RISK RUN',
  });
}

function gateDistance(run) {
  if (!Number.isFinite(run?.choicePending) || !Number.isFinite(run?.distance)) return null;
  const remaining = run.choicePending - run.distance;
  return remaining > 0 && remaining <= 40 ? Math.ceil(remaining) : null;
}

/**
 * Return the authored fork preview while the gate is inside its clear
 * approach. The returned object is safe to use in both HTML and tests: all
 * copy is static and the only dynamic value is a clamped integer distance.
 */
export function routeChoicePreview(run = {}) {
  const remaining = gateDistance(run);
  if (remaining === null) return null;
  const context = forkContext(run.choicePending);
  const options = ROUTE_OPTIONS.map(option => ({
    ...option,
    // Keep the familiar tradeoff copy, then add one short landmark phrase.
    // The extra phrase is intentionally authored, not generated from object
    // types, so it remains readable on a narrow phone and stable in replays.
    reward: `${option.reward} · ${context[option.kind]}`,
  }));
  return { remaining, context, options };
}

/**
 * Render a compact, non-interactive route card. Lane buttons remain the
 * actual input; this view is a visual preview that tells a player what each
 * branch buys before they commit to a swipe.
 */
export function routeChoiceMarkup(run = {}) {
  const preview = routeChoicePreview(run);
  if (!preview) return '';
  const options = preview.options.map(option => `
    <span class="route-option route-option-${option.kind}" data-lane="${option.kind === 'scenic' ? 0 : 2}">
      <span class="route-option-top"><b>${option.arrow}</b><strong>${option.title}</strong><small>${option.lane}</small></span>
      <span class="route-option-effect">${option.effect}</span>
      <span class="route-option-reward">${option.reward}</span>
    </span>`).join('');
  return `<div class="route-choice-head"><span>FORK AHEAD · ${preview.context.area}</span><strong>${preview.remaining}m</strong><small>tap or swipe a lane · optional bone trail on both</small></div><div class="route-choice-options">${options}</div>`;
}
