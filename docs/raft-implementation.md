# River raft implementation status

## Finding the next reward

The passport now features the unfinished milestone with the highest fraction of
its next target completed; ties prefer the equipped puppy. Completed collections
remain available in the expandable group. A mocked, storage-isolated profile at
320 × 568 showed River explorer at 9/10 and +600 points above the fold, with the
correct 2/27 stamp total and no browser errors. All 447 checks passed, including
ordering, ties, completed collections and input immutability. This ordering does
not claim that different activities take equal time to complete.

## Water contact

A short, surface-bound V wake now trails the occupied raft. It follows the
river ribbon and rider's lateral position, fades over the first/last three
meters of the crossing, and disappears on bridges or without a rider. This
uses the existing water shader and a reused uniform: no particles, textures,
geometry or extra draw calls. Reduced-motion play retains a steady foam shape.
Portrait 390 × 844 previews checked centered and left-lane positions with clear
rocks and bone lines; shader/browser errors were empty. Uniform lifecycle and
shore fades are covered by tests; full checks passed 445 tests. A new native
performance measurement has not been made for this shader addition.

## Ride passport progression

River and cable completions now bank separate lifetime passport counters. Each
awards permanent stamps at 1/10/30 completed rides, paying 200/600/1200 points
once per threshold. Old saves initialize both counters to zero; past rides are
not inferred from unrelated records. Portable backups retain the counters.
Practice and unfinished runs never advance them, and retiring during a ride
only counts earlier completed rides. Existing run-completion bonuses remain.

The passport derives its 27-stamp total from the catalogs instead of hardcoding
21, and the expanded milestone group includes readable River/Sky explorer cards.
Portrait 390 × 844 UI inspection verified both cards, reward text, progress and
the practice exclusion instructions; console errors were empty. Full build,
distribution, lint and 444 tests passed, including repeated banking, reload,
multiple thresholds, malformed counters and nonzero backup round-trips.

## Version-four release

New adventures now select trail version 4, which enables river reservations,
raft steering and the revised course sequencing. Shared versions 1–3 remain
supported with their fixed pre-river layouts. The historical `raftPrototype`
field is retained internally, but its normal value is now determined by the
generator version. Help includes River steering practice. Earlier prototype-only
status notes below are chronological evidence, not the current rollout state.

The refreshed portrait renderer matrix includes all four puppies plus a repeat
lap (the previous matrix omitted Luna): 90 km, 30 raft completions, 65 ziplines,
130 turns, 360 render checkpoints, three minimum hearts and zero damage, shield
saves or missed turns. Peaks: 36 geometries, nine textures, 243 draw calls and
115 objects, stable after warm-up. Regional completions were 48/41/12 and all
twelve hard-course names appeared. Browser console errors were empty. This is
accelerated simulation with rendered checkpoints, not real-time frame pacing.

Rollout regression checks retain explicit version-three authored-location tests
and six-kilometre course coverage. Version four checks all course families over
18 km, reflecting its additional traversal reservations. The 150 ms reaction
pilot now recognizes RAFT direction cues. Scenic reaction tests still reject all
damage and now check mastery at each actual Scenic course rather than assuming
an entire region contains no intervening hard courses. Full checks pass 442 tests.

The same 90 km matrix was rerun using `createRun(...,4)` rather than manually
enabling the flag, with identical totals and resource peaks. Regular production
Help at 390 × 844 exposed River steering and launched a real-time practice run;
a no-input crossing finished at 4/12 bones with steering advice, then returned
to camp with its original zero points. Console errors were empty, and the
temporary tabs and viewport were cleaned up.

## Historical layout lock

Before introducing a river replay version, `legacy-layout.test.js` captures the
current obstacle/reward stream for versions 1, 2 and 3 with seeds 0, 1989 and the
maximum unsigned seed. Each deterministic generation sweep covers 18 km with
alternating Challenge/Scenic choices, at least 25 gates and over 2,000 objects.
The fixed digests include complete generated object records, not merely version
numbers. They must not be regenerated to accommodate new-version content. These
are generator regression baselines, not recorded human runs or exhaustive seed
coverage. Default version remains 3; river adventures are still gated.

## River rehearsal

River-rock mistakes now offer dedicated river steering practice instead of basic
jump/slide lessons. The actual practice run uses the production encounter and raft
physics at the existing 12 m/s practice pace, with automatic boarding, twelve bones,
three steering beats, unlimited hearts and shore completion. Post-run advice teaches
momentum and early steering; existing retry and return-to-trail controls are reused.
This remains reachable only from a river mistake while the adventure feature is gated.

Simulation tests follow the real cues through a complete clean crossing, collect all
twelve bones, and verify banking cannot mutate an existing profile. A no-input run
also completes without exhausting hearts and receives river-specific advice. Full
build, distribution, lint and 440 tests pass; the final banking assertion additionally
passes in the focused tests. The new lesson's rendered UI has not yet been checked.

Subsequent full-app browser verification used the isolated fixture with the actual
practice clock and on-screen controls. At 320 × 568, a complete button-steered
crossing collected nine bones; the three-second manual increments intentionally
missed lead-in pickups. Boarding disabled ground controls, shore restored them,
the result showed 9/12, and Practise again reset to zero distance/bones. At
390 × 844, Pause explained unscored play and Leave practice returned to camp with
zero points. A no-steering completion showed 4/12 and the early-steering advice;
Run the adventure then restored ordinary zero-distance, three-heart gameplay.
Both portrait result layouts retained accessible action buttons; the shortest
layout scrolls its copy. Console errors were empty. This is stepped-clock UI
evidence, not real-time reaction or native-device coverage. Temporary tab and
viewport were cleaned up; fixture storage remains disabled.

## Movement and reservation foundation

`rafts.js` supplies an exact damped steering oscillator, bounded banks and a
small station-dependent current that reaches zero value and slope at the shores.
The steering retains momentum with modest overshoot, then settles to its target.
This intentionally differs from the runner's critically damped lane spring.

The candidate encounter starts at 1150 m, lasts 140 m, and repeats every 2800 m.
It reserves 45 m before entry and 35 m after exit. Tests inspect 100 repeat
windows against corners, choice-gate clearance and ziplines. A shore-action
reset clears jump/slide buffers without touching powers or earned progress.

Tests cover equivalent held-target trajectories at 24/60/120 Hz, 24,000 steering
reversal updates, bounded currents and invalid schedule inputs. The API assumes
finite runner positions and velocities, as supplied by the existing simulation.

## Not yet playable

The lifecycle foundation now emits one boarding event, preserves the prior jump
height for a future visual boarding blend, clears ground-action queues, and
awards 250 points plus a 1.2-second exit grace period once on a real dismount.
Skipped encounters, restored mid-river positions, duplicate entry intervals,
paused intervals and ended runs cannot manufacture completion rewards. A frozen
run keeps its raft pose. Seven raft tests cover these contracts using real
`createRun` state; the full suite passed 388 tests, followed by the focused seven
tests after strengthening the zero-distance-interval guard.

The internal `raftPrototype` flag now connects generator reservations, steering,
ground-action suppression, existing rock collisions, bone/power collection and
completion rewards. No UI or default run enables it. The renderer now has an
initial raft and river-route presentation, but it is not a finished feature
in the published game. Existing default trails and saved progress are unaffected.

Prototype encounters have three steering beats at +35/+70/+105 m, with 12 bones
marking safe lanes and a final gift. Scenic has one rock per row; Challenge has
two. Integrated tests use real `act`, `step`, `fillTrack` and `actionCue` paths
across base/max upgrades, boosted/unboosted conditions and 24/60/120 requested
update rates (the world step retains its existing 1/30 s cap). Tests confirm
successful dismount, reachable rewards and no buffered ground-action leakage.
Separate non-steering runs test real damage, shield consumption and magnet
collection; these are not visual or human-reaction-time acceptance checks.
Do not report raft gameplay as shipped on the strength of these unit tests.

Next work verifies delayed input, fills course-coverage gaps and adds a new replay
version before enabling the feature in ordinary adventures. All gates in
`comparative-gap-review.md` still apply. Visual reaction distance, browser control
coverage, full power combinations and renderer resources remain unverified.

## Initial visual integration

The prototype now renders a seven-log raft with cross-planks and lashings,
reusing existing geometries in twelve parts. A narrow river replaces the road
during the encounter, river rocks sit at water height, and the dog uses a braced
pose. The waiting raft is visible before boarding. A quarter-second visual
blend preserves an incoming jump's height while the simulation boards safely.

Portrait previews at 390 × 844 covered 1130/1170/1280 m. The first wide-water
preview read as a lake; the channel was narrowed to 16 m and rechecked. Current
prototype screenshot: local `test-results/raft-portrait.png` (not shipped).

Two real-renderer matrices each covered four 6 km runs and 96 checkpoints:

- Prototype: eight raft completions, 16 ziplines, 36 turns, zero damage/shield
  saves/missed turns; peak 36 geometries, nine textures, 257 draw calls and 101
  objects. Repeat laps stable. One new river geometry raises the explicit
  geometry ceiling from 35 to 36; other ceilings stay unchanged.
- Default trails: zero raft completions as intended; all twelve hard-course
  names retained, 16 ziplines/36 turns, no damage, stable 35/9/243/105 peaks.

The prototype displaced Crystal slalom and Moonpaw weave within this 6 km
coverage window. Its optional renderer check reports encountered names and
requires two raft finishes per run; it does not claim all-course coverage.
The default check still requires all twelve. This gap must be investigated
before general release, not hidden by the prototype-specific check.

Full build/lint/distribution/tests passed: 393 tests. Browser console errors
were empty; temporary tabs closed, viewport reset, final build removed fixture
files. Sustained native performance and actual browser-input raft runs remain
unverified. None of this is a claim of physical-device QA or goal completion.

## Delayed steering and course sequencing

Five additional tests cover 300 ms delayed responses to arrow cues at 24/60 Hz
presentation rates over a fixed 120 Hz simulation, with Scenic/Challenge and
boosted/unboosted rides. Every ride completes without damage, shield saves or
boost-smashing a rock. These are simulated reaction checks, not human input QA.

Prototype course variants now advance only when a hard course is generated,
independently per region. Scenic courses do not consume a hard-course variant.
Default trails retain their existing distance-based selection and replay layout.

The renderer check now requires all twelve hard-course names for the prototype
too. Four extended 18 km runs passed: 24 rafts, 52 ziplines, 104 turns, 288 render
checkpoints, no damage/shield saves/missed turns. Peaks remained 36 geometries,
nine textures and 257 draw calls, with 113 pooled plus active objects; repeat
laps were stable. This longer check replaces the earlier prototype exemption.

This does not resolve early-run variety: 7.5 km was insufficient to encounter
every family, and the extended matrix recorded 32/37/6 completed regional
courses. Glade windows remain crowded by reserved encounters. Course pacing,
actual portrait control input, versioned rollout and native performance remain
release gates; the prototype is still disabled for ordinary adventures.

Final build, lint, distribution checks and all 398 tests passed. The extended
browser run reported no console errors; its temporary tab and viewport override
were cleaned up.

## Landscape-boundary pacing

Prototype courses may now finish across a scenery boundary. Previously the
generator discarded otherwise safe opportunities simply because the background
was changing. Turn, river, zipline, choice and difficulty reservations remain
mandatory; default replay layouts retain the old boundary rule.

A sweep of candidate starts through 18 km verifies that admitted courses never
cross reserved turns, rivers, gates or ziplines. The same four-run renderer matrix
now records 39/34/11 regional course completions (previously 32/37/6), all twelve
hard-course families, 24 rafts, 52 ziplines and 104 turns without damage or missed
turns. Peaks: 36 geometries, nine textures, 243 draw calls and 115 objects;
repeat laps stable. The prototype check now requires at least ten glade course
completions in that matrix to guard against the previous starvation.

The glade still appears less often than the other course families. This is an
improvement to the gated prototype, not a claim of final pacing balance.

## Traversal interface contracts

Jump and slide now disable aboard the raft, explaining that they return at the
shore; steering and Fetch remain available. A real simulated dismount test
verifies that controls restore and jumping works again. The existing traversal
chip is reused for `RAFT` distance to shore, including an accessible progress
label, rather than adding HUD clutter. Switching back to a cable restores its
labels without allocating or replacing any chip nodes. Scene posture also
identifies rafting rather than incorrectly reporting running.

All 401 tests, build, lint and distribution checks passed. These interface tests
use lightweight DOM fixtures; actual portrait browser input and visual layout
still require verification before enabling the prototype.

## River feedback

River-rock collisions now retain their traversal context in the mistake record.
Post-run advice distinguishes choosing the wrong lane from steering toward the
correct lane too late, even after the raft state is cleared. It no longer tells
players to jump over a river rock. Completion uses the existing quiet notice dock
and the run summary explains the included crossing bonus. Boarding and completion
reuse opt-in sound cues; boarding adds no banner.

Collision-driven regression tests cover both steering mistakes and the completion
notice contract. Actual audio perception and portrait layout remain browser/device
acceptance work, not something these tests establish.

## Real controls with a stepped clock

`node scripts/build-raft-input-qa.mjs` creates a local-only full-app fixture after
the normal build. It disables profile reads/writes and offline registration and
advances simulation only through an explicit QA clock. It uses the actual app
input handlers, renderer and HUD; it is excluded from production builds.

At 320 × 568 and 390 × 844, actual on-screen left/right button clicks completed
Challenge rivers with all 12 bones, three hearts and one dismount. The narrow
test then clicked Jump at shore and reached 1.66 m height. Screenshots confirmed
visible rocks, bone lanes, raft, shore indicator and unobscured controls. Browser
console errors were empty. The test exposed a stale scene accessibility label;
it now describes river steering and restores normal movement guidance at shore.

This verifies button wiring and portrait presentation, not continuous reaction
timing, swipe gestures, native Safari frame pacing or physical-device usability.
The temporary tab was closed and viewport override reset. The final normal build
removes the generated fixture files.

## Tilt timing integration

A combined sensor/world test now feeds 60 Hz orientation readings through the
actual smoothing/rearm adapter, with 300 ms cue reactions, into Challenge river
steering. The old edge-to-edge reversal failed at boosted speed; ordinary-speed
collection also suffered. River cues now look ahead 1.35 seconds, and the three
beats sweep adjacent lanes (left, center, right). Challenge retains two rocks per
row and unchanged collision rules; Scenic retains one. The final gift follows
the final safe lane. Both normal and boosted sensor runs complete without hits,
shield saves or boost-smashes and collect at least nine bones.

This supersedes prior fixtures' lane paths; those button previews need rechecking
before release. Synthetic sensor coverage is not physical-phone evidence. The
river remains gated and default version-three trails are unchanged.

The sensor matrix now covers all three sensitivity presets at 24/60 Hz and
normal/boosted speed (12 combinations), including final gift collection. Steady
initially cleared rocks but collected fewer than nine bones at boosted speed.
Pickup offsets are now -10/-4/+5/+11 m around each steering beat rather than
-16/-10/-4/+5: two lead-in bones still show the lane, while two reward the completed
maneuver. Every combination now preserves three hearts, completes the crossing,
collects at least nine bones and the gift, without shield saves or boost-smashes.
No physics, collision or reward-count thresholds were relaxed. Updated visual
placement still requires the pending portrait recheck before river rollout.

## Updated portrait swipe evidence

The revised adjacent-lane route and pickup offsets were rechecked through real
pointer drags on the full-app fixture at 320 × 568 and 390 × 844. Both runs
collected all 12 bones, retained three hearts and completed one dismount. The
raft state cleared, jump/slide buttons re-enabled and the running accessibility
description returned. Screenshots at both sizes showed distinct rocks, a visible
bone lead-in and controls clear of the route. Browser console errors were empty.

These were manually advanced simulation runs, not sustained real-time play or
physical touch/sensor tests. This closes the revised-layout swipe-wiring recheck,
not native Safari performance, tilt-device validation or versioned rollout.
The temporary browser tab was closed and viewport override reset afterward.

## Replay rollout preparation

Supported replay versions now live in one explicit list shared by link writing,
link parsing and run creation. Previously two sites used `[1,2,CURRENT]`, which
would silently discard version 3 when CURRENT advanced. Contract tests now require
historical versions 1/2/3 to survive full link round trips and preserve the chosen
generator version, including zero and maximum seeds. Unknown/noncanonical versions
remain rejected. Full checks passed with 432 tests. CURRENT remains 3 and the
river remains disabled; this removes a rollout hazard without enabling it early.

## Banking integration

Three regression tests now connect a real simulated dismount to `bankRun`: the
250-point crossing enters the score once, an unfinished run cannot bank, repeated
receipt reads do not pay again, ended/retired state before shore cannot fabricate
completion, and a practice-marked run cannot alter the profile. The practice test
checks the shared banking guard; it is not a claim that raft practice UI exists.
Score-source text now identifies river and zipline bonuses as already included.
All 435 tests and full build/lint/distribution checks passed. This does not replace
the pending actual pause/retirement UI and native performance checks.

## Pause and retirement UI

At 390 × 844, actual Pause → Keep running → Pause → Finish & bank points
controls were exercised aboard the full-app river fixture at 1160 m. Resume
preserved the lane, raft state, position, hearts and disabled ground controls.
Retirement showed Home safe, 1160 score, zero bones and zero completed crossings;
no unearned 250-point crossing bonus appeared. The fixture disables storage, so
this verifies the actual finish UI path without modifying the saved profile.
Console errors were empty; temporary tab closed and viewport reset.

Pause copy now explains that unfinished raft/zipline completion bonuses require
finishing the ride, while already-collected rewards are retained. The stepped
clock does not establish real-time resume timing or native performance.

Resume integration now has dedicated 24/30/60/120 Hz tests using the production
slow-speed recovery function and 120 Hz simulation accumulator. All rates produce
matching raft trajectories, without ground-action leakage; resuming immediately
before shore produces exactly one completion and bonus. The manual-clock fixture
now applies that same recovery function instead of bypassing it. Full checks
passed with 437 tests before the fixture-only correction; fixture bundling/lint
were checked afterward. Sustained native frame pacing remains unverified.

## Combined powers

A 32-combination simulation matrix covers shield, magnet, double bones, Zoomies
and requested Fetch on/off. The pilot follows directional cues but finishes nearby
bones in its current lane before changing lanes. All runs collect 12 bones and one
gift, complete once, retain three hearts and their original shield, and never use
shield saves or boost-smashes to hide mistakes. Double bone points apply once;
magnet/double timers retain normal expiry. Fetch cannot self-recharge, and an
already-active magnet prevents spending Fetch charge. This is a collection pilot,
not delayed human-reaction evidence; that remains the separate tilt matrix.

## Real-time benchmark baseline

The isolated full-app fixture now includes a 30-second benchmark button (plus
two seconds of warm-up). It uses the normal RAF clock, fixed-step accumulator,
renderer and HUD, with a directional autopilot and repeated entry/exit. Profile
storage remains disabled. Hidden/interrupted runs produce an error rather than a
successful measurement. Samples are bounded; raw frame intervals are measured
before the simulation's dt clamp. The reported renderer snapshot is final state,
not a peak resource claim.

Desktop in-app browser at 390 × 844: 32.008 s total, 3,597 measured post-warm-up
frames, median 8.3 ms, p95 10.1 ms, p99 10.3 ms, zero frames over 50 ms. Five
crossings, 50 bones, zero damage/shield saves; console errors empty. This measures
the default puppy and current motion setting, not all dogs/powers or native iOS.
The temporary tab and viewport override were cleaned up. Native Safari remains
the next performance gate. Fixture bundling and lint passed.

Native Safari on the dedicated iOS 27 simulator subsequently completed the same
30-second measurement after two seconds of warm-up: 1,801 frames, median 17.0 ms,
p95 17.0 ms, p99 19.0 ms, and zero frames over 50 ms. Five crossings collected
50 bones with zero hits/shield saves. The benchmark report now uses concise text
so these metrics are readable on the native portrait screen; full data remains
available in the fixture result object. Screenshot evidence is locally retained
at `test-results/river-native-performance.png`.

This is a default-Biscuit simulator baseline, not physical-device performance or
the all-dog/all-power long-run matrix. The normal production build and distribution
verification passed afterward, removing the temporary benchmark entry and fixture.
The ordinary Safari game was restored with its existing 200-point profile intact;
only the dedicated simulator mirror helper was stopped. Fixture lint passed.
