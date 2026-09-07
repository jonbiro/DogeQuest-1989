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
# Integrated gameplay, rewards and dialog navigation

- After the HUD repair, the 320×568 real-time check ran 34 seconds to 907 meters with three hearts, all three regions, Challenge and a completed zipline, with no observed HUD overlap. It recorded 2,041 frames, mean 16.66 ms and p95 16.70 ms. The five-indicator stress case also passed at 320×568, 390×844, 568×320 and 844×390, with no tested overlap or offscreen HUD element.
- A second 60-second 320×568 run reached 1,821 meters with three hearts and all regions, but recorded power/cue overlap. That observation led to compact portrait power cards and a short-landscape power row; it is not counted as a clean layout pass. A five-indicator UI-only stress case (including the longest zipline cue and gate directions) reproduced overflow and overlap at 568×320 before the fix. It does not simulate earning those powers.
- A fresh, naturally ended 320×568 run verified the repaired results dialog: primary action at y=411–467 and Back to camp at y=475–519, both hit-testable while long content scrolls. The second mission paid its 350-point reward; already-claimed prizes were not awarded again.
- A 60-second real-time run at 844×390 with decorative motion enabled reached 1,821 meters, observed all three named regions, selected Challenge and caught/completed the zipline. It retained three hearts; 3,602 frames, mean 16.66 ms and p95 16.70 ms. Runtime bounds checks found no overlap among power chips, action cue, mission panel and controls in the states encountered. This does not prove every possible power combination or physical-device performance.
- Continuing that run without further movement input ended naturally at 2,311 meters: 6,146 score, 75 bones and two gifts. From a zero-credit profile, the result banked exactly 7,196 credits (score + 250 mission + 800 prize points) and unlocked the royal crown. Buying the explorer outfit, first leap upgrade and Pepper consumed 700 + 500 + 1,500 credits, leaving 4,496. Reload preserved ownership, selected Pepper/crown, upgrade level and balance. The equipped spotted puppy and crown were visually inspected.
- Long results copy exposed a clipped Back to camp action in landscape. Dialogs now have one scrolling content region and a separate, always-visible action area. Help/clubhouse checks at 568×320, 844×390 and 320×568 verified both actions are within the viewport and receive pointer hits; long lists can be scrolled without moving those actions offscreen. Browser automation explicitly centered deeply nested shop items before clicking and verified the saved outcome, rather than treating a click acknowledgment as purchase evidence.
- The local fixture now records visited regions and HUD overlaps, and `dialogLayoutCheck()` rejects clipped/covered action buttons.
# Puppy pose transitions

- Corrected airborne leg pairing to match the renderer's left-front, left-rear, right-front, right-rear ordering. Running, jumping, sliding and zipline targets now blend with time-based exponential easing; collision physics are unchanged.
- 69 tests pass, including front/rear symmetry, bounded transitions, zero-time stability and equivalent 30/120 Hz transition results.
- Real-renderer phone-sized jump and reduced-motion zipline screenshots inspected. `posePauseCheck()` verified identical leg angles over 60 paused draw calls and continued easing after resume.
# Incomplete collection recovery

- Claimed costume prizes now restore missing outfit entries during save normalization, without replaying points, changing the supplied object, or unlocking unknown/unclaimed prizes. Repeated normalization is idempotent; 71 tests pass.
- An isolated browser loaded a deliberately incomplete test save: 200 credits, claimed crown/party prizes, but only the scarf in its outfit list. The crown was restored as equipped; the party outfit could be equipped. Reload retained both restored outfits and the party selection, with credits still exactly 200. This verifies recovery, not natural prize earning (covered separately above).
# Keyboard dialog navigation

- Escape now dismisses Help, Upgrades and Clubhouse to their opener buttons. Held/repeating Escape is ignored, preventing repeated pause/resume toggles. Graphics recovery and results behavior are unchanged.
- Browser `keyboardCheck()` verified all three opener-focus returns, ten repeated Escape events while paused, normal resume with trail focus, and ten repeated events while playing. Native browser Shift+Tab from the first available clubhouse selection wrapped to Back to camp; Tab wrapped back to that selection. No browser errors.

# Stronger bends and escalating trail pressure

- Opening and later centerline bends are stronger while remaining continuous and tangent-aligned at the puppy. Ordinary late rows block two lanes and change the escape lane; spacing tightens gradually without reducing full-width action spacing. Scenic retains its gentler generation.
- All 73 tests pass, including opening-bend visibility, smooth route transitions, 100 seeded late-row checks and existing input-driven survival, jump, slide and zipline coverage.
- Accelerated browser simulation: three 4,500-meter runs, 54 rendered checkpoints, minimum three hearts and nine completed ziplines. Peaks: 11 geometries, two textures, 117 active-plus-pooled objects and 164 draw calls. This is not real-time frame profiling.
- Release `3921be8` passed CI and Pages deployment. Live HTML loaded the matching `15fe054f6c505a4f` game revision; Play, jump input and Escape reached a paused run at 17 meters without browser errors.
- Updated 60-second, 390×844 prompt-driven run with reduced motion: 1,886 meters, three hearts, all three regions, Challenge selected, zipline caught and landed, no detected HUD overlap. 3,602 frames, mean 16.66 ms and p95 16.80 ms. Desktop-browser viewport emulation, not physical-phone validation.
- Updated 120-second, 320×568 prompt-driven run with full decorative animation enabled (`aria-pressed=false` on Less motion): 4,046 meters, three hearts, all three regions, Challenge selected, zipline caught and landed, no detected HUD overlap or browser errors. 7,202 frames, mean 16.66 ms and p95 16.70 ms. This is a real-time desktop-browser sample, not a worst-case guarantee across devices.

# Full wardrobe rendering matrix

- Inspected all six outfits on each of Biscuit, Mochi, Pepper and Luna in four 1080×800 browser galleries, using the production renderer. Before each target appearance, the same renderer drew a contrasting puppy in the party outfit, exercising palette, ear, spot and accessory reset paths.
- All 24 combinations showed the expected puppy identity and distinct scarf, explorer hat, cape, raincoat, crown or party hat, with no visible accessory carryover. Each gallery retained five geometries and two textures; final draw calls ranged from 33 to 38.
- `wardrobePreview()` is a local-only visual fixture, not evidence of natural earning or purchase flows. Those have separate checks above. The production build excludes this fixture.

# Prize cabinet progress

- Cabinet rewards now show labeled progress meters and exact counts. Best-run bones are tracked separately from lifetime bones; banked gifts and best distance use their existing records. Already-claimed prizes always display complete, including older saves without the new bone record.
- All 75 tests pass. New tests distinguish lifetime totals from single-run records, cap progress, preserve earned state and confirm that display calculation does not grant prizes.
- At 320×568 the cabinet's bottom meters and both main actions were visually inspected. A separate injected browser save with 900 lifetime bones, 23 best-run bones, 450 meters and two gifts reloaded to meter values 300/300, 23/50, 450/1000 and 2/3. This is save-loading/display evidence, not a natural earning test.
