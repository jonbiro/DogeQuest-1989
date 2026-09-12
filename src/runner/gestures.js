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

export function swipeAction(dx, dy) {
  const x = Math.abs(dx), y = Math.abs(dy);
  if (Math.max(x, y) < 24) return null;
  if (x > y * 1.25) return dx > 0 ? 'right' : 'left';
  if (y > x * 1.25) return dy > 0 ? 'slide' : 'jump';
  return null;
}
