export const RESUME_DURATION = .9;

// Integrate the time scale exactly so recovery feels the same at 30/60/120 Hz.
// Start at 15% speed and ease to full speed with zero slope at either end.
const integral = t => .15 * t + .85 * (t * t * t - .5 * t * t * t * t);
export function resumeStep(run, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return 0;
  if (!(run.resumeRemaining > 0)) return dt;
  const remaining = Math.min(RESUME_DURATION, run.resumeRemaining);
  const portion = Math.min(dt, remaining);
  const from = 1 - remaining / RESUME_DURATION;
  const to = from + portion / RESUME_DURATION;
  run.resumeRemaining = Math.max(0, remaining - dt);
  return RESUME_DURATION * (integral(to) - integral(from)) + dt - portion;
}
