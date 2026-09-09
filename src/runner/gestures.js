// Wait for a clear axis before committing a diagonal swipe to an action.
export function canStartSwipe(event, activePointer) {
  return !activePointer && event.isPrimary !== false && event.button === 0;
}

export function ownsSwipe(event, activePointer) {
  return activePointer !== null && activePointer.id === event.pointerId;
}

export function swipeAction(dx, dy) {
  const x = Math.abs(dx), y = Math.abs(dy);
  if (Math.max(x, y) < 24) return null;
  if (x > y * 1.25) return dx > 0 ? 'right' : 'left';
  if (y > x * 1.25) return dy > 0 ? 'slide' : 'jump';
  return null;
}
