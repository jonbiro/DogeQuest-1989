// Small, no-account choices that shape one scored run.  They deliberately
// change the opening feel, not the point economy: the runner still earns the
// same points for the same actions and no currency is spent to equip a perk.

export const DEFAULT_RUN_MODIFIER = 'treat-pouch';

export const RUN_MODIFIERS = Object.freeze([
  Object.freeze({
    id: 'treat-pouch',
    icon: '🍪',
    name: 'Treat pouch',
    short: 'Shield first hit',
    effect: 'Start with a shield that blocks your first collision.',
    active: 'Shield ready',
  }),
  Object.freeze({
    id: 'scent-burst',
    icon: '🧲',
    name: 'Scent burst',
    short: 'Magnet · 8s',
    effect: 'Pull nearby bones automatically for your first 8 seconds.',
    active: 'Magnet warm-up',
    duration: 8,
  }),
  Object.freeze({
    id: 'calm-start',
    icon: '🌿',
    name: 'Calm start',
    short: 'Safe · 4s',
    effect: 'Ignore collisions for your first 4 seconds while you read the trail.',
    active: 'Safe opening',
    duration: 4,
  }),
]);

const MODIFIER_BY_ID = new Map(RUN_MODIFIERS.map(modifier => [modifier.id, modifier]));

export function modifierFor(value) {
  return MODIFIER_BY_ID.get(String(value || '')) || MODIFIER_BY_ID.get(DEFAULT_RUN_MODIFIER);
}

export function modifierFrom(value) {
  return modifierFor(value).id;
}

// `null`/`undefined` means no perk, which keeps direct world-model tests and
// historical shared-trail helpers backwards compatible.  The app passes the
// saved default explicitly for normal scored adventures.
export function applyRunModifier(run, value) {
  if (!run || value === null || value === undefined || value === '') return null;
  const definition = modifierFor(value);
  run.modifier = {
    id: definition.id,
    name: definition.name,
    effect: definition.effect,
    active: definition.active,
    duration: definition.duration || 0,
    used: false,
  };
  if (definition.id === 'treat-pouch') run.shield = Math.max(1, run.shield || 0);
  if (definition.id === 'scent-burst') run.magnet = Math.max(8, run.magnet || 0);
  if (definition.id === 'calm-start') run.invulnerable = Math.max(4, run.invulnerable || 0);
  if (Array.isArray(run.events)) run.events.push('modifier-start');
  return run.modifier;
}

