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

No generator, collision loop, controls, model, water route or rewards currently
uses this module. Existing published trails and saved progress are unaffected.
Do not report raft gameplay as shipped on the strength of these unit tests.

Next work connects the state transitions and reserved generator rows under a
new replay version, then adds the raft/water presentation and reachable reward
paths. All gates in `comparative-gap-review.md` still apply. In particular,
course reservations, safe dismounts, visual reaction distance, actual controls,
power interactions and renderer resources need integrated verification.
