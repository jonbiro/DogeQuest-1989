export const CURRENT_TRAIL_VERSION = 4;
// Keep historical versions explicit when advancing CURRENT_TRAIL_VERSION.
// Sharing, parsing and run creation must agree on the same compatibility set.
export const SUPPORTED_TRAIL_VERSIONS = Object.freeze([1,2,3,4]);
export const supportsTrailVersion = value => SUPPORTED_TRAIL_VERSIONS.includes(value);
