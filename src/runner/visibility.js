import {OVERHEAD_HAZARDS} from './hazard-cast.js';

const OVERHEAD = new Set([...OVERHEAD_HAZARDS, 'choice-left', 'choice-right', 'corner-left', 'corner-right', 'zipline-start', 'zipline-end', 'minecart-start', 'minecart-end', 'ski-start', 'ski-end', 'ski-gate']);
// The camera's fog ends at 145 m. Keep a small margin for approach silhouettes
// while avoiding allocation and shadow work for objects hidden in the haze.
export const OBJECT_HORIZON = 140;

// Passed overhead meshes must not travel through the chase camera. Keep their
// simulation objects alive for collision/reward accounting; only hide the view.
export function objectVisible(object, distance) {
  return !object.used && object.at - distance <= OBJECT_HORIZON &&
    !(OVERHEAD.has(object.type) && object.at < distance - 1.2);
}

// The overhead instruction is useful on approach, but obscures the rising dog
// inside the catch window. Keep the station, grips and cable intact.
export function ziplineSignVisible(object, distance) {
  return !object.caught && object.at-distance >= 3;
}

// The start gantry's centre support is useful as a distant landmark, but it
// sits exactly in the transparent opening of the hanging painting at the
// catch point. Fade it before the dog reaches the final approach so the
// action silhouette stays clean without changing the station or cable.
export function ziplineSpineOpacity(object, distance, {ziplining = false} = {}) {
  if (ziplining) return 0;
  const approach = object.at - distance;
  return Math.max(0, Math.min(1, (approach - 8) / 12));
}

export function ziplineSpineVisible(object, distance, {ziplining = false} = {}) {
  return ziplineSpineOpacity(object, distance, {ziplining}) > 0;
}
