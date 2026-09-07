export function preferencesFrom(value, systemReducedMotion=false) {
  return {
    sound:typeof value?.sound === "boolean" ? value.sound : false,
    reducedMotion:typeof value?.reducedMotion === "boolean" ? value.reducedMotion : !!systemReducedMotion,
  };
}
