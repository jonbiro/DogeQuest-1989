# River raft implementation status

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
