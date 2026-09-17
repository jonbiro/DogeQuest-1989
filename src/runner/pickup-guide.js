// One source of truth for the items that appear on the trail. The same short
// language is used by the in-run guide, the help key, and the active-power
// chips so a player never has to decode a new name for the same reward.
export const PICKUP_DEFINITIONS = Object.freeze({
  magnet: Object.freeze({
    label: 'Magnet',
    icon: '🧲',
    effect: 'Pulls nearby bones',
    // The duration grows with the Magnet upgrade (and the opening perk has
    // its own timer), so avoid promising a fixed ten seconds in the guide.
    // The live chip and pickup receipt show the exact timer for this run.
    detail: 'Collect to draw ground bones toward Mochi; the live timer shows how long it lasts.',
    color: '#8ff2e7',
  }),
  shield: Object.freeze({
    label: 'Shield',
    icon: '🛡',
    effect: 'Blocks one hit',
    detail: 'Collect to protect Mochi from the next collision.',
    color: '#b9edff',
  }),
  gem: Object.freeze({
    label: 'Gem',
    icon: '◆',
    effect: '+250 points',
    detail: 'Collect for an instant 250-point bonus.',
    color: '#edb5ff',
  }),
  double: Object.freeze({
    // Name the reward by its job. The old “Gold token” label described its
    // shape, not its payoff, so a first-time player could collect it without
    // understanding why it mattered.
    label: 'Bone doubler',
    icon: '×2',
    effect: '2× bone points · 10s',
    detail: 'Collect to double the points from every bone for 10 seconds.',
    color: '#ffe08c',
  }),
  heart: Object.freeze({
    label: 'Heart',
    icon: '♥',
    effect: 'Restore 1 heart',
    detail: 'Collect to heal one heart. Full health converts it to +100 points.',
    color: '#ffb4c8',
  }),
  gift: Object.freeze({
    label: 'Gift box',
    icon: '▣',
    effect: '+100 points',
    detail: 'Collect for a 100-point surprise.',
    color: '#e8c5ff',
  }),
  zoomies: Object.freeze({
    label: 'Zoomies',
    icon: '🎾',
    effect: 'Speed + smash · 6s',
    detail: 'Collect to run faster and smash solid hazards for 6 seconds.',
    color: '#d9f58c',
  }),
  relic: Object.freeze({
    label: 'Area relic',
    icon: '✦',
    effect: '+160 points',
    detail: 'Collect at the end of a course for a 160-point area bonus.',
    color: '#e8c7ff',
  }),
});

export const PICKUP_TYPES = Object.freeze(Object.keys(PICKUP_DEFINITIONS));

export function pickupDefinition(type) {
  return PICKUP_DEFINITIONS[type] || null;
}

// A just-collected pickup gets one short confirmation in the same quiet card
// used for the approach guide. Keeping this feedback in the HUD (rather than
// the middle of the trail) makes instant rewards understandable without
// covering the next obstacle or interrupting a swipe.
export function pickupNoticeFor(run, maxAge = 1.35) {
  if (!run || run.ended || run.practice) return null;
  const pickup = run.lastPickup;
  if (!pickup || typeof pickup.type !== 'string' ||
      !Number.isFinite(pickup.time) || !Number.isFinite(run.time) ||
      run.time < pickup.time || run.time - pickup.time > maxAge) return null;
  const definition = pickupDefinition(pickup.type);
  if (!definition) return null;
  const result = typeof pickup.result === 'string' && pickup.result
    ? pickup.result
    : definition.effect;
  return {
    type: pickup.type,
    icon: definition.icon,
    label: `${definition.label} collected`,
    effect: definition.effect,
    detail: result,
    color: definition.color,
    title: `${definition.label} collected`,
    copy: result,
    ariaLabel: `${definition.label} collected. ${result}.`,
  };
}

function laneLabel(run, object) {
  const current = Number.isFinite(run?.lane) ? run.lane : 1;
  const target = Number.isFinite(object?.lane) ? object.lane : current;
  if (target === current) return 'your lane';
  const distance = Math.abs(target - current);
  // Direction is part of the pickup decision, not just descriptive metadata.
  // A small arrow survives the narrow phone card better than a second sentence
  // and makes the same cue useful to a player who is glancing at the world
  // label rather than reading the full help screen.
  return `${target < current ? '← left' : 'right →'}${distance > 1 ? ' · 2 lanes' : ''}`;
}

// Return only the nearest readable special pickup. The guide deliberately
// starts late enough to stay useful instead of becoming another permanent
// banner: at the opening 22 m/s, 58m is roughly 2.5 seconds of notice. Urgent
// jump/slide/turn cues retain the single message slot and the player still
// has time to move for the reward.
export function pickupGuideFor(run, maxDistance = 58) {
  if (!run || run.ended || run.practice || run.raft || run.minecart) return null;
  const distance = Number.isFinite(run.distance) ? run.distance : 0;
  const candidate = (run.objects || [])
    .filter(object => PICKUP_TYPES.includes(object.type) && !object.used && !object.passed &&
      object.at > distance + 1.8 && object.at - distance <= maxDistance &&
      // Aerial gifts are taught by the zipline cue; showing them here would
      // imply that a normal jump can collect them from the ground.
      !object.airborne)
    .sort((a, b) => a.at - b.at)[0];
  if (!candidate) return null;
  const definition = pickupDefinition(candidate.type);
  if (!definition) return null;
  const meters = Math.max(1, Math.ceil(candidate.at - distance));
  const lane = laneLabel(run, candidate);
  return {
    type: candidate.type,
    icon: definition.icon,
    label: definition.label,
    effect: definition.effect,
    detail: definition.detail,
    color: definition.color,
    meters,
    lane,
    // The icon has its own high-contrast cell in the card. Keeping the title
    // text-only avoids rendering the same emoji twice on platforms with
    // different emoji baselines.
    title: definition.label,
    copy: `${definition.effect} · ${lane} · ${meters}m`,
    ariaLabel: `${definition.label}. ${definition.detail} ${lane}, ${meters} meters ahead.`,
  };
}

// The HUD card is deliberately quiet and can be hidden while a move cue owns
// attention. The scene still needs one lightweight identity cue for the
// nearest special item, otherwise a player has to remember the icon from the
// help screen before deciding whether to change lanes. Keep this helper pure
// so the renderer can choose a single candidate without duplicating the item
// vocabulary or showing labels for every pickup in a dense row.
export function pickupBadgeFor(run, maxDistance = 34) {
  if (!run || run.ended || run.practice || run.raft || run.minecart || run.zipline ||
      Number(run.y) > 0.1 || Number(run.slide) > 0) return null;
  const distance = Number.isFinite(run.distance) ? run.distance : 0;
  let candidate = null;
  for (const object of run.objects || []) {
    if (!PICKUP_TYPES.includes(object.type) || object.used || object.passed) continue;
    const approach = object.at - distance;
    if (!(approach > 7 && approach <= maxDistance)) continue;
    if (!candidate || approach < candidate.approach) candidate = {object, approach};
  }
  if (!candidate) return null;
  const definition = pickupDefinition(candidate.object.type);
  if (!definition) return null;
  const meters = Math.max(1, Math.ceil(candidate.approach));
  const lane = laneLabel(run, candidate.object);
  return {
    ...definition,
    type: candidate.object.type,
    object: candidate.object,
    meters,
    lane,
    action: candidate.object.airborne ? 'JUMP TO COLLECT' : 'COLLECT',
    copy: `${definition.effect} · ${lane} · ${meters}m`,
    ariaLabel: `${definition.label}. ${definition.detail} ${lane}, ${meters} meters ahead.`,
  };
}
