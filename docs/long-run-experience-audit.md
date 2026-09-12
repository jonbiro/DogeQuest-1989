# Long-run experience audit

## Implemented follow-up

Version-three trails now generate gentle regional sequences inside Scenic
sections. One blocked lane per beat leaves two escape lanes; safe-line bones
invite steering but never require it. No full-width gaps, course bonuses or
regional mastery are attached to these optional sequences. Ordinary successful
clears and pickups remain useful. Version-one/two generation remains available.

Verification: 363 tests pass, including nine 6 km cue-driven runs across three
seeds and three replay versions. New default-center Scenic routes encounter all
three regional families; old versions retain the original jungle-only authored
course coverage. Separate tests preserve two escape lanes, collision advice,
zero hard-course mastery, replay round trips and meaningful progress labels.

A 24 km real-renderer simulation completed 36 turns and 16 ziplines without hits
or misses, with stable repeat laps: peaks 237 draw calls, 32 geometries, eight
textures and 105 objects. A 45-second 320 × 568 actual-interface run using
synthetic keyboard/pointer events reached 1,281 m with three hearts, two turns,
a completed zipline, both canyon/glade Scenic labels, and no detected HUD
overlaps. It did not choose Challenge. This is desktop evidence, not physical
touchscreen or hardware FPS acceptance. The run exposed a progress-meter label
that incorrectly said clean moves; the Scenic meter now identifies distance.

Baseline: ea2938d. The broader goal of surpassing Temple Run remains unproven.
This audit examines what a player actually encounters, not just what exists.

## Evidence

An actual-world, cue-driven simulation of seed 1989 ran to 6,000 m with base
upgrades, once choosing Scenic and once choosing Challenge at every gate.
Both retained three hearts. Inputs used the existing action cues and steering;
this was simulation evidence, not a human difficulty or device performance test.

| Route policy | Authored courses encountered | Regional coverage |
| --- | --- | --- |
| Scenic | Five starts: 200, 1355, 2720, 4095, 5490 m | Jungle only; four distinct patterns |
| Challenge | Fourteen starts from 200 to 5990 m | All three regions; all twelve patterns |

`world.js` explicitly suppresses authored courses inside Scenic sections.
Its gate resolution treats the middle lane as Scenic. Therefore passive gate
selection can hide the richer canyon and glade sequences for an entire long run.
`test/runner-course-route-coverage.test.js` correctly proves Challenge reaches
all twelve courses, but does not prove a varied experience for default routing.
The existing four-run renderer aggregate also mixes three Scenic attempts with
one Challenge attempt; regional totals are not a balanced-experience metric.

## Next design priority

Make regional identity available at the gentle difficulty too. Design gentler
canyon and glade sequences with wider timing margins or optional escape lanes,
without silently replacing Scenic with the harder all-lane courses. Preserve
the quiet recovery stretches and the meaningful distinction between the routes.
Any generator change needs a new replay version so old shared trails remain
stable. Verify both route policies independently over several seeds and laps,
including cue timing, bonuses, practice advice and the 320px portrait HUD.

Before implementing, inspect the existing replay-version dispatch and regional
reward rules: a gentle sequence must not accidentally grant hard-course mastery
for bypassing every obstacle. Explicit route discovery in Help may complement
this work, but wording alone will not close the variety gap.

## Scope limits

Six visual destinations currently share three gameplay-region families. Existing
green tests, published graphics upgrades and old completion tables do not prove
comparative superiority. Continue judging art in motion and progression through
the default route, not only through curated previews or expert autopilots.
