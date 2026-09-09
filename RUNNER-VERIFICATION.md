# Runner verification

## Input and feedback follow-up (2026-09-08)

- Gameplay release `010826b`, acceptance helper `8d6ac1d`: 149 tests pass.
  The helper now requires at least one actual Fetch activation, in addition
  to distance, turns, regions, zipline completion, hearts and trusted inputs.
- Live 1280x720 run: 1,102m, three hearts, two turns, all three regions,
  zipline caught and landed, two Fetch activations, 54 trusted/zero synthetic
  key events and no checked HUD overlaps.
- Live 320x568 browser-emulated layout: 1,105m, three hearts, two turns,
  all regions, complete zipline, two Fetch activations, 50 trusted/zero
  synthetic keys and no checked HUD overlaps. This is not physical touch QA.
- Local browser pointer check on `a4be957`: a 600ms held contact released
  without jumping while still playing; a following quick tap produced jump.
  Unit tests also cover secondary buttons, unrelated pointers and diagonal
  out-and-back drags. These mouse inputs do not establish phone usability.
- Local browser sound check on `dbc31b8`: enabled slide created a voice;
  mute suspended the audio context, and an isolated muted jump/slide sequence
  created zero voices. Temporary instrumentation was removed.
- All seven cues, including slide and Fetch-ready, rendered finite, nonzero
  offline browser audio below the established peak limit. Readiness tests
  cover one chime per usable transition and waiting for magnet expiry.
  This verifies generated audio, not subjective listening quality.
- Gameplay assets for `010826b` matched live HTML, JavaScript and CSS bytes.
  CI and Pages for acceptance-only `8d6ac1d` both succeeded
  (34294609456 / 34294609508). No gameplay files changed in that commit.

## Contrast and scenery decluttering follow-up

- Noninteractive scenery sits 25% farther from the lane center; roughly one
  third of nongateway decoration groups are omitted. Hazards, route markers,
  rewards and collision geometry are unchanged.
- Score, bones, mission and touch controls have darker backings; hearts have
  a dark edge shadow. Removed control backdrop blur for a cleaner silhouette.
- All 134 tests, lint, build and distribution checks passed. Inspected the
  running HUD at 390x844 and all three regional previews. Worst-case HUD
  checks at 320x568 and 844x390 reported no overlaps or out-of-bounds controls.
- Three seeded 4,500m runs retained all hearts, completed 21 turns and nine
  ziplines, and exercised 13 split rows. Renderer peaks: 15 geometries, four
  textures, 121 objects and 197 draw calls. An input-driven 40-second local
  run also retained all hearts and caught/landed the zipline. These are desktop
  browser checks, not physical-phone verification.

## In-run visual readability

- Bones are 30% larger with a saturated gold, shaded material and bounded
  quarter-radian sway instead of full spins that turn them edge-on. No change
  to pickup reach, collisions, jump/slide timing or saved progress.
- Solid logs/rocks have darker bodies against the pale road. Overhead arches
  and gates use deep teal frames and bright mint clearance strips; branches
  share the mint strip. Actual obstacle shapes still distinguish actions, so
  the distinction does not depend on color alone.
- Hazard crystals are saturated purple/teal rather than pale scenery-like
  colors. Noninteractive decorative gateways are hidden during runs, leaving
  actual slide gates and route-choice markers intact. Camp decoration remains.
- Split-decision and three-region renderer previews were inspected at phone
  aspect ratios. All 134 tests pass. Three 4,500m renderer runs retained three
  hearts, with 21 turns, nine ziplines and 13 split rows. Peaks remain bounded:
  15 geometries, four textures, 121 objects and 203 draw calls.
- Full-motion 60-second 390x844 browser run: 1,821m, three hearts, all regions,
  three correct turns, zipline catch/landing, no HUD overlaps or browser errors.
  Mean frame interval 16.66ms and p95 16.70ms. These are desktop-browser results,
  not a physical-device performance guarantee.

## Split-decision obstacle rows

- Later ordinary/Challenge action rows periodically offer one slide-under gate
  beside two jumpable logs. The gate lane varies using the seeded route choice.
  Introduction is after 800m; Scenic, full-width gaps and authored courses keep
  their existing patterns. Full action-row spacing (at least 42m) is retained.
- All 134 tests pass. New checks cover row composition, Scenic/opening exclusion,
  reward preservation and recovery distance; every lane's correct cue/action at
  22/36/46.8m/s; wrong-action damage with no free clear. The seeded-row invariant
  now explicitly validates mixed rows instead of assuming uniform obstacle type.
- Long-run QA now reads the obstacle in the occupied lane when an action row
  has no open lane. Three seeded 4,500m runs encountered 13 split rows, completed
  21 turns and nine ziplines, and retained three hearts throughout. At 54 renderer
  checkpoints: peaks 15 geometries, four textures, 121 objects, 197 draw calls.
- The real-renderer split-row fixture was inspected at 390x844 with Mochi:
  low logs and overhead gate are distinct, with no new model or texture budget.
- Input-driven 60-second 390x844 playtest: 1,821m, three hearts, all regions,
  courses 2/1/1, three turns with zero misses, zipline catch/landing, no HUD
  overlaps or browser errors. Mean frame interval 16.66ms, p95 16.80ms. This
  is desktop browser emulation, not a physical-phone performance claim.

## Zipline collection guidance follow-up

- The edge dock now points toward the nearest upcoming aerial bone or gift.
  Choosing the requested lane clears its cue while steering settles. Bone cues
  disappear during magnetic attraction; gift cues remain because gifts require
  physical lane alignment. No mid-screen banner or change to physics/rewards.
- New simulation checks follow only these cues with 150ms input sampling and
  collect all 18 bones plus the gift on both first and later ziplines. Cue tests
  cover reward ordering, immediate quieting, used/pulled pickups, magnets and
  the gift exception. Full suite: 131 tests.
- 40-second 390x844 browser check saw left/right bone and gift guidance, caught
  and landed the zipline, and reached 1,105m with three hearts, two correct turns
  and no HUD overlaps or browser errors. Mean frame interval 16.65ms, p95 16.70ms.
  The subsequent magnet/gift exception has a targeted regression assertion;
  final published build receives a fresh live check.

## Persistent dog bonds and regional passport

- Four dogs each have 10/40/100-clear-plus-turn milestones; three regions each
  have 3/10/25-clean-course stamps. All 21 collectibles are persistent, with
  one-time rewards in existing upgrade points. The chosen dog is captured at
  run start, not inferred from the later equipped dog. No stat advantages,
  daily requirements or additional currency. Old saves begin new counters at
  zero without losing existing progress or inventing past achievements.
- Build, artifact checks, lint and all 129 tests pass. Tests cover malformed
  and old saves, isolated dog and regional progress, all tier crossings,
  single payment, unfinished-run rejection, invalid dog IDs, stable banking
  receipts and save roundtrips.
- Local browser used a documented near-threshold fixture: Mochi bond 9,
  regional counts 2/9/24, 123 credits and magnet upgrade 1. A real input-driven
  60-second 390x844 Mochi run reached 1,821m, three clean turns, courses 2/1/1,
  all regions, zipline catch/landing, three hearts, zero HUD overlaps or browser
  errors. 3,602 frames; mean 16.66ms, p95 16.70ms (desktop emulation).
- Continuing without controls ended naturally at 2,235m: 23 clears + 3 turns
  increased Mochi to 35; other dogs remained zero. Regions became 4/10/25.
  Four threshold crossings awarded exactly 1,850 points. Final credits 11,938
  equal prior 123 + score 8,915 + mission 250 + existing prizes 800 + mastery
  1,850. Retry started immediately at zero Fetch charge. Reload preserved all
  counters and the same balance without replaying any milestone reward.
- Final badge UI was inspected at 320x568: seven earned badges, no horizontal
  overflow, scrollable cards and reachable persistent actions. Passport is
  collapsible so dog/outfit selection remains near the top. This section is
  slice evidence, not completion of the entire expanded-goal audit.

## Player-controlled Fetch ability

- Fetch earns 2% per hand-collected bone, 12% per clean obstacle and 20% per
  correct marked turn. At 100%, F or the touch button starts a four-second
  magnet. Active magnets preserve charge; Fetch cannot recharge itself.
  Saves and jump/slide durations are unchanged; charge is run-local.
- Build, artifact checks, lint and all 125 tests pass. Ability tests cover
  charge/cap/single spend, correct skill rewards, assisted-smash exclusion,
  actual side-lane collection, aerial exclusion on the ground, expiry, zipline
  activation, ended-run rejection and fresh retry. An additional simulation
  check confirmed aerial collection while riding.
- Browser run at 390x844: 60 seconds, 1,821 meters, 3,602 frames, mean 16.66ms,
  p95 16.70ms, three hearts, three correct turns, zero missed turns, all regions,
  courses 2/1/1, zipline catch and landing. Three actual Fetch activations used
  alternating keyboard and touch input. No HUD overlaps or browser errors.
- A first layout overlapped the guidance dock; it was replaced before release.
  Final 320x568 layout inspection confirmed five separate controls, each at
  least 48x56 pixels and fully on screen. Desktop emulation, not physical-phone
  performance verification. Persistent mastery remains unfinished.

## Regional courses and pressure/recovery pacing

- Replaced the generic repeated sequence with three authored regional courses:
  jungle log/branch/log timing, canyon gap/log/gap crossings, and glade left/right/
  center slaloms with distinct crystal models. Three beats are spaced 35 meters
  apart, followed by a gift and 30 meters without another hazard. All gap rows
  align to the paving grid. A clean course awards 180 points exactly once.
- Courses stay inside their region, avoid corners/route-decision/zipline
  reservations, and appear at most once per region visit. Scenic skips them.
  Challenge hazard beats remain inside its duration; only the clear recovery
  may extend past it. Jump/slide durations, turn controls and existing saves are
  unchanged. The three regional completion counters are per-run, ready for the
  later persistent mastery work; no persistent mastery is claimed yet.
- All 120 tests pass with build, lint and artifact checks. Coverage includes all
  courses at normal top speed and with Zoomies, base/max leap upgrades, explicit
  slalom lane requirements, failed-course denial, duplicate-award prevention,
  reservations, recovery spacing and guidance priority.
- Final accelerated production-renderer check: three 4,500-meter seeded runs,
  54 checkpoints, 21 clean turns, zero missed turns, nine ziplines, and three
  hearts throughout. Clean courses: 12 jungle, three canyon, three glade. Peaks:
  15 geometries, four textures, 123 pooled-plus-active objects and 197 draw calls.
- The three course entrances were visually inspected through the production
  renderer at a 390×600 camera aspect. This is a local fixture; naturally earned
  course coverage comes from the separate input-driven checks, not the gallery.
- Final 60-second local keyboard-driven 390×844 run with Mochi and full motion:
  1,821 meters, two jungle courses, one canyon course, one glade course, three
  clean turns, zero misses, zipline catch/landing and three hearts. 3,602 frames,
  mean 16.66 ms, p95 16.80 ms, no detected HUD overlap and no browser errors.
  This is desktop browser emulation, not a physical-phone performance claim.

## Research-led adventure: deliberate corners and real terrain

This is the first verified slice of the expanded goal in `ADVENTURE-ROADMAP.md`,
not completion of the remaining traversal, charged-ability and mastery work.

- Marked 90-degree corners share one schedule between simulation and rendering.
  Left/right input commits during a one-second cue window, does not also change
  lanes, and can correct an initially wrong direction. A clean turn awards 100
  points exactly once. Misses cost a heart or shield and recover; Zoomies does
  not turn for the player. Generation reserves clear approaches and exits.
- A cached, true world-space centerline replaces lateral-only bends. Gentle
  hills change road, scenery, obstacle and puppy grade together without changing
  jump airtime or slide duration. Corners and special traversal remain level.
  Geometry tests cover continuity through 280 km, bounded grades and arc length.
- Continuous corner ribbons replace intersecting slabs/rails, including later
  corners on wooden river decks. Terrain banks follow the hills. Overhead meshes
  and decorative archways leave the chase-camera corridor after passing, without
  changing collisions or interrupting magnet pickups.
- One quiet edge cue confirms turns, with a matching control highlight. Results
  show clean turns, clears and best bone streak, plus advice based on the actual
  final mistake. The retry action remains visible in the scrolling result dialog.
- Build, artifact checks, lint and all 118 tests pass. New coverage includes turn
  timing/correction/rewards/damage, reservation safety, route geometry, ribbon
  buffer reuse, wooden corners, visibility and post-run guidance.
- Final accelerated production-renderer check: three 4,500-meter seeded runs,
  54 rendered checkpoints, 21 clean turns, zero missed turns, nine ziplines and
  minimum three hearts. Peaks: 15 geometries, four textures, 108 active-plus-pooled
  objects and 165 draw calls. This is simulation with rendered checkpoints, not FPS.
- A 60-second local keyboard-driven run with Mochi and full motion at 390×844
  reached 1,821 meters, completed three turns with zero misses, visited all three
  regions and caught/landed the zipline. Three hearts remained; 3,601 frames,
  mean 16.66 ms, p95 16.70 ms and no detected HUD overlap. A separate unadapted
  driver missed the first three corners and ended at 1,550 meters; the resulting
  right-turn advice and visible retry were checked on screen.
- Normal/reduced-motion galleries were visually inspected at both corner
  midpoints, bridge joins, a hillside and the later 2,950-meter river corner.
  Combined powers retained their expected attraction/expiry/shield behavior when
  the test driver handled turns; the previous driver incorrectly spent its
  shield by ignoring a newly required turn and was updated, not the game rules.
- Five-indicator layout fixtures pass at 320×568, 390×844, 568×320 and 844×390.
  Keyboard menu focus, pause/resume, frozen Mochi body/leg poses and short-landscape
  dialog actions were checked. No browser errors were reported. These checks are
  desktop browser emulation; physical-phone performance is not claimed.
- Normal builds exclude the local-only browser fixture. Existing saves and the
  separate original 2D game are preserved; their regression tests remain green.

## Shorter actions and a quieter trail

- Normal jump airtime is 0.72 seconds at all four leap levels; launch speed and gravity scale together so upgrades add height without extra float. Ground slides last 0.58 seconds, or 0.79 seconds at level three. The late-jump buffer is 120 ms; continuous dives, full slide duration on touchdown and momentum-aware steering remain intact.
- Removed center-screen banners, repeated tutorials, milestone interruptions and duplicate power-up chatter. A single edge dock prioritizes actionable cues, route choices, brief important notices and unfinished goals. Hints forecast the physical lane at impact, avoid repeating a covered slide, and still allow a jump hint during a ground slide. Power indicators use compact chips without moving the score panel when they activate.
- Ambiguous diagonal swipes wait for a clear axis instead of triggering the wrong action. Short trail taps still jump. Paused runs explicitly warn that leaving will not bank points or gifts; the action is labelled “Leave this run.”
- All 98 simulation/unit tests pass, including every hazard with the shorter cue window, base/top/boost-transition speeds, unchanged upgraded airtime, too-early actions expiring, cue priority/suppression, physical-lane prediction and swipe classification. Build, lint and release-artifact checks pass; normal builds remove the local-only browser fixture.
- Real-time local 390×844 run with Mochi and full motion: 60 seconds, 1,886 meters, 3,600 frames, mean 16.67 ms and p95 16.80 ms. All three regions, Challenge selection, zipline catch and landing were observed, with three hearts and no detected HUD overlap or browser errors. This is desktop-browser viewport emulation, not a physical-phone performance guarantee.
- Accelerated production-renderer check: three 4,500-meter runs, 54 checkpoints, nine ziplines and minimum three hearts. Peaks: 14 geometries, four textures, 117 active-plus-pooled objects and 182 draw calls.
- Five-indicator layout stress checks pass at 320×568, 390×844, 568×320 and 844×390. The final compact labels fit a single row at 320 pixels wide; the cue sits at y=453 above the controls. This fixture tests layout, not naturally earning five powers simultaneously. Before/after phone-sized gameplay screenshots were visually inspected.
- Actual keyboard-driven browser actions returned from jump posture in 708 ms and slide posture in 584 ms, consistent with the simulation durations and frame-sampled height threshold. The pause warning and leave label were verified in the rendered interface.

## Momentum, air slides and landing weight

- Replaced instantaneous sideways velocity changes with an exactly integrated damped spring. Jump presses use a 180 ms time window instead of a fixed near-ground height cutoff. Air slides accelerate into a capped dive, and their full ground duration starts at touchdown; basic jump height, gravity, obstacle thresholds and progression remain unchanged.
- Landing integration records the exact impact time/speed and preserves the remaining part of a simulation step for a buffered rebound. Decorative banking follows sideways velocity; nose pitch follows vertical velocity; a small impact-weighted compression settles after landing. In-air and sliding poses no longer receive the unrelated running bob. Reduced motion disables these decorative weight cues.
- New tests cover 30/60/120 Hz steering and reversal equivalence, standard/upgraded late jump buffers, expiry without midair jump stacking, continuous dives, full slide duration, exact landing time/impact, a rebound precisely on a step boundary, invalid delta no-ops and bounded/reduced-motion body poses. Existing obstacle-clearance, difficulty, gap, upgrade and zipline regressions continue to pass.
- Local 390×844 real-time run with Mochi and full motion: 60 seconds, 1,821 meters, 3,600 frames, mean 16.67 ms and p95 16.70 ms. Three hearts remained; all three regions, Challenge, and zipline catch/landing were observed, with no detected HUD overlaps. This is desktop-browser viewport emulation, not a physical-phone performance guarantee.
- Accelerated production-renderer check: three 4,500-meter runs, 54 checkpoints, nine ziplines and minimum three hearts. Peaks: 14 geometries, four textures, 117 active-plus-pooled objects and 182 draw calls. Local-only movement galleries isolate takeoff, dive, touchdown, slide and lane reversal on an empty practice strip; real obstacles are covered by the separate run checks.
- Full build, release-artifact validation, lint and all 87 tests pass. Normal/reduced-motion galleries were visually inspected; `posePauseCheck('mochi')` verified the entire body transform and leg angles remain identical over 60 paused draws, then leg easing resumes. No browser errors were reported.

## Photo-inspired Mochi character

- Mochi now uses dedicated smooth anatomy, a silver crown, charcoal coat, longer dark floppy ears, brown eyes and cream eyebrows/beard/paws. The supplied photograph was used as a visual reference only and is not a repository asset. Two deterministic 128×128 procedural textures and instanced hair cards create the coat; no external artwork request or per-frame fur allocation is needed.
- All 80 tests pass. New model coverage checks animation-joint ordering, deterministic finite transforms, independent instances, shared geometry, at most 64 meshes, fewer than 100,000 triangles and the two small generated textures. Running physics and saved progression are unchanged.
- Inspected an enlarged portrait and all six Mochi outfits through the production renderer. The gallery switches a contrasting puppy/party outfit before every capture; a separate Pepper gallery checks the reverse Mochi-to-original-model transition. Hats are lifted for Mochi's crown, with separate coat/cape fitting and full transform resets for other puppies.
- Real-time local run at 390×844 with Mochi/scarf selected through the clubhouse and full decorative motion enabled: 60 seconds, 1,886 meters, 3,602 frames, mean 16.66 ms and p95 16.70 ms. All three regions, Challenge, zipline catch and landing were observed; three hearts remained, with no detected HUD overlap or browser errors. This is desktop-browser viewport emulation, not a physical-phone performance claim.
- Accelerated production-renderer check: three 4,500-meter runs, 54 checkpoints, nine completed ziplines, minimum three hearts. Peak resources: 14 geometries, four textures, 117 active-plus-pooled objects and 186 draw calls. A 220-draw-call regression ceiling supplements the existing resource checks. The normal production build removes all local-only visual fixtures.

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

# Unified run banking

- Completion now uses one guarded `bankRun()` operation for score, lifetime bones, best-run records, mission points, gifts and prizes. A repeated completion returns the same receipt without paying any component again; unfinished runs cannot bank.
- All 77 tests pass. Integrated reward tests cover ten repeated completions, an unfinished run and a second completed run that earns another mission and the cumulative-gift outfit without reducing previous records.
- A fresh browser run ended naturally at 212 meters: 662 score, eight bones, no mission or prize. Results announced a personal best; saved credits were exactly 662 and both lifetime and best-run bones were eight. Reload retained those values and returned to camp without browser errors.

# Pickup matrix and combined power lifecycle

- Inspected real-renderer galleries of all eight pickups (bone, magnet, shield, gem, double points, heart, present, tennis ball). The double-points coin initially resembled Pause; its two bars were replaced with a legible geometric ×2 stamp using shared box geometry and no extra textures.
- `powerPreview()` places test pickups into the real simulation rather than setting active timers. Normal and reduced-motion runs both show three bones pulling at 0.1 seconds with zero credited, three collected at 0.4 seconds, Zoomies expired at 6.5 seconds, and magnet/double expired at 10.5 seconds. Shield remains one throughout. Assertions reject lifecycle deviations.
- Four-stage screenshots in both motion modes were inspected for attraction rings, collected-bone disappearance and effect expiry. The local fixture is excluded from release artifacts. These are sampled simulation/render checks, not real-time frame pacing or natural random-spawn frequency evidence.

# Published integrated acceptance — 279bba6

- CI and GitHub Pages succeeded for `279bba616925ee7e72c4560b2ca00808a1f1d14b`. Live runner loaded `game.js?v=f42114f7da643b2d`, matching the local build. A fresh isolated browser profile had no runner save; no currency or simulation state was injected.
- At 390×844 with full decorative motion enabled, the published game ran for 60 seconds under visible-prompt keyboard input. It reached 1,886 meters, retained three hearts, visited all three regions, selected Challenge and caught/completed a zipline. 3,600 animation frames: mean 16.67 ms, p95 16.80 ms; no detected HUD overlap.
- Resuming the same run without movement input ended naturally at 2,405 meters: 6,780 score, 59 bones, two gifts and one completed zipline. Banking produced exactly 7,830 credits (6,780 score + 250 mission + 800 prize points), three claimed prizes and the crown. Best-run bones were 59.
- Real clubhouse/shop button clicks purchased Luna for 2,500, the raincoat for 1,800 and the first magnet upgrade for 500, leaving exactly 3,030 credits. Deeply nested buttons were scrolled into view before clicking and saved outcomes checked after each purchase. Reload preserved the balance, records, gifts, prizes, Luna/raincoat selection and magnet level one. The equipped puppy was visually inspected; no browser errors.
- The published root Puppy Quest separately started with its Play button, accepted direction/jump input, paused with Escape and resumed with Keep exploring. The menu/pause panels were hidden after resume, the timer read three seconds and the world was The backyard. Pause screenshot inspected; no browser errors. This is a preservation smoke check, not a new five-course browser completion claim (simulation coverage remains separate).

# Audio output and mute resource lifecycle

- An independent browser audit captured the actual enabled game audio through MediaRecorder and decoded it: 48 kHz stereo, 2,523 nonzero frames, peak 0.034679 and RMS 0.009457. This proves an output signal, not human sound-quality approval or physical-speaker audibility. Offline checks separately cover all five named cues and non-clipping output.
- The audit found that mute stopped notes but left the AudioContext running. `stopSound()` now immediately disconnects each active oscillator/gain exactly once, then suspends the engine, including when all notes have already ended.
- The rebuilt browser app passed enable → running, idle mute → suspended, re-enable → running, active-yip mute with both voices stopped/disconnected, and rapid off/on/off/on ending running with sound enabled. Preferences and ARIA matched; no browser errors or duplicate cleanup.
- Full local build/artifact/lint gates and all 77 tests pass after the fix; dependency audit reports zero vulnerabilities. Human listening and physical-device audio remain explicitly unverified limitations rather than inferred results.
- Final code release `52b02a1510c745764fdd5aea5e56f4f3a2169e6e` passed CI 34171529902 and Pages 34171529958. Production loaded script `a7934184b5900004` and stylesheet `1b29b96179d0ec91`, both matching the local build. An isolated live browser observed the actual lazily created AudioContext: enabled/running → muted/suspended → enabled/running, with matching pressed state and saved `sound:true`. No browser errors. The observer wrapped only the context constructor; it did not replace audio methods or game state.
