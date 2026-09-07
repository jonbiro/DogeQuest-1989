# Runner verification

## Automated checks

Run `npm run check` for production build, artifact validation, lint and simulation/unit regressions.

## Local real-renderer soak

With the development server running, bundle the local-only fixture:

```sh
npx esbuild scripts/runner-visual-qa.js --bundle --format=esm --outfile=dist/runner/qa.js
```

Open the local `/runner/` page in an isolated browser session and evaluate:

```js
import('/runner/qa.js').then(m => m.longRunCheck())
```

The fixture runs three seeded 4,500-meter simulations using normal lane/jump/slide actions, without invulnerability or position overrides. It renders every 250 meters with the production renderer, reuses that renderer across run restarts, changes puppies/outfits, and includes a reduced-motion run. It throws on premature game-over or resource-budget regression. This is accelerated simulation with rendered checkpoints, not a real-time FPS or physical-phone test. The normal production build removes the fixture bundle.

Latest local result with deliberate Scenic and Challenge gate selections: 3 runs completed, 54 rendered checkpoints, minimum 3 hearts; peaks of 11 geometries, 2 textures, 108 active-plus-pooled objects and 137 draw calls. Final sample: 11 geometries, 2 textures, 9 active objects and 99 pooled objects. No browser errors were reported.

## Settings migration and reload

Unit tests cover absent/malformed preferences, sound opt-in, system reduced-motion defaults and explicit player overrides. In an isolated browser, sound-on persisted across reload; reduced motion was toggled off and on, reloaded each time, and both its pressed state and visible label matched the saved value.

## Audio and release assets

`audioCheck()` in the local fixture renders all five cues with a real browser OfflineAudioContext and rejects silent, invalid or excessive output. Latest peaks ranged from 0.0334 to 0.0348, with nonzero RMS for every cue. Unit tests verify the 12-voice cap, immediate mute stop calls and node disconnection. This is output validation, not a physical-speaker listening check.

The build bundles runner CSS and adds content-derived revision queries to both the stylesheet and game script. Artifact verification recomputes both hashes and rejects stale HTML references or unbundled CSS imports. The local browser loaded both versioned assets and reached the playable state without errors.

## Real-time UI and compact layouts

A 22-second browser run driven by visible prompts reached 547 meters, saw the route gates and selected Challenge. At a measured 500×481 desktop-browser viewport it recorded 1,321 animation frames, 16.66 ms mean and 16.70 ms p95 frame intervals, with two hearts remaining. This is one desktop-browser sample, not a physical-phone or worst-case performance guarantee. A prior attempt lost its page and is excluded. `uiPlayCheck()` provides a reusable local-only version of the prompt-driven check, without reading or modifying simulation state.

A real pointer drag moved the puppy to lane 3; the on-screen Slide button changed posture after resuming. Distance remained 110 meters across a 750 ms paused interval. Compact portrait (320×568) inspection found overlapping footer/stats and buttons over the puppy; a dedicated compact layout corrected both. Landscape (568×320) inspection found a 340-pixel game area; it now fits 320 pixels, with controls ending at 298 pixels and the motion toggle available. Screenshots were inspected after both fixes.

A second 22-second run using the reusable `uiPlayCheck()` at 1280×800 with decorative motion enabled reached 558 meters, saw and selected Challenge, and retained all three hearts. It recorded 1,322 frames, 16.65 ms mean and 16.70 ms p95 intervals. This strengthens desktop real-time coverage but is not a worst-case or device-wide guarantee.

## Graphics and storage recovery

Actual `WEBGL_lose_context` loss was triggered at camp and during a run. Both displayed the dedicated recovery dialog. During-run distance stayed at 8 meters over a 750 ms interval and serialized saved progress was unchanged. Reload returned to a playable menu. Initial WebGL creation failure was also injected: Play remained disabled, the recovery dialog appeared, Tab focused its fallback link, and that link opened the 2D Puppy Quest.

Generate local fault pages with `node scripts/prepare-recovery-qa.js` after building. Use `/runner/recovery?fault=graphics` or `/runner/recovery?fault=storage`; the local server's `.html` redirect drops the query, so that form must not be used. Fault-mode presence was verified before accepting results.

With storage reads and writes blocked, equipping Mochi and starting/pausing still worked, while the session-only warning remained visible after menu refresh and on pause. Unit tests distinguish unavailable storage from malformed/absent saves, test quota failure and prevent overwriting progress that could not be read at startup. Normal builds remove the fault pages, and artifact verification rejects them if accidentally retained.

## Remaining checks

Broader device/viewport coverage, longer worst-case frame-time profiling and physical-speaker listening checks remain unverified. The real-time runs, pointer tests, route-choice interactions and injected recovery tests above prove only their stated scope.
# Alternating obstacle sequences

- Added deterministic coverage for both three-beat patterns, full-width rows, gift placement, Scenic exclusion and gate approach clearance.
- Input-driven simulation clears both patterns at 36 m/s with base and level-three leap, retaining three hearts and collecting the finish gift.
- `npm run check`: 60 tests pass, build, artifact verification and lint pass.
- Browser real-renderer accelerated check after this change: three 4,500-meter runs, 54 rendered checkpoints, minimum three hearts; peak 11 geometries, two textures, 113 active-plus-pooled objects and 140 draw calls. This is not a real-time frame-rate measurement or physical-phone validation.
# Wooden river crossings

- Real-time 390×844 browser run used visible prompts and keyboard events for 22 seconds: reached 547 meters across the first bridge, selected Challenge, retained three hearts; 1,321 frames, mean 16.67 ms and p95 16.70 ms. This is desktop browser emulation, not a physical phone.
- Grid-aligned deck boundaries and 20 repeating cycles covered by unit tests; full check passes 61 tests plus build, lint and artifact checks.
- Real-renderer 390×844 screenshots inspected at the entrance and on the deck: continuous paving-to-plank transition, readable rope rails and unobstructed obstacle silhouettes.
- Accelerated browser check: three 4,500-meter runs, 54 checkpoints, minimum three hearts. Peaks: 11 geometries, two textures, 113 active-plus-pooled objects, 137 draw calls. Rendering remains batched; no physical-phone performance claim.
# Sky Paws zipline traversal

- Final real-time 390×844 check used visible prompts and keyboard input: 34 seconds, 907 meters, three hearts, Challenge selected, zipline caught and landed. 2,042 frames, mean 16.66 ms, p95 16.70 ms. This is desktop browser emulation, not a physical phone.
- Directly awaiting a 34-second browser evaluation caused the automation client to retry the test and overlap runs. Those interrupted attempts are excluded. The passing check was started once with an immediate return and its stored result read separately; `startUiPlayCheck()` / `readUiPlayCheck()` now provide that reusable pattern.
- Full `npm run check` passes 67 tests, build, lint and artifact checks.
- Simulation covers exact schedule, clear approach/landing and aerial prize generation; catches from all lanes at early/middle/late jump inputs, base/max leap, ordinary/capped/Zoomies speeds; continuous vertical motion, input lock for jump/slide while retaining steering, automatic release and one-time rewards.
- Missed catches retain three hearts; ground magnets cannot take airborne rewards. Real lane inputs collect all 18 bones and the gift without a magnet. Magnet + double-point interaction retains normal timer behavior and yields 900 bone points.
- The local real-renderer fixture uses actual jump and steering inputs to enter the ride, rather than setting the riding state. Phone-sized inspection caught decorative archway interference; those decorations are now hidden within the cable interval.
- Updated three × 4,500-meter browser simulation completes nine ziplines with minimum three hearts, 54 rendered checkpoints and peaks of 11 geometries, two textures, 111 active-plus-pooled objects and 133 draw calls. This is accelerated checkpoint rendering, not real-time performance.
