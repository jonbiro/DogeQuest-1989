export const CURRENT_TRAIL_VERSION = 6;
// Keep historical versions explicit when advancing CURRENT_TRAIL_VERSION.
// Sharing, parsing and run creation must agree on the same compatibility set.
// v6 adds climb/glide verbs, wade stones, rail logs, true-fork metadata,
// denser late pacing and reservation/quiescence guarantees. Minecart and ski
// keep their established debuts so position-based boarding and generation
// stay in lockstep. v1-v5 streams stay byte-identical.
export const SUPPORTED_TRAIL_VERSIONS = Object.freeze([1,2,3,4,5,6]);
export const supportsTrailVersion = value => SUPPORTED_TRAIL_VERSIONS.includes(value);
