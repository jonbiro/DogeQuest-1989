// Time-based hysteresis: brief hitches cannot blur the game, and recovery must
// be sustained before spending the extra pixels again. No geometry is rebuilt.
export function createQualityController(deviceRatio = 1) {
  const preferred = Number.isFinite(deviceRatio) ? Math.max(1, Math.min(1.5, deviceRatio)) : 1;
  let ratio = preferred, slow = 0, stable = 0, cooldown = 0;
  let recoveryWait=20,testingRecovery=false,highStable=0;
  return {
    get ratio() { return ratio; },
    sample(dt, playing = true) {
      if (!playing || !Number.isFinite(dt) || dt <= 0 || dt > .25) {
        slow = stable = highStable = 0;
        return null;
      }
      cooldown = Math.max(0, cooldown - dt);
      if(testingRecovery&&ratio>1){
        highStable=dt<=.020?highStable+dt:0;
        if(highStable>=30){testingRecovery=false;recoveryWait=20;}
      }
      if (cooldown > 0 || preferred === 1) return null;
      slow = dt > .025 ? slow + dt : Math.max(0, slow - dt * 2);
      stable = dt <= .020 ? stable + dt : 0;
      if (ratio > 1 && slow >= 3) {
        if(testingRecovery)recoveryWait=Math.min(120,recoveryWait*2);
        ratio=1;testingRecovery=false;highStable=0;
      }
      else if (ratio === 1 && stable >= recoveryWait) {
        ratio=preferred;testingRecovery=true;highStable=0;
      }
      else return null;
      slow = stable = 0;
      cooldown = 5;
      return ratio;
    },
  };
}
