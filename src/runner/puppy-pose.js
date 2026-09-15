// Cosmetic motion only: never feeds back into the collision simulation.
export function puppyPose(time,distance,{menu=false,reducedMotion=false,airborne=false,sliding=false,ziplining=false,rafting=false}={}) {
  const phase=time%4.7;
  const blink=reducedMotion?1:phase<.16 ? .12+.88*Math.abs(phase-.08)/.08 : 1;
  return {
    blink,
    breathe:menu&&!reducedMotion?Math.sin(time*2.2)*.015:0,
    ears:reducedMotion?0:Math.sin(menu?time*2.4:distance*.82)* (menu?.04:airborne?.08:.17),
    tail:reducedMotion?0:Math.sin(time*(menu?5:9))*(menu?.2:.32),
    cape:reducedMotion?0:Math.sin(time*10)*.07,
    // Renderer order: left front, left rear, right front, right rear.
    legs:[0,1,2,3].map(i=>menu?0:rafting?(i%2===0?-.15:.18):ziplining?(i%2===0?-2.65:.25):airborne?(i%2===0?-.65:.5):sliding?-.9:Math.sin(distance*.82+(i===0||i===3?0:Math.PI))*.7),
  };
}
export function smoothLegAngles(current,target,dt) {
  const weight=1-Math.exp(-24*Math.max(0,dt));
  return target.map((angle,index)=>current[index]+(angle-current[index])*weight);
}

// Lower the torso and fold the legs instead of flattening Mochi's whole body.
// The blend comes from the existing visual transition, never collision timing.
export function mochiCrouch(blend) {
  const amount=Math.max(0,Math.min(1,Number.isFinite(blend)?blend:0));
  return {amount,scaleY:1-.35*amount,scaleZ:1+.08*amount,lowering:.24*amount,
    legs:[-1.3,1.05,-1.3,1.05]};
}

// Weight cues are driven by real velocity and touchdown, not a looping bounce.
// They remain cosmetic, bounded and frozen when simulation time is paused.
export function bodyMotion({vx=0,vy=0,y=0,time=0,landing=null,ziplining=false,reducedMotion=false}={}) {
  if(reducedMotion)return {lean:0,pitch:0,compression:0};
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const age=landing?time-landing.time:Infinity;
  const compression=y<.05&&!ziplining&&age>=0&&age<.28
    ? Math.sin(Math.PI*age/.28)*Math.exp(-10*age)*clamp(landing.speed/22,0,1)*.22 : 0;
  return {lean:clamp(-vx*.012,-.23,.23),pitch:ziplining?0:clamp(vy*.011,-.16,.14),compression};
}

// Tiny, low-contrast puffs sell paw contact without turning the trail into a
// particle storm. They are cosmetic positions consumed by the renderer's
// existing recycled flash batch; the simulation never sees them. Returning
// four bounded puffs instead of allocating sprites per footfall keeps this
// readable on phones while giving the full-body paintings a little life.
export function pawDust(time,{reducedMotion=false,airborne=false,sliding=false,ride=false}={}) {
  if(reducedMotion||airborne||sliding||ride||!Number.isFinite(time))return [];
  const phase=time*8.4;
  return [0,1,2,3].map(index=>{
    const side=index%2===0?-1:1;
    const footPhase=phase+(index<2?0:Math.PI)+index*.42;
    const contact=(Math.sin(footPhase)+1)/2;
    return {
      x:side*(.17+contact*.045),
      y:.035+contact*.012,
      z:.18+index*.07,
      // Small puffs expand as the foot leaves the ground, then settle back
      // into the next step. The minimum keeps a quiet trace between beats.
      scale:.018+.026*contact,
    };
  });
}
