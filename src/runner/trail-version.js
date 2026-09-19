export const CURRENT_TRAIL_VERSION = 5;
// Keep historical versions explicit when advancing CURRENT_TRAIL_VERSION.
// Sharing, parsing and run creation must agree on the same compatibility set.
// v6 verbs (climb/glide/wade/rail/true fork) are implemented and tested
// opt-in; CURRENT stays 5 until the full 4500m renderer + device QA gate
// passes, so default streams remain byte-identical.
export const SUPPORTED_TRAIL_VERSIONS = Object.freeze([1,2,3,4,5,6]);
export const supportsTrailVersion = value => SUPPORTED_TRAIL_VERSIONS.includes(value);
