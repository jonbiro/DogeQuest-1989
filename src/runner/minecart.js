// Mine-cart traversal contract. The cart is a short, readable rail section:
// steering keeps the same three-lane vocabulary, while jump and slide are
// deliberately unavailable until the cart reaches the next track exit.
// Current prototype trails (generator version 4) opt in; historical versions
// 1–3 keep their original object streams.
//
// The first section sits after the second river crossing window and before the
// next marked corner. A fixed period keeps generated trails deterministic and
// leaves old replay versions untouched.
// Keep the first cart after the established six-kilometre reaction suite. It
// gives new runs a later traversal chapter without changing the opening
// rhythm or the historical zipline/river teaching windows.
export const MINECART_FIRST = 7200;
export const MINECART_PERIOD = 2800;
export const MINECART_LENGTH = 95;
export const MINECART_APPROACH = 28;
export const MINECART_RECOVERY = 8;
export const MINECART_REWARD = 250;
export const MINECART_BANK_LIMIT = 3.15;

const FREQUENCY = 13;
const DAMPING = 7.8;
const DAMPED_FREQUENCY = Math.sqrt(FREQUENCY * FREQUENCY - DAMPING * DAMPING);

export function minecartByIndex(index) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const start = MINECART_FIRST + index * MINECART_PERIOD;
  if (!Number.isSafeInteger(start + MINECART_LENGTH + MINECART_RECOVERY)) return null;
  return {
    index,
    start,
    end: start + MINECART_LENGTH,
    approach: start - MINECART_APPROACH,
    recovery: start + MINECART_LENGTH + MINECART_RECOVERY,
  };
}

export function minecartAt(distance) {
  if (!Number.isFinite(distance) || distance < MINECART_FIRST) return null;
  const index = Math.floor((distance - MINECART_FIRST) / MINECART_PERIOD);
  const section = minecartByIndex(index);
  // The exit plane belongs to the dismount step, not a fresh boarding event.
  // Keeping this half-open mirrors the raft contract and prevents a large
  // restored step that lands exactly on `end` from manufacturing a ride.
  return section && distance < section.end ? section : null;
}

export function minecartIntersecting(start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const index = Math.max(
    0,
    Math.floor((start - MINECART_FIRST - MINECART_LENGTH - MINECART_RECOVERY) / MINECART_PERIOD),
  );
  if (!Number.isSafeInteger(index)) return null;
  for (let i = index; i <= index + 1; i++) {
    const section = minecartByIndex(i);
    if (section && end >= section.approach && start <= section.recovery) return section;
  }
  return null;
}

// A gentle rail vibration gives the cart momentum without teleporting the
// puppy. It returns to zero at both ends so entering and dismounting stay calm.
export function minecartCurrent(distance) {
  const section = minecartAt(distance);
  if (!section) return 0;
  const t = (distance - section.start) / MINECART_LENGTH;
  return 0.16 * Math.pow(Math.sin(Math.PI * t), 2) * Math.sin(Math.PI * t * 3);
}

export function steerMinecart(body, target, dt) {
  if (!body || !Number.isFinite(dt) || dt <= 0 || !Number.isFinite(target)) return;
  target = Math.max(-2.65, Math.min(2.65, target));
  const offset = body.x - target;
  const velocity = Number.isFinite(body.vx) ? body.vx : 0;
  const decay = Math.exp(-DAMPING * dt);
  const angle = DAMPED_FREQUENCY * dt;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  body.x = target + decay * (
    offset * cosine + (velocity + DAMPING * offset) / DAMPED_FREQUENCY * sine
  );
  body.vx = decay * (
    velocity * cosine -
    (DAMPING * velocity + FREQUENCY * FREQUENCY * offset) / DAMPED_FREQUENCY * sine
  );
  if (Math.abs(body.x) > MINECART_BANK_LIMIT) {
    body.x = Math.sign(body.x) * MINECART_BANK_LIMIT;
    if (body.x * body.vx > 0) body.vx = 0;
  }
}

export function clearMinecartGroundActions(run) {
  run.y = 0;
  run.vy = 0;
  run.slide = 0;
  run.slideNext = 0;
  run.jumpBuffer = 0;
  run.diving = false;
  run.slideExpiredAt = null;
}

// Call with the actual simulation interval. Skipping an entire section cannot
// manufacture a completion bonus or a cart ride in a restored run.
export function advanceMinecart(run, from, to) {
  if (run?.ended || !Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  if (run.minecart) {
    if (to < run.minecart.end) return 'riding';
    const completed = from < run.minecart.end;
    run.minecart = null;
    clearMinecartGroundActions(run);
    if (!completed) return 'aborted';
    run.minecarts = (run.minecarts || 0) + 1;
    run.bonusPoints += MINECART_REWARD;
    run.invulnerable = Math.max(run.invulnerable, 1.2);
    run.events.push('minecart-end');
    return 'exited';
  }
  const section = minecartAt(to);
  if (!section || from > section.start || section.index <= (run.lastMinecartIndex ?? -1) || run.zipline || run.raft) return null;
  run.lastMinecartIndex = section.index;
  run.minecart = { ...section, boardedAt: run.time, boardingHeight: run.y };
  clearMinecartGroundActions(run);
  run.events.push('minecart-start');
  return 'entered';
}

export function moveMinecart(run, target, dt) {
  if (!run?.minecart || run.ended || !Number.isFinite(dt) || dt <= 0) return false;
  steerMinecart(run, target + minecartCurrent(run.distance), dt);
  clearMinecartGroundActions(run);
  return true;
}

export function minecartEncounter(section, challenge = false) {
  const objects = [];
  // Three beats trade the safe lane left, right, then center. Scenic cart
  // sections show one rock per beat; Challenge asks for two-lane steering.
  for (const [index, safeLane] of [1, 0, 2].entries()) {
    const at = section.start + 18 + index * 24;
    for (let lane = 0; lane < 3; lane++) {
      if (challenge ? lane !== safeLane : lane === [0, 2, 1][index]) {
        objects.push({
          type: 'rock',
          lane,
          at,
          minecartHazard: true,
          minecartSafeLane: safeLane,
        });
      }
    }
    for (const offset of [-8, -3, 3, 8])
      objects.push({ type: 'bone', lane: safeLane, at: at + offset, minecartPickup: true });
  }
  objects.push({ type: 'gift', lane: 2, at: section.end - 10, minecartPickup: true });
  return objects;
}
