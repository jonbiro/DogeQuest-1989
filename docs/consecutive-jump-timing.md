# Consecutive-jump warning timing

A new explicit-Scenic reaction test exposed a failure at 1,323 m on seed 1989:
with 300 ms input latency, an otherwise safe jump rhythm could leave too little
landing time before the next log. This was not visible in instant-response tests.

Closely following on-path jump hazards now receive a 580 ms warning rather than
500 ms. The 80 ms head start applies only when another uncleared jump hazard is
within 750 ms of the first. Unrelated lanes, used obstacles, distant rows and
overhead hazards retain normal behavior. Physics, durations, rewards and layouts
are unchanged. Earlier blanket warnings were rejected because they regressed
immediate responses; the final contextual timing passes both response models.

370 tests and the complete build/lint/distribution check passed. New coverage
runs four seeds for 6 km each at 24/60 display FPS and base/max upgrades with
300 ms delayed cue inputs: 16 runs, 96 km, no hits or shield saves, canyon/glade
Scenic sequences actually encountered. Immediate-input Scenic/Challenge tests
and the existing 100–250 ms reaction matrix also pass. These deterministic
tests are a timing envelope, not a claim that all players or devices will succeed.

A 50-second real-interface run at 320 × 568, driven by synthetic keyboard and
pointer events, reached 1,461 m with three hearts, two correct turns, the completed
zipline, both Scenic sequence labels and no detected HUD overlap. No browser
errors were reported; the isolated origin's saved-progress key remained absent.
