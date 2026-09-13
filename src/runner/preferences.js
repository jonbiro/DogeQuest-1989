export function preferencesFrom(value, systemReducedMotion=false) {
  return {
    tiltSensitivity:['gentle','balanced','steady'].includes(value?.tiltSensitivity)?value.tiltSensitivity:'balanced',
    sound:typeof value?.sound === "boolean" ? value.sound : false,
    swipeOnly:typeof value?.swipeOnly === "boolean" ? value.swipeOnly : false,
    reducedMotion:typeof value?.reducedMotion === "boolean" ? value.reducedMotion : !!systemReducedMotion,
  };
}
