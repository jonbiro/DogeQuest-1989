const OVERHEAD = new Set(['arch', 'branch', 'gate', 'choice-left', 'choice-right', 'zipline-start', 'zipline-end']);
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
