const OVERHEAD = new Set(['arch', 'branch', 'gate', 'choice-left', 'choice-right', 'zipline-start', 'zipline-end']);

// Passed overhead meshes must not travel through the chase camera. Keep their
// simulation objects alive for collision/reward accounting; only hide the view.
export function objectVisible(object, distance) {
  return !object.used && !(OVERHEAD.has(object.type) && object.at < distance - 1.2);
}
