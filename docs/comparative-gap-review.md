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
| Traversal variety | `ziplines.js`, generator: one aerial ride every 1,400 m; bridges retain running | Largest concrete gameplay gap: only one additional traversal mode |
| Area identity | `areas.js`, `mountain.js`, `render.js`: six palettes/silhouettes, scenery, terrain | Improved visuals; most areas still use the same movement loop |
| Replay motivation | `missions.js`, `daily-trail.js`, `rewards.js`: sequential challenge packs, daily seeds, mastery and same-trail retries | Useful local loop; no curated event itinerary or independent daily records |
| Character progression | `progression.js`, clubhouse: four shared upgrades; dogs/outfits cosmetic | Deliberate fair-design distinction, not character-ability parity |
| Audio atmosphere | `sound.js`, app event wiring: short synthesized cues | No continuous area soundscape/music system in these sources |
| Social continuity | Shared seed/target URLs and local backup | Friendly challenges, not ranked competition or automatic cloud sync |
| Mobile quality | Current browser checks and documented limited Safari simulator spot check | Sustained current-build native Safari frame pacing remains unproven |

Not every competitor feature should be copied. Accounts, global rankings, paid
revives, extra currencies and attendance penalties are not prerequisites for a
better puppy game. No new external service, paid asset or tracking is authorized
by this review. The six-million-token work history is not acceptance evidence.

## Next implementation slice: river raft

Build a second, visibly and mechanically distinct traversal encounter: the dog
rides a small raft through a readable river section. Use the existing mobile
left/right controls and swipes; do not introduce tilt-only input. Steering should
have controlled lateral drift and a clear settling response, rather than merely
renaming a zipline. Preserve generous reaction distance and a safe exit.

Acceptance gates before shipping:

1. Explicit entry, ride and exit states; no overlapping corner, gate, course or
   zipline reservation. Old replay versions retain their layouts.
2. A visible raft and seated/braced dog pose; distinct water route and obstacle
   silhouettes, with bones reachable at the rendered height.
3. Deterministic drift/steering and damage at 24/60/120 Hz, base/max upgrades and
   boosted conditions. Input buffering cannot leak into the exit.
4. Existing pause/resume, retirement, practice isolation, shields, magnets,
   scoring and save banking retain their contracts.
5. Portrait 320 × 568 and 390 × 844 checks prove entry anticipation, obstacle
   clearance, collection and safe dismount. No extra center-screen banners.
6. Repeated long-run rendering stays bounded; any budget increase is quantified,
   not silently hidden by weaker tests. Current Safari validation follows once
   the interaction works; desktop emulation is not called physical-device QA.
7. Full checks, deployment and published-file verification before release.

This slice addresses a documented gap without redefining the overall goal.
Afterward, revisit area-specific gameplay, sound atmosphere and sustained native
frame pacing. Comparative superiority still needs stronger direct experience
evidence; neither this matrix nor a green test count establishes it.
