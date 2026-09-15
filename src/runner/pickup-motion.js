// Cosmetic sway is optional; collection trajectories remain readable in both
// modes because they communicate where a magnet is taking the collectible.
export function pickupYaw(type,time,reducedMotion){
  return reducedMotion?0:Math.sin(time*(type==='bone'?1.8:1.5))*.25;
}

// A small, deterministic breathing beat keeps powerups alive on the trail.
// The pulse is deliberately restrained: it should make a magnet, shield or
// gift catch the eye without turning the pickup lane into a flashing hazard.
// Stable ids give neighbouring pickups different phases while preserving the
// same result in replay, practice and reduced-motion screenshots.
export function pickupPulse(type, time, id = 0, reducedMotion = false) {
  if (reducedMotion) return 1;
  const cadence = type === 'gift' ? 3.2 : 3.8;
  const amount = type === 'gem' ? .055 : .07;
  return 1 + Math.sin(time * cadence + Number(id || 0) * .61) * amount;
}
