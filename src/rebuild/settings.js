// Tiny persisted preferences for the 2D game: sound on/off and the OS
// reduced-motion signal. Everything is injected so the logic stays testable
// without a DOM; storage failures always fall back to safe defaults.
export const SETTINGS_KEY = "puppy-quest-settings";

export function loadSoundPreference(storage) {
  try {
    const raw = storage?.getItem?.(SETTINGS_KEY);
    if (raw == null) return true;
    return JSON.parse(raw)?.sound !== false;
  } catch {
    return true;
  }
}

export function saveSoundPreference(storage, sound) {
  try {
    if (typeof storage?.setItem !== "function") return false;
    storage.setItem(SETTINGS_KEY, JSON.stringify({sound: Boolean(sound)}));
    return true;
  } catch {
    return false;
  }
}

export function prefersReducedMotion(matchMediaFn) {
  try {
    return matchMediaFn?.("(prefers-reduced-motion: reduce)")?.matches === true;
  } catch {
    return false;
  }
}
