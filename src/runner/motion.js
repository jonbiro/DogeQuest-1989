// Motion uses meters and seconds. Exact spring/ballistic integration keeps
// steering and jump timing consistent across the supported simulation steps.
export const GRAVITY = 22;
export const JUMP_BUFFER = .18;
const LANE_SPRING = 26, DIVE_GRAVITY = 180, DIVE_TERMINAL = 28;

export function jump(run) {
  run.slide = 0;
  run.diving = false;
  run.jumpBuffer = 0;
  run.vy = 12.5 * (1 + run.upgrades.leap * .08);
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
  if (endY > 0) {
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
    run.slide = Math.max(0, run.slide - dt);
    run.jumpBuffer = Math.max(0, run.jumpBuffer - dt);
    return;
  }
  const gravity = run.diving ? DIVE_GRAVITY : GRAVITY;
  const accelerating = run.diving ? Math.min(dt, Math.max(0, (run.vy + DIVE_TERMINAL) / gravity)) : dt;
  let result = fall(run, gravity, accelerating);
  if (!result.landed && accelerating < dt) {
    const coast = fall(run, 0, dt - accelerating);
    result = {...coast, elapsed: accelerating + coast.elapsed};
  }
  if (result.landed) {
    const remaining = Math.max(0, dt - result.elapsed);
    run.landing = {time: run.time - remaining, speed: result.impact};
    run.diving = false;
    // A late press belongs to the next takeoff, regardless of leap height.
    if (run.jumpBuffer > result.elapsed) {
      jump(run);
      fall(run, GRAVITY, remaining);
    } else {
      run.slide = Math.max(0, run.slide - remaining);
    }
  }
  run.jumpBuffer = Math.max(0, run.jumpBuffer - dt);
}
