# Long-run experience audit

## Implemented follow-up

Route discovery follow-up: Help now exposes a standalone “Scenic or Challenge?”
disclosure, explaining open lanes, default selection, rewards and replay limits.
Regional passport cards explain how Challenge courses earn stamps; dog cards do
not receive that advice. 365 tests passed. Actual 320 × 568 browser clicks verified
opening the route help, returning to camp, opening Passport and expanding the
regional cards. The Help action buttons remain reachable while its content scrolls.

Version-three trails now generate gentle regional sequences inside Scenic
sections. One blocked lane per beat leaves two escape lanes; safe-line bones
invite steering but never require it. No full-width gaps, course bonuses or
regional mastery are attached to these optional sequences. Ordinary successful
clears and pickups remain useful. Version-one/two generation remains available.

The current version-four prototype adds a small destination rhythm on top of
that shared vocabulary. Sunleaf, Bamboo, Redrock, Oasis, Crystal and Mooncap
now rotate different ordinary hazard patterns, safe-lane cadences and pickup
offsets. Full-width action beats deliberately stay in the proven jump/slide
family; higher-clearance rocks remain lane decisions so delayed mobile inputs
do not become reaction traps. Legacy replay versions do not consult these rules.

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

### Baseline route coverage (pre-version 4)

An actual-world, cue-driven simulation of seed 1989 ran to 6,000 m with base
upgrades, once choosing Scenic and once choosing Challenge at every gate.
Both retained three hearts. Inputs used the existing action cues and steering;
this was simulation evidence, not a human difficulty or device performance test.

| Route policy | Authored courses encountered | Regional coverage |
| --- | --- | --- |
| Scenic | Five starts: 200, 1355, 2720, 4095, 5490 m | Jungle only; four distinct patterns |
| Challenge | Fourteen starts from 200 to 5990 m | All three regions; all twelve patterns |

`world.js` explicitly suppresses authored mastery courses inside Scenic sections.
Its gate resolution treats the middle lane as Scenic. Passive gate selection can
still skip the larger Challenge set, but the version-four destination rhythms
remain visible in ordinary Scenic play.
`test/runner-course-route-coverage.test.js` correctly proves Challenge reaches
all twelve courses, but does not prove a varied experience for default routing.
The existing four-run renderer aggregate also mixes three Scenic attempts with
one Challenge attempt; regional totals are not a balanced-experience metric.

## Latest portrait validation

The current source completed a three-minute portrait simulator benchmark using
the production renderer, HUD, layered area soundscape and Mochi model. It covered
all six destinations, nine marked turns, four ziplines and two rafts with no
missed turns, hits or interruption. The 10,653-frame sample measured 17 ms
median, 17 ms p95, 19 ms p99, one frame over 50 ms and an 87 ms maximum at
6,135 m. The run collected 355 bones and kept the area-specific scenery readable
through the speed ramp. The retained report is
`test-results/sustained-native-audio-latest.png`; earlier uncached and clean-panel
runs remain recorded in `sustained-mobile-qa.md` rather than hidden.

## Next design priority

Repeat this matrix on physical hardware when available, including a complete
touch-and-optional-tilt pass. Keep swipes as the default and retain the tilt
fallback when sensors are denied or
unavailable, and preserve generous warning distance around turns, rafts,
ziplines and full-width action beats. Any generator change still needs a new
replay version so old shared trails remain stable.


## Scope limits

Six visual destinations still share three mastery-region families, but version
four now gives each destination a distinct encounter accent. Existing green
tests, published graphics upgrades and old completion tables do not prove
comparative superiority. Continue judging art in motion and progression through
the default route, not only through curated previews or expert autopilots.
