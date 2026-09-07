// Cosmetic motion only: never feeds back into the collision simulation.
export function puppyPose(time,distance,{menu=false,reducedMotion=false,airborne=false,sliding=false,ziplining=false}={}) {
  const phase=time%4.7;
  const blink=reducedMotion?1:phase<.16 ? .12+.88*Math.abs(phase-.08)/.08 : 1;
  return {
    blink,
    breathe:menu&&!reducedMotion?Math.sin(time*2.2)*.015:0,
    ears:reducedMotion?0:Math.sin(menu?time*2.4:distance*.82)* (menu?.04:airborne?.08:.17),
    tail:reducedMotion?0:Math.sin(time*(menu?5:9))*(menu?.2:.32),
    cape:reducedMotion?0:Math.sin(time*10)*.07,
    // Renderer order: left front, left rear, right front, right rear.
    legs:[0,1,2,3].map(i=>menu?0:ziplining?(i%2===0?-2.65:.25):airborne?(i%2===0?-.65:.5):sliding?-.9:Math.sin(distance*.82+(i===0||i===3?0:Math.PI))*.7),
  };
}
export function smoothLegAngles(current,target,dt) {
  const weight=1-Math.exp(-24*Math.max(0,dt));
  return target.map((angle,index)=>current[index]+(angle-current[index])*weight);
}
