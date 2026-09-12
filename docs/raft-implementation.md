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

No generator, collision loop, controls, model or water route currently calls
this module. Its completion reward is unit-tested but cannot yet be earned in
the published game. Existing published trails and saved progress are unaffected.
Do not report raft gameplay as shipped on the strength of these unit tests.

Next work connects the state transitions and reserved generator rows under a
new replay version, then adds the raft/water presentation and reachable reward
paths. All gates in `comparative-gap-review.md` still apply. In particular,
course reservations, safe dismounts, visual reaction distance, actual controls,
power interactions and renderer resources need integrated verification.
