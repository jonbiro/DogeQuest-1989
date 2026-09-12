// Motion uses meters and seconds. Exact spring/ballistic integration keeps
// steering and jump timing consistent across the supported simulation steps.
export const JUMP_DURATION = .72;
export const JUMP_SPEED = 14;
export const GRAVITY = 2 * JUMP_SPEED / JUMP_DURATION;
export const JUMP_BUFFER = .12;
const LANE_SPRING = 26, DIVE_GRAVITY = 180, DIVE_TERMINAL = 28;

function leapScale(run) {
  return 1 + run.upgrades.leap * .1;
}

function jumpGravity(run) {
  // Upgrades add clearance without stretching the input lockout. The launch
  // speed and gravity scale together, so every level keeps the same airtime.
  return GRAVITY * leapScale(run);
}
// Remaining airtime of an ordinary ballistic jump (not an accelerated dive).
export function jumpLandingTime(run) {
  const gravity=jumpGravity(run);
  return (run.vy+Math.sqrt(run.vy*run.vy+2*gravity*run.y))/gravity;
}

export function jump(run) {
  run.slideExpiredAt = null;
  run.slide = 0;
  run.diving = false;
  run.jumpBuffer = 0;
  run.vy = JUMP_SPEED * leapScale(run);
  run.events.push('jump');
}

export function steer(run, target, dt) {
  const offset = run.x - target, momentum = run.vx + LANE_SPRING * offset;
  const decay = Math.exp(-LANE_SPRING * dt);
  run.x = target + (offset + momentum * dt) * decay;
  run.vx = (run.vx - LANE_SPRING * momentum * dt) * decay;
}

// Integrate one constant-acceleration segment, ending exactly at the ground.
function fall(run, gravity, duration) {
  if (duration <= 0) return {elapsed: 0, landed: false};
  const endY = run.y + run.vy * duration - gravity * duration * duration / 2;
  // Do not delay a boundary landing by a tick because of sub-nanometer roundoff.
  if (endY > 1e-10) {
    run.y = endY;
    run.vy -= gravity * duration;
    return {elapsed: duration, landed: false};
  }
  const elapsed = gravity
    ? (run.vy + Math.sqrt(run.vy * run.vy + 2 * gravity * run.y)) / gravity
    : run.y / -run.vy;
  const impact = Math.max(0, gravity * elapsed - run.vy);
  run.y = 0; run.vy = 0;
  return {elapsed: Math.max(0, Math.min(duration, elapsed)), landed: true, impact};
}

export function moveVertical(run, dt) {
  if (run.y === 0 && run.vy === 0) {
    tickSlide(run, dt);
    run.jumpBuffer = Math.max(0, run.jumpBuffer - dt);
    return;
  }
  const gravity = run.diving ? DIVE_GRAVITY : jumpGravity(run);
  const accelerating = run.diving ? Math.min(dt, Math.max(0, (run.vy + DIVE_TERMINAL) / gravity)) : dt;
  let result = fall(run, gravity, accelerating);
  if (!result.landed && accelerating < dt) {
    const coast = fall(run, 0, dt - accelerating);
    result = {...coast, elapsed: accelerating + coast.elapsed};
  }
  if (result.landed) {
    const remaining = Math.max(0, dt - result.elapsed);
    run.landing = {time: run.time - remaining, speed: result.impact};
    run.events.push('land');
    run.diving = false;
    // A late press belongs to the next takeoff, regardless of leap height.
    if (run.jumpBuffer > result.elapsed) {
      jump(run);
      fall(run, jumpGravity(run), remaining);
    } else {
      tickSlide(run, remaining);
    }
  }
  run.jumpBuffer = Math.max(0, run.jumpBuffer - dt);
}

function tickSlide(run, dt) {
  const before = run.slide;
  run.slide = Math.max(0, before - dt);
  if (before > 0 && run.slide === 0) run.slideExpiredAt = run.time - Math.max(0, dt - before);
}
