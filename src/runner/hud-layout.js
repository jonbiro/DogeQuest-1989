// The mission dock and the touch control stack are both anchored to the bottom
// of the scene, but only the controls know how tall they really are: the
// button row grows with its labels, and the gesture coach is an absolutely
// positioned banner that appears above it only while a touch lesson is live.
// The dock used to reserve a fixed 92/96px, which was already less than the
// portrait button row needs, so the coach banner printed straight over the
// mission line. Measure the real top of the stack instead and let CSS place
// the dock above it.

// Breathing room between the top of the control stack and the mission dock.
export const HUD_STACK_GAP = 10;
// A measurement can only ever be trusted so far: a mid-layout read, a hidden
// ancestor or a browser that reports a zero-height viewport must not be able to
// push the dock off the top of the screen.
export const HUD_RESERVE_LIMIT = 0.6;

// Distance, in CSS pixels, that the mission dock must keep clear above the
// bottom of the viewport. `tops` are viewport-relative top edges of everything
// in the bottom control stack; anything non-finite or off-screen is ignored.
// Returns null when there is nothing trustworthy to measure, which asks the
// caller to leave the CSS fallback in place.
export function hudReserve(viewportHeight, tops, gap = HUD_STACK_GAP) {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return null;
  const usable = (Array.isArray(tops) ? tops : [tops])
    .filter(value => Number.isFinite(value) && value > 0 && value < viewportHeight);
  if (!usable.length) return null;
  const reserve = Math.round(viewportHeight - Math.min(...usable) + gap);
  if (reserve <= 0) return null;
  return Math.min(reserve, Math.round(viewportHeight * HUD_RESERVE_LIMIT));
}

// Only the portrait phone layout stacks the dock on top of the controls.
// Landscape anchors the dock to the top of the screen, so a reserve there would
// fight the CSS rather than help it.
export function hudReserveApplies(width, height) {
  return Number.isFinite(width) && Number.isFinite(height) &&
    width <= 700 && height > width;
}
