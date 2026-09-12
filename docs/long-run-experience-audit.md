# Long-run experience audit

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
