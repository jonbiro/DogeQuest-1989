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

## Remaining checks

A second 22-second run using the reusable `uiPlayCheck()` at 1280×800 with decorative motion enabled reached 558 meters, saw and selected Challenge, and retained all three hearts. It recorded 1,322 frames, 16.65 ms mean and 16.70 ms p95 intervals. This strengthens desktop real-time coverage but is not a worst-case or device-wide guarantee.

Real-time touch-driven runs, broad viewport checks, sustained frame-time profiling, audio listening checks, storage/context recovery flows and real-time route-choice UI interaction remain to be verified. Do not treat the narrower soak above as proof of these gates.
