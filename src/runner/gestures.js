// Wait for a clear axis before committing a diagonal swipe to an action.
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
  // While moving, wait for a clear direction. On release there are no more
  // samples to clarify a natural thumb arc, so accept a modestly dominant axis.
  // Near-perfect diagonals still do nothing rather than guessing an action.
  const bias = released ? 1.1 : 1.25;
  if (x > y * bias) return dx > 0 ? 'right' : 'left';
  if (y > x * bias) return dy > 0 ? 'slide' : 'jump';
  return null;
}
