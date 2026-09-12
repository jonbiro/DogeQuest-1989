// A ground-attached field, independent of the dog's jump and body lean.
// Contract each pulse toward the collector, matching the bones' motion.
export function magnetPulse(time,index,reducedMotion=false){
  const phase=reducedMotion?index/3:((time*.7+index/3)%1+1)%1;
  return {scale:2.8-phase*1.8,opacity:reducedMotion?.32:.65*Math.sin(Math.PI*phase)};
}
