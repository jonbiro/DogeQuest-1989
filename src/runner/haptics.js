// Small, optional haptic vocabulary for the runner.  The game must remain
// fully playable on browsers that do not expose Vibration API, so every
// operation is guarded and the pure pattern helpers are safe to test without
// a DOM or a device.

export const HAPTIC_PATTERNS = Object.freeze({
  tap: Object.freeze([8]),
  bone: Object.freeze([6]),
  pickup: Object.freeze([10, 18, 10]),
  streak: Object.freeze([8, 24, 12]),
  clear: Object.freeze([7]),
  'near-miss': Object.freeze([10, 18, 10]),
  jump: Object.freeze([8]),
  land: Object.freeze([5]),
  slide: Object.freeze([7]),
  turn: Object.freeze([8, 16, 8]),
  hit: Object.freeze([42, 22, 72]),
  'shield-break': Object.freeze([20, 28, 35]),
  zoomies: Object.freeze([12, 18, 12]),
  'area-enter': Object.freeze([8, 26, 8]),
  'bridge-collapse': Object.freeze([16, 24, 16]),
  'dog-chase-start': Object.freeze([9, 18, 9]),
  'dog-chase-end': Object.freeze([8, 18, 8]),
  'modifier-start': Object.freeze([8, 20, 8]),
  'ride-start': Object.freeze([12, 22, 18]),
  'ride-end': Object.freeze([8, 20, 14]),
  reward: Object.freeze([8, 18, 8]),
});

const HIGH_PRIORITY = new Set([
  'hit',
  'shield-break',
  'near-miss',
  'area-enter',
  'bridge-collapse',
  'ride-start',
  'ride-end',
]);

function cleanPattern(pattern) {
  if (!Array.isArray(pattern)) return null;
  const clean = pattern
    .map(value => Number.isFinite(value) ? Math.max(1, Math.min(120, Math.round(value))) : 0)
    .filter(Boolean)
    .slice(0, 8);
  return clean.length ? clean : null;
}

/**
 * Return the device pattern for a simulation event.  Pickup names are kept
 * distinct in the event stream, but share a short triple pulse so a player
 * can feel a reward without learning eight different vibration languages.
 */
export function hapticPattern(event, run = {}) {
  const name = String(event || '');
  if (name === 'bone') {
    // Every fifth bone gets a slightly richer pulse; ordinary bones stay
    // deliberately light so a dense line never becomes an irritating buzz.
    const combo = Number.isFinite(run.combo) ? Math.max(0, Math.floor(run.combo)) : 0;
    return combo > 0 && combo % 5 === 0 ? HAPTIC_PATTERNS.streak : HAPTIC_PATTERNS.bone;
  }
  if (['magnet', 'shield', 'gem', 'double', 'heart', 'gift', 'relic'].includes(name))
    return HAPTIC_PATTERNS.pickup;
  if (name === 'streak' || name === 'flow' || name === 'course-complete' || name === 'course-recovery')
    return HAPTIC_PATTERNS.reward;
  if (name === 'turn-left' || name === 'turn-right') return HAPTIC_PATTERNS.turn;
  if (name === 'raft-start' || name === 'zipline-start' || name === 'minecart-start')
    return HAPTIC_PATTERNS['ride-start'];
  if (name === 'raft-end' || name === 'zipline-end' || name === 'minecart-end')
    return HAPTIC_PATTERNS['ride-end'];
  return HAPTIC_PATTERNS[name] || null;
}

function nowFor(value) {
  if (Number.isFinite(value)) return value;
  if (typeof performance !== 'undefined' && Number.isFinite(performance.now?.())) return performance.now();
  return Date.now();
}

/**
 * Create a throttled haptic dispatcher.  The throttle prevents a bone line
 * and its clear/flow reward from competing in the same millisecond, while a
 * high-priority collision or area transition can interrupt the quiet cadence.
 */
export function createHapticController(target, {minGap = 64} = {}) {
  const vibrate = typeof target?.vibrate === 'function' ? target.vibrate.bind(target) : null;
  let lastAt = -Infinity;
  return {
    available: Boolean(vibrate),
    trigger(event, run = {}, at) {
      if (!vibrate) return false;
      const pattern = cleanPattern(hapticPattern(event, run));
      if (!pattern) return false;
      const time = nowFor(at);
      const priority = HIGH_PRIORITY.has(String(event || ''));
      if (!priority && time - lastAt < Math.max(0, minGap)) return false;
      try {
        const accepted = vibrate(pattern);
        // Vibration() returns a boolean in a few embedded browsers and
        // undefined in Safari/Chrome.  Both are treated as a successful call
        // unless the browser explicitly returns false.
        if (accepted === false) return false;
        lastAt = time;
        return true;
      } catch {
        return false;
      }
    },
    cancel() {
      if (!vibrate) return false;
      try {
        vibrate(0);
        lastAt = nowFor();
        return true;
      } catch {
        return false;
      }
    },
  };
}
