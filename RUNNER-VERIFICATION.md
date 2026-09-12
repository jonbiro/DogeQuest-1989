# Runner verification

## Useful spare hearts (2026-09-12)

- Heart pickups now award 100 bonus points at full health instead of disappearing
  without benefit. At one or two hearts they still heal exactly one heart and
  award no bonus. The existing pickup sound/effect and score convey collection;
  no new notice or panel was added. Help and README explain the conversion.
- All 217 tests, build, lint and artifact checks passed. The added simulation
  regression checks all three health states, single consumption, exact score,
  no bone/count/combo/Fetch changes and no doubling of this non-bone reward.

## Optional-route collection fairness (2026-09-12)

- Fixed a reproduced scoring bug: inaccessible airborne bones reset the ground
  runner's collection combo when passing underneath an optional cable. Missed
  bones now reset the combo only when their route is reachable. They still get
  marked processed, cannot be collected from below, and award no free points.
- Two regressions failed before the fix and passed afterward. Coverage checks
  ground/airborne bones with and without an active cable, and skipping complete
  generated cables at 650m and 2,050m followed by a real ground pickup that earns
  the expected ten-bone bonus. Reachable misses continue to reset the combo.
- All 216 tests, build, lint and artifact checks passed, including existing
  18-bone cable steering and magnet isolation checks. This is simulation-backed
  scoring verification; no visual or native-input behavior changed.

## Native portrait practice navigation (2026-09-12)

- Real iOS 27 Simulator Safari on the dedicated Biscuit Dash QA device exposed
  practice buttons clipped beneath Help's scrollable content after expansion.
  Practice now uses the same reveal-on-open behavior as challenge help; closing
  either disclosure does not move the viewport.
- All 214 tests, build, lint and artifact checks passed. A regression executes
  the actual disclosure handlers and checks open versus collapse behavior.
- Native touch opened Help, scrolled, expanded practice and started the basic
  trail. Both practice buttons became fully visible above the fixed actions.
  An idle run naturally reached its 0/3 result; Back to camp retained the shown
  1,380-point balance. Screenshots are in the sibling directory
  `DogeQuest-1989-native-qa-2026-09-12` (practice-visible and practice-result).
- This establishes native Safari navigation, rendering and basic practice
  completion, not successful native timed gestures, multi-touch, physical-phone
  performance or native offline reopening. Those remain separate checks.

## Practice timing feedback (2026-09-12)

- Basic practice now distinguishes preparation, movement in progress and the
  actual result. It no longer repeats `JUMP NOW` or `SLIDE NOW` while the named
  action is underway. A one-second message in the existing edge dock confirms
  a clear or explains a missed/early move using recorded collision evidence.
  No new panels, center-screen messages or adventure-physics changes.
- All 213 tests, build, lint and artifact checks passed. Tests exercise actual
  moves and collision outcomes, early jump/slide coaching, unconsumed feedback,
  and 0/0.1/0.2/0.3-second cue response delays at base and maximum upgrades.
  Every delayed-input simulation clears all three lessons.
- At 320x568, browser keyboard play with a deliberate 150ms input delay cleared
  3/3. Observed cue transitions included preparation, `Jumping`, `Jump cleared`,
  `Sliding`, `Slide cleared`, steering and `Open lane found`. An idle retry ended
  0/3 and showed the three appropriate action instructions. The saved profile
  remained absent through both checks; the isolated local cache was cleaned.
- A saved screenshot in the sibling
  `DogeQuest-1989-practice-feedback-2026-09-12/jump-feedback.png` confirms the
  feedback below the dog at compact portrait size. Browser and simulation
  evidence do not establish human learning effectiveness or native touch timing.

## Tall-phone decision-window framing (2026-09-12)

- Projection diagnostics found opposite-lane bone centers outside the viewport
  after a bend with the fixed 52-degree vertical field of view. These were
  representative camera/route configurations, not a claim that every sampled
  point contains a generated bone.
- Gameplay now preserves a minimum 30-degree horizontal view for supported
  portrait ratios. At 390x844 this uses a 60.22-degree vertical view; 320x568,
  desktop and landscape keep 52 degrees. Menus and generated previews explicitly
  retain their original framing. Extremely narrow/invalid dimensions are bounded.
- A new projection regression samples 50–4,500m, three portrait ratios, all
  three lanes, camera-follow offsets and 0.45/0.6/0.8-second approach windows.
  It checks a conservative ground-bone envelope, excluding the deliberately
  object-free corner reservations. Existing puppy-envelope checks retain jumps,
  zipline height, lane lag and curves. This is not visibility certification for
  every airborne/power-up shape or every possible long-run state.
- A 390x844 browser keyboard run reached 1,008m with three hearts, two accepted
  turns and zero missed turns. Canyon and left-lane glade screenshots confirmed
  readable dog/controls and the opposite lane visible after the bend. Files are
  in the sibling `DogeQuest-1989-camera-check-2026-09-12/` folder. Illustrated Help
  images all loaded afterward. The local save remained absent throughout.
- All 210 tests, build, lint and artifact checks pass. No pickup positions,
  collision boxes, input windows, physics or reward rules changed. Very close
  peripheral objects can still clip; this fix targets the earlier decision
  window. These are desktop-browser and projection tests, not physical-phone,
  glare or human motion-comfort evidence.

## Fresh portrait scene audit and cable cleanup (2026-09-12)

- Used the screenshot-led product-design audit on the current 390x844 runner:
  jungle at 108m, canyon at 536m, cable at 721m, and glade at 1031m. The run
  retained three hearts through both turns and all regions. Saved screenshots
  and step-specific findings are in the sibling folder
  `DogeQuest-1989-visual-audit-2026-09-12/AUDIT.md`.
- The cable's camera-side tail became a thick foreground beam. Renderer-only
  clipping now ends it 1.5 units behind the dog, retaining its normal thickness,
  contrast, forward geometry and attachment. Full-length segments ahead are
  unchanged; overlapping clipped segments preserve continuity as tiles recycle.
- A fresh practice screenshot in the same cable section confirmed the beam
  removed and dog/handle visible. Before/after frames have different lane and
  HUD states, not pixel-identical gameplay. That practice finished with 18/18
  bones. All 208 tests, lint, build and artifact checks passed; the new test
  sweeps tile phases for continuity, attachment coverage and tail bounds.
- Other findings: near-canyon bones retain dark outlines; distant sign text
  needs the existing backed guidance; peripheral foreground bones can clip.
  This pass is not a full accessibility, glare, native touch or low-end GPU
  certification. No movement, collision, reward or save rules changed.

## High-bone rehearsal and catch visibility (2026-09-12)

- How to play now offers an optional 17-second high-bone practice trail.
  It starts just before the actual first zipline, uses the adventure's generated
  cable/reward layout and real catch, steering and landing physics at practice
  speed. All 18 high bones are reachable without a magnet. Saved upgrades apply.
- A missed handle ends after under four seconds with specific advice and a
  same-rehearsal retry. Successful results report bones collected and explain
  automatic landing. Practice stays unscored, never banks rewards, and normal
  adventure starts fresh. Displayed practice distance begins at zero; the
  initial interpolation state starts at the cable approach rather than camp.
- A compact aerial screenshot exposed an instruction sign covering the dog.
  The sign and its backing now disappear inside the catch window or after a
  catch, while the station, grips and cable remain visible. Reused stations
  restore their sign on approach. This visibility fix also applies in adventures.
- All 207 tests, lint, build and artifact checks passed. Tests cover missed
  catch, all 18 bones and automatic landing at every jump-upgrade level,
  non-banking, initial interpolation and sign/structure visibility separation.
- Browser keyboard play at 320x568 followed only visible jump/steering prompts
  and collected 18/18 before and after the sign fix. Screenshots confirmed the
  obstruction and its removal. Same-rehearsal retry, natural missed catch,
  readable results and the fresh normal-adventure transition were checked.
  The local save remained absent throughout; the isolated cache was cleaned.
  This is desktop browser portrait evidence, not native touchscreen coverage.

## Two-thumb controls (2026-09-12)

- Explicit action buttons now accept a second touch contact, so one thumb on
  a direction control cannot block the other thumb's jump, slide or Fetch.
  Free trail gestures still require one primary owner. Alternate mouse buttons
  and secondary non-touch pointers remain rejected.
- An explicit action cancels an unfinished trail gesture. Releasing that old
  finger cannot add an accidental tap-jump or swipe. Native click events do not
  duplicate the pointer action; keyboard activation remains available.
- All 204 tests, lint, build and distribution checks passed. Tests execute the
  actual trail/button listeners together, including two-thumb left-plus-jump,
  slide superseding a trail contact, stale release, next valid tap, pause and
  keyboard activation.
- At 390x844, synthetic browser PointerEvents with primary left and secondary
  jump contacts produced rendered lane 1 and jumping posture. The observer
  confirmed `isTrusted: false`; this is integration evidence, not hardware
  multi-touch evidence. The in-app browser rejected native multi-touch dispatch
  as unsupported. Native touchscreen verification remains open.
- Disposable progress/cache from this local check were cleaned afterward.

## Finish on your own terms (2026-09-12)

- Paused adventures now offer `Finish & bank points` instead of abandoning
  earned progress. This ends the simulation without removing hearts and uses
  the normal, once-only reward transaction. Unfinished challenges, courses and
  ziplines do not gain completion rewards. Practice still leaves without banking.
- Voluntary results say `Home safe` and do not blame an earlier collision.
  Resume stays the primary pause action; no new in-run controls or notices.
- All 203 tests, lint, build and artifact checks passed. New tests execute the
  actual camp-button handler, check once-only rewards, unchanged hearts,
  frozen completed simulation, unfinished-goal exclusion and practice behavior.
- A real browser run at 320x568 paused at 83m with three hearts. Finishing
  banked 183 points and four bones, with zero challenges completed. Returning
  to camp and reloading retained exactly those totals. Pause/results screenshots
  showed reachable actions and readable content. This is browser-emulated
  portrait evidence, not a native Safari or physical-phone result.
- The isolated local playtest progress and runner cache were removed afterward;
  production progress was not changed.

## Offline recovery follow-up (2026-09-12)

- Temporary navigation failures (HTTP 500, 502, 503 and 504) now use the
  previously verified cached game when available. Intentional 404 responses
  remain visible, and a missing cache preserves the original server response.
- Cache access failures no longer prevent known game assets from loading
  online. If both storage and networking fail, loading still fails honestly.
- All 200 tests, lint, production build and artifact checks passed. New
  regression tests execute the worker with simulated server and storage
  failures; these are not native Safari outage tests.
- The dedicated simulator follow-up could not finish because its mirror
  disconnected and Device Hub timed out. Its helper was stopped without
  changing other simulators. Native Safari checks of practice and offline
  reopening remain open; previous browser evidence is recorded below.

## Isolated iOS Safari follow-up (2026-09-10)

- Used a newly created iPhone 17 Pro / iOS 27 simulator named
  `Biscuit Dash QA — Sep 10` (UDID
  `A684C311-2581-42FF-8F83-9E38506B11B5`). Other projects' simulators were
  not reused or modified. Safari ran the local production build through a
  live simulator mirror. This is iOS Simulator evidence, not physical hardware.
- Actual mirrored gestures started play, changed lanes, jumped and slid;
  pause/resume and natural game-over were also inspected. Tool-paced play
  is not a difficulty or frame-rate benchmark.
- Landscape Safari exposed clipped primary results, camera-cutout overlap
  with hearts, and upgrade dialogs whose items were hidden by their actions.
  Short landscape dialogs now use bounded, independently scrollable content
  beside their actions. Safe-area-aware HUD margins clear either cutout side.
- Scrolled upgrades exposed a second issue: Help inherited the previous
  dialog's scroll position. Changing dialog state now resets content to the
  top without focus-induced scrolling; same-state purchase updates preserve
  the current list position. A regression test executes the actual state
  transition function and checks both cases.
- Simulator screenshots verified primary results and both cutout directions,
  upgrade content scrolling with actions retained, and Help starting at its
  heading. Rotation back to portrait retained readable Help instructions,
  camp navigation, upgrade rows and reachable primary/back actions.
- At a separately emulated 874x300 viewport with 62px side safe areas,
  normal and route-choice stress checks passed after moving the route dock
  above the near trail. A 40-second trusted-input run reached 1,095m with
  three hearts, two turns, all regions, a caught/landed zipline and two Fetch
  uses: 51 trusted and zero untrusted key events, no checked HUD overlaps.
  This browser run is separate from the simulator gesture evidence.
- Layout guards now reject initially clipped primary results and score/heart
  overlap with side safe areas. Temporarily restoring the old layouts made
  these guards fail; restored fixes passed.
- Release `4404311`: all 150 tests, lint, build and artifact checks passed.
  CI `34533271417` and Pages `34533271484` succeeded. Published runner HTML,
  JavaScript and CSS each matched the tested local build byte-for-byte.
  No physics, scoring, save format or original 2D gameplay changes were made
  in these layout fixes.

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

## September 11 follow-up: current build in isolated iPhone Safari

Checked gameplay build `05fde6b` on the dedicated **Biscuit Dash QA — Sep 10**
simulator (`A684C311-2581-42FF-8F83-9E38506B11B5`, iOS 27), using the simulator
browser mirror and native on-screen touches. Other projects' simulators were
not selected or controlled. Safari restored an older page; its visible reload
control loaded the current local `http://127.0.0.1:3000/runner/` build, confirmed
by the new contextual mission help, three-goal HUD and clean-move results text.

- Portrait help expands and scrolls; the Run button stays reachable.
- The five gameplay buttons remain above Safari's bottom toolbar.
- Start, lane swipe, pause and resume responded; the resumed dog was in the
  right lane. Exact resume timing remains covered by the separate browser and
  simulation tests, not inferred from the mirrored screenshots.
- The run naturally ended at 270 m with 420 points and six bones. Results,
  expanded details, the clean-streak breakdown and Retry button remained usable.
- Screenshots captured the actual simulator frame for menu, help, gameplay,
  pause, results and expanded results. This was not a no-damage playthrough,
  physical-device check, frame-rate measurement or jump-timing acceptance.
- Mirror keyboard forwarding was unreliable and a stream interruption recovered
  on the same running helper. These were tooling limitations, not game failures.

### September 11: runner offline reopening

- `npm run check` passes all 183 tests, including full-build integrity, failed
  download/quota preservation, scoped request handling and generated-manifest
  hashes matching the release files.
- Browser QA used isolated `127.0.0.1:3012`, not the user's production save.
  Installation and activation completed with four cached files. At 390 × 844,
  the expanded offline help remained readable and the Run button reachable.
- A stricter server-stopped reload initially exposed redirected HTML responses
  being unsuitable for cached navigation. Normalizing verified response bodies
  fixed this. With the local server completely stopped, the final worker
  reopened the runner, rendered the game, accepted Start and Jump input, advanced
  the distance HUD, and paused using Escape. No network was available to that
  local origin. The initial network-emulation-only reload is not counted as
  independent offline evidence.
- Worker changes never request a page reload. Failed caching does not block
  online play or touch local saved progress. Only known runner files are cached;
  the root 2D game and arbitrary requests are excluded.
- This is desktop browser offline coverage, not an iOS airplane-mode or native
  installation test. Browser storage eviction can remove cached files; the help
  explains this limitation. No cloud synchronization is implied.

### September 11: evidence-based retry coaching

- `npm run check`: 187 tests pass. Actual simulated collisions prove late-jump,
  incorrect slide and overhead-jump diagnoses; controlled state cases cover
  descent, recent landing, aerial dive and expired-slide evidence. A naturally
  expired slide is distinguished from a slide cancelled by jumping. Fresh runs
  reset evidence; generic lessons remain when no specific diagnosis is proven.
- In the isolated local browser, an unassisted run naturally ended at 200 m,
  300 points and four bones, displaying the existing generic collision lesson.
  All eight specific coaching strings were then previewed in that real results
  layout at 320 × 568. Retry remained within the viewport for each; a screenshot
  confirmed the final message's readability and accessible primary action.
- The eight-message layout preview is synthetic UI coverage, not eight trusted
  playthroughs. Collision classification is verified separately by simulation.
  No jump, slide, speed or collision threshold was changed; slide-expiry
  timestamps record existing motion without extending or shortening it.

### September 11: reversible upgrade tuning

- All 190 checks pass. Tests buy and refund all three levels in every track,
  proving exact balance restoration and unchanged unrelated profile data.
  Invalid/unowned refunds fail without mutation. Removing three slide levels
  restores the base .58-second slide for a new run; an existing run keeps its
  snapshotted upgrades.
- In an isolated 320 × 568 browser profile, real button clicks refunded slide
  levels 3 → 2 → 1 → 0 for 1,800 + 1,000 + 500 points. Reloading preserved the
  3,300-point balance and level zero. The fixture's 123-point record and seven
  lifetime bones were unchanged. Focus followed the refund button and moved to
  the corresponding purchase button when the last level was removed.
- A screenshot confirmed readable buttons and an unobstructed Run action while
  scrolled to Silky slides. Test profile and offline cache were removed afterward;
  production saves were not modified. This is browser portrait evidence, not a
  new native-phone performance measurement.

### September 11: focused keyboard controls

- Fixed Space being intercepted as Jump when a gameplay button such as Slide
  had focus. Native Space activation now invokes that button's named action;
  Space on the focused trail retains its jump shortcut. Modified browser
  shortcuts, composition and already-handled events no longer trigger gameplay.
- All 192 tests pass, including the actual keyboard-handler block for focused
  controls, normal shortcuts and modifier combinations. Existing pointer tests
  continue to cover one action per swipe, cancelled ownership, hold rejection
  and native keyboard clicks without duplicate pointer clicks.
- Real browser Space input on focused Slide produced the rendered `slide`
  posture. After resuming with trail focus, Space produced `jump`. Escape
  paused both checks. No synthetic movement was injected for these observations.

### September 12: optional unscored practice trail

- `npm run check`: 195 tests pass. Tests exercise a full no-input practice and
  successful jump/slide/steer rehearsals at all four movement upgrade levels.
  Practice ends at 130 m, never loses its three hearts, and cannot enter the
  reward transaction. Starting adventure afterward clears practice state.
- Browser QA at 390 × 844 inspected the actual trail and single edge prompt.
  A real-time keyboard run driven only by visible Jump now, Slide now and Steer
  left prompts completed 3/3 moves. An unassisted run completed 0/3 without
  ending early. The local save remained null after practice completion.
- At 320 × 568, the success screen, Run the adventure, Practise again and camp
  actions were readable and reachable. Rehearsal restarted at zero progress;
  pause used unscored copy. Run the adventure restored normal points, three
  hearts, region name and the first challenge, then paused normally.
- These are actual browser input and rendering checks, not physical-device
  performance or evidence that three practice moves teach every advanced feature.

### September 12: quiet personal-best chase

- All 198 checks pass. The existing score line shows distance in points to a
  reachable personal best, requires one additional point when tied, and marks
  a surpassed record as BEST. First runs and distant records remain ordinary
  score displays. Practice and active route labels retain priority.
- In an isolated 320 × 568 browser run with a 120-point record fixture, normal
  gameplay displayed 115 points to best, then 178 points · BEST after crossing
  the record. Screenshots at both stages showed no added panels or overlap with
  bones, hearts, the dog or controls. The run was paused before banking; the
  feature itself does not mutate saves or award extra points.
