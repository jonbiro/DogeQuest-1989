// Keep gesture recognition forgiving enough for real thumbs. A player can
// start a swipe on a slightly diagonal path, but equal diagonals still wait
// for a clearer direction instead of guessing.
export function canStartSwipe(event, activePointer) {
  return !activePointer && event.isPrimary !== false && event.button === 0;
}

// Explicit controls support two thumbs; the trail still has one swipe owner.
export function canPressAction(event) {
  return event.button === 0 && (event.pointerType === 'touch' || event.isPrimary !== false);
}

export function ownsSwipe(event, activePointer) {
  return activePointer !== null && activePointer.id === event.pointerId;
}

export function isJumpTap(pointer, event) {
  const elapsed = event.timeStamp - pointer.started;
  const travel = Math.max(pointer.travel || 0,
    Math.abs(event.clientX - pointer.x), Math.abs(event.clientY - pointer.y));
  return elapsed >= 0 && elapsed <= 350 && travel < 24;
}

export function swipeAction(dx, dy, released = false) {
  const x = Math.abs(dx), y = Math.abs(dy);
  if (Math.max(x, y) < 24) return null;
  // Touch paths are rarely perfectly straight. Accept a modestly dominant
  // axis while moving, and be a touch more conservative on release when the
  // browser may have delivered only the first and last samples.
  const bias = released ? 1.08 : 1.12;
  if (x > y * bias) return dx > 0 ? 'right' : 'left';
  if (y > x * bias) return dy > 0 ? 'slide' : 'jump';
  return null;
}
