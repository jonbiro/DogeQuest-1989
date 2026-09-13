# Comparative gap review — 2026-09-12

Baseline: `db6488e`. This is a source-and-code review, not a side-by-side playtest
or proof that Biscuit Dash is better than Temple Run. No competitor ratings,
download counts or promotional superlatives are treated as quality measurements.

## Current external evidence

Imangi describes running, jumping, turning and sliding through cliffs, zip lines,
mines and forests. [Official game page](https://imangistudios.com/thegames/temple-run-2/).

The App Store description lists varied destinations, character abilities and
outfits, shields/magnets/boosts, offline play and leaderboards. Apple's editorial
summary specifically identifies minecart and zip-line challenges. Recent release
notes describe recurring maps and Global Challenges. These are documented
capabilities, not independently measured quality claims.
[App Store](https://apps.apple.com/us/app/temple-run-2/id572395608).

Imangi's FAQ describes music/sound settings, objective-linked score multipliers,
offline restrictions on some challenges/store access, and same-platform cloud
progress with exceptions for currency and challenge streaks.
[Official FAQ](https://imangistudios.com/faq/).

## Biscuit Dash evidence and gaps

| Dimension | Inspected current source | Assessment |
| --- | --- | --- |
| Core decisions | `world.js`, `courses.js`: three lanes, jump/slide, route choice, authored sequences | Established foundation; automated success is not human enjoyment evidence |
| Traversal variety | `ziplines.js`, `rafts.js`, generator: aerial rides and river sections reserve their own entry/exit windows | Two distinct traversal modes now break up the running loop; more should be judged by sustained play, not feature count |
| Area identity | `areas.js`, `mountain.js`, `render.js`, `world.js`: six palettes/silhouettes, scenery, terrain and version-4 encounter rhythms | Each destination now has its own hazard cadence, safe-lane sequence and pickup emphasis while preserving the shared move vocabulary |
| Replay motivation | `missions.js`, `daily-trail.js`, `rewards.js`: sequential challenge packs, daily seeds, mastery and same-trail retries | Useful local loop; no curated event itinerary or independent daily records |
| Character progression | `progression.js`, clubhouse: four shared upgrades; dogs/outfits cosmetic | Deliberate fair-design distinction, not character-ability parity |
| Audio atmosphere | `sound.js`, `soundscape.js`, app event wiring: short synthesized cues plus sparse area motifs | Lightweight area accents are present; this is intentionally not a full soundtrack or recorded ambience system |
| Social continuity | Shared seed/target URLs and local backup | Friendly challenges, not ranked competition or automatic cloud sync |
| Mobile quality | Current browser checks plus a current-build portrait Safari simulator benchmark | Simulator evidence is now strong; physical-phone frame pacing remains unproven |

Not every competitor feature should be copied. Accounts, global rankings, paid
revives, extra currencies and attendance penalties are not prerequisites for a
better puppy game. No new external service, paid asset or tracking is authorized
by this review. Iteration volume is not acceptance evidence.

## Next implementation slice: sustained mobile feel

The latest implementation slice now validates the richer loop through a full
portrait simulator session: changing area horizons, denser version-4 rhythms,
turns, ziplines, rafts and sustained rendering. The remaining mobile-quality
work is a real touch-and-sensor pass on hardware when available. Keep the
existing left/right fallback when sensors are unavailable, and preserve generous
warning distance around turns, rafts, ziplines and full-width action beats.

Acceptance gates before shipping:

1. A current-build portrait run reaches every destination, including a marked
   turn, river section, zipline and an area relic, without an overlap or lost
   reward.
2. Version-4 area rhythms remain deterministic and clearable at 24/60/120 Hz,
   base/max upgrades and boosted conditions. Legacy replay versions retain their
   frozen layouts and rewards.
3. Swipe and tilt inputs share one lane intent without duplicate moves, stale
   sensor actions or tilt-only dead ends. Permission denial remains quiet.
4. Existing pause/resume, retirement, practice isolation, shields, magnets,
   scoring and save banking retain their contracts.
5. Portrait 320 × 568 and 390 × 844 checks prove entry anticipation, obstacle
   clearance, collection, HUD readability and safe traversal exits. No extra
   center-screen banners.
6. Repeated long-run rendering stays bounded; any budget change is quantified.
   Safari simulator results remain separate from physical-phone claims.
7. Full checks, deployment and published-file verification happen before the
   next release claim.

This slice turns the newly added encounters and motifs into a measurable mobile
experience without redefining the overall goal. Comparative superiority still
needs stronger direct experience evidence; neither this matrix nor a green test
count establishes it.
