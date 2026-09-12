// Time-based hysteresis: brief hitches cannot blur the game, and recovery must
// be sustained before spending the extra pixels again. No geometry is rebuilt.
export function createQualityController(deviceRatio = 1) {
  const preferred = Number.isFinite(deviceRatio) ? Math.max(1, Math.min(1.5, deviceRatio)) : 1;
  let ratio = preferred, slow = 0, stable = 0, cooldown = 0;
  return {
    get ratio() { return ratio; },
    sample(dt, playing = true) {
      if (!playing || !Number.isFinite(dt) || dt <= 0 || dt > .25) {
        slow = stable = 0;
        return null;
      }
      cooldown = Math.max(0, cooldown - dt);
      if (cooldown > 0 || preferred === 1) return null;
      slow = dt > .025 ? slow + dt : Math.max(0, slow - dt * 2);
      stable = dt <= .020 ? stable + dt : 0;
      if (ratio > 1 && slow >= 3) ratio = 1;
      else if (ratio === 1 && stable >= 20) ratio = preferred;
      else return null;
      slow = stable = 0;
      cooldown = 5;
      return ratio;
    },
  };
}
