// Cosmetic sway is optional; collection trajectories remain readable in both
// modes because they communicate where a magnet is taking the collectible.
export function pickupYaw(type,time,reducedMotion){
  return reducedMotion?0:Math.sin(time*(type==='bone'?1.8:1.5))*.25;
}
