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

// A tap is a useful fallback for players who do not discover swipes. Keep the
// edge zones deliberately narrow so a normal centre tap remains a jump. This
// is only consumed by touch callers; mouse clicks keep their established jump
// behaviour.
export function tapAction(pointer, event, screenWidth, touch = false) {
  if (!isJumpTap(pointer, event)) return null;
  if (!touch || !Number.isFinite(screenWidth) || screenWidth <= 0) return 'jump';
  const edge = Math.min(84, Math.max(56, screenWidth * .2));
  if (event.clientX <= edge) return 'left';
  if (event.clientX >= screenWidth - edge) return 'right';
  return 'jump';
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
