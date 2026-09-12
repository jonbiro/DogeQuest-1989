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
