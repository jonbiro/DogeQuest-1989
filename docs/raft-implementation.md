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
completion rewards. No UI or default run enables it, and the renderer has no
raft or river-route presentation yet. It cannot be played as a finished feature
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

Next work adds the raft/water presentation, delayed-input checks and a new replay
version before enabling the feature in ordinary adventures. All gates in
`comparative-gap-review.md` still apply. Visual reaction distance, browser control
coverage, full power combinations and renderer resources remain unverified.
