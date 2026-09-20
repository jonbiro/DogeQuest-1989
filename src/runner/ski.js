// Frostpeak downhill contract.  Skiing is an authored chapter layered on top
// of the current trail generator rather than a new area index.  Keeping it in
// its own module means old six-area saves and legacy replay streams remain
// byte-for-byte compatible while current trails gain a memorable snow beat.

// The first slope lands in a clear pocket after the established bridge beat
// and before the next zipline/cart chapter, leaving a calm recovery window.
// Keeping the authored distance also protects the opening three-kilometre
// learning route from competing set pieces; later long runs then earn the
// distinct Frostpeak chapter as a deliberate escalation.
export const SKI_FIRST = 8700;
export const SKI_PERIOD = 3600;
export const SKI_LENGTH = 210;
export const SKI_APPROACH = 46;
export const SKI_RECOVERY = 42;
// Version-six trails drop in at 4600, clear of the 4550 fork gates, the 4420
// glide tail and the 4350 corner recovery, with the 4850 cable sitting just
// past the exit as a legal ski-then-catch combo. Later trails keep the 8700
// opening and every shared link replays.
export const SKI_V6_FIRST = 4600;
export function skiFirst(version) {
  return version >= 6 ? SKI_V6_FIRST : SKI_FIRST;
}
export const SKI_REWARD = 360;
export const SKI_BANK_LIMIT = 3.35;
export const SKI_HOP_DURATION = 0.52;
export const SKI_HOP_HEIGHT = 1.08;

// Frostpeak's character hazards use their own flag instead of `skiHazard`.
// The original four-beat contract is still consumed by older replay helpers
// and tests; the new flag lets the chapter grow without changing that count.
export const SKI_OBSTACLE_TYPES = Object.freeze(['yeti', 'snowball', 'snowman']);

const FREQUENCY = 15;
const DAMPING = 8.8;
const DAMPED_FREQUENCY = Math.sqrt(FREQUENCY * FREQUENCY - DAMPING * DAMPING);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

export function skiByIndex(index, first = SKI_FIRST) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const start = first + index * SKI_PERIOD;
  if (!Number.isSafeInteger(start + SKI_LENGTH + SKI_RECOVERY)) return null;
  return {
    index,
    start,
    end: start + SKI_LENGTH,
    approach: start - SKI_APPROACH,
    recovery: start + SKI_LENGTH + SKI_RECOVERY,
  };
}

export function skiAt(distance, first = SKI_FIRST) {
  if (!Number.isFinite(distance) || distance < first) return null;
  const section = skiByIndex(Math.floor((distance - first) / SKI_PERIOD), first);
  return section && distance < section.end ? section : null;
}

export function skiIntersecting(start, end, first = SKI_FIRST) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const index = Math.max(
    0,
    Math.floor((start - first - SKI_LENGTH - SKI_RECOVERY) / SKI_PERIOD),
  );
  if (!Number.isSafeInteger(index)) return null;
  for (let i = index; i <= index + 2; i++) {
    const section = skiByIndex(i, first);
    if (section && end >= section.approach && start <= section.recovery) return section;
  }
  return null;
}

// A shallow carved line gives the descent a visible rhythm without moving the
// puppy away from the player's lane.  It eases to zero at the trail edges.
export function skiCurrent(distance, first = SKI_FIRST) {
  const section = skiAt(distance, first);
  if (!section) return 0;
  const progress = clamp((distance - section.start) / SKI_LENGTH, 0, 1);
  return 0.24 * Math.pow(Math.sin(Math.PI * progress), 2) * Math.sin(progress * Math.PI * 5);
}

// The yeti deliberately crosses the slope rather than sitting in a lane. Both
// simulation and renderer call this helper so the creature's readable patrol
// animation is also its actual collision position.
export function skiYetiX(object, distance) {
  const from = Number.isInteger(object?.skiYetiFrom) ? clamp(object.skiYetiFrom, 0, 2) : 0;
  const to = Number.isInteger(object?.skiYetiTo) ? clamp(object.skiYetiTo, 0, 2) : 2;
  const start = Number.isFinite(object?.skiYetiStart) ? object.skiYetiStart : (object?.at ?? 0) - 9;
  const end = Number.isFinite(object?.skiYetiEnd) ? object.skiYetiEnd : (object?.at ?? 0) + 9;
  const progress = clamp((Number.isFinite(distance) ? distance : start - 9) - start, 0, Math.max(.001, end - start)) /
    Math.max(.001, end - start);
  const eased = progress * progress * (3 - 2 * progress);
  return lerp([-2.4, 0, 2.4][from], [-2.4, 0, 2.4][to], eased);
}

// Snowballs stay mostly in their authored lane but wobble over the packed
// snow. The tiny wave makes them feel alive without ever erasing a clear lane
// choice or making their hitbox surprising.
export function skiSnowballX(object, distance) {
  const lane = Number.isInteger(object?.lane) ? clamp(object.lane, 0, 2) : 1;
  const phase = Number.isFinite(object?.skiWavePhase) ? object.skiWavePhase : 0;
  const wobble = Number.isFinite(distance) && !object?.reducedMotion
    ? Math.sin((distance - (object?.at ?? 0)) * .9 + phase) * .16
    : 0;
  return [-2.4, 0, 2.4][lane] + wobble;
}

// A damped response makes one lane swipe feel immediate but still gives the
// skis a small, readable carve. The clamp prevents a long held drag from
// throwing the puppy outside the playable corridor.
export function steerSki(body, target, dt) {
  if (!body || !Number.isFinite(dt) || dt <= 0 || !Number.isFinite(target)) return;
  target = clamp(target, -2.65, 2.65);
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
  if (Math.abs(body.x) > SKI_BANK_LIMIT) {
    body.x = Math.sign(body.x) * SKI_BANK_LIMIT;
    if (body.x * body.vx > 0) body.vx = 0;
  }
}

export function clearSkiGroundActions(run) {
  if (!run) return;
  run.y = 0;
  run.vy = 0;
  run.slide = 0;
  run.slideNext = 0;
  run.jumpBuffer = 0;
  run.diving = false;
  run.slideExpiredAt = null;
  run.skiHop = 0;
}

export function skiHopHeight(run) {
  const remaining = Number.isFinite(run?.skiHop) ? run.skiHop : 0;
  if (remaining <= 0) return 0;
  const progress = clamp(1 - remaining / SKI_HOP_DURATION, 0, 1);
  return Math.sin(progress * Math.PI) * SKI_HOP_HEIGHT;
}

// Enter/exit is driven by the actual fixed simulation interval. A restored
// run crossing a whole chapter cannot award a completion bonus it did not
// visibly ride through.
export function advanceSki(run, from, to) {
  if (run?.ended || !Number.isFinite(from) || !Number.isFinite(to) || to <= from) return null;
  if (run.ski) {
    if (to < run.ski.end) return 'skiing';
    const completed = from < run.ski.end;
    const section = run.ski;
    run.ski = null;
    clearSkiGroundActions(run);
    if (!completed) return 'aborted';
    run.skis = (run.skis || 0) + 1;
    run.bonusPoints += SKI_REWARD;
    run.invulnerable = Math.max(run.invulnerable || 0, 1.2);
    run.events.push('ski-end');
    run.lastSkiIndex = section.index;
    return 'exited';
  }
  const section = skiAt(to, skiFirst(run.generatorVersion));
  if (!section || from > section.start || section.index <= (run.lastSkiIndex ?? -1) ||
      (run.skiSkipped ?? []).includes(section.start) ||
      run.zipline || run.raft || run.minecart) return null;
  run.lastSkiIndex = section.index;
  run.ski = { ...section, boardedAt: run.time };
  clearSkiGroundActions(run);
  run.events.push('ski-start');
  return 'entered';
}

export function moveSki(run, target, dt) {
  if (!run?.ski || run.ended || !Number.isFinite(dt) || dt <= 0) return false;
  steerSki(run, target + skiCurrent(run.distance, skiFirst(run.generatorVersion)), dt);
  run.slide = 0;
  run.slideNext = 0;
  run.diving = false;
  run.jumpBuffer = 0;
  return true;
}

// A deterministic set of four downhill beats.  Moguls occupy the current
// line and reward a hop; ice occupies a neighboring lane and wants a carve;
// gates show two flags with one clearly open lane. Every beat carries a short
// bone ribbon and the chapter finishes with an explained power-up.
export function skiEncounter(section, challenge = false) {
  if (!section) return [];
  const objects = [];
  // Every beat flows single-or-stay: mogul hops anywhere, ice holds 0,
  // snowballs are hopped or carved to center, and the gate threads center
  // before the snowman. No beat demands a ×2 inside the next beat's window.
  const safeLanes = [1, 0, 1, 1];
  const types = ['mogul', 'ice', 'ski-gate', 'mogul'];
  const offsets = [25, 73, 121, 169];
  for (const [index, safeLane] of safeLanes.entries()) {
    const type = types[index];
    const at = section.start + offsets[index];
    const blockedLane = (safeLane + (index % 2 ? 1 : 2)) % 3;
    const lanes = type === 'mogul'
      ? (challenge ? [safeLane] : [safeLane])
      : challenge ? [0, 1, 2].filter(lane => lane !== safeLane) : [blockedLane];
    for (const lane of lanes) {
      objects.push({
        type,
        lane,
        at,
        skiHazard: true,
        skiSafeLane: safeLane,
        skiBeat: index,
        skillReward: challenge ? 90 : type === 'mogul' ? 70 : 55,
      });
    }
    for (const offset of [-9, -4, 3, 9]) {
      const bone = {
        type: 'bone',
        lane: safeLane,
        at: at + offset,
        skiPickup: true,
        skiBeat: index,
      };
      // The crest pair sits just above the skis and visibly teaches hopping.
      if (type === 'mogul' && (offset === -4 || offset === 3)) bone.skiAirborne = true;
      objects.push(bone);
    }
  }

  // Three distinct set-piece characters break up the four base beats. They
  // sit in the gaps between bone ribbons so the player can read one decision
  // at a time: carve around the patrol, hop the rolling ball, then choose a
  // clear lane around the snowman. Challenge runs add a second snowball as a
  // high-value optional hop without changing the original hazard count.
  const yetiFrom = (section.index + 1) % 3;
  const yetiTo = (yetiFrom + 1) % 3;
  const yetiSafeLane = [0, 1, 2].find(lane => lane !== yetiFrom && lane !== yetiTo) ?? 1;
  objects.push({
    type: 'yeti',
    lane: yetiFrom,
    at: section.start + 52,
    skiObstacle: true,
    skiYeti: true,
    skiYetiFrom: yetiFrom,
    skiYetiTo: yetiTo,
    skiYetiStart: section.start + 42,
    skiYetiEnd: section.start + 62,
    // The crossing body occupies the space between its two lanes. A slightly
    // wider envelope makes the midpoint a real decision instead of a visual
    // prop that a centered skier can pass through without consequence.
    skiCollisionWidth: 1.45,
    skiSafeLane: yetiSafeLane,
    skillReward: challenge ? 105 : 80,
  });
  const snowballLane = (section.index + 2) % 3;
  objects.push({
    type: 'snowball',
    lane: snowballLane,
    at: section.start + 98,
    skiObstacle: true,
    skiSnowball: true,
    skiJumpable: true,
    skiWavePhase: section.index * .75,
    // Carve to center: single steers from the ice lane (0) and on to the ski
    // gate (2). Deriving it from the ball's lane instead forces a ×2 in 23m
    // right where the gate cue is still masked by the ball.
    skiSafeLane: 1,
    skillReward: challenge ? 115 : 90,
  });
  const snowmanLane = section.index % 3;
  objects.push({
    type: 'snowman',
    lane: snowmanLane,
    at: section.start + 145,
    skiObstacle: true,
    skiSafeLane: (snowmanLane + 1) % 3,
    skillReward: challenge ? 95 : 72,
  });
  if (challenge) {
    objects.push({
      type: 'snowball',
      lane: (snowballLane + 2) % 3,
      at: section.start + 156,
      skiObstacle: true,
      skiSnowball: true,
      skiJumpable: true,
      skiWavePhase: section.index * .75 + 1.8,
      skiSafeLane: snowballLane,
      skillReward: 125,
    });
  }
  const magnet = { type: 'magnet', lane: 1, at: section.start + 12, skiPickup: true };
  magnet.encounter = 'Frostpeak descent';
  objects.push(magnet);
  const zoomies = { type: 'zoomies', lane: 1, at: section.end - 28, skiPickup: true };
  zoomies.encounter = 'Frostpeak finish';
  objects.push(zoomies);
  const gift = { type: 'gift', lane: 1, at: section.end - 10, skiPickup: true };
  gift.encounter = 'Frostpeak finish';
  objects.push(gift);
  return objects;
}

// Used by the renderer to fade from the normal world into a snowfield without
// a hard color pop at the approach or recovery boundary.
export function skiVisualBlend(distance, section = skiIntersecting(distance - 1, distance + 1)) {
  if (!section || !Number.isFinite(distance)) return 0;
  const fadeIn = clamp((distance - section.approach) / 28, 0, 1);
  const fadeOut = clamp((section.recovery - distance) / 35, 0, 1);
  const smooth = value => value * value * (3 - 2 * value);
  return Math.min(smooth(fadeIn), smooth(fadeOut));
}
