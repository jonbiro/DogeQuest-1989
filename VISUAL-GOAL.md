# Visual audit implementation tracker

Source: 2026-09-08 audit, 25 observations, baseline 043a063.
Full goal remains active. Partial work is not completion.

| Audit item | State / next work |
| --- | --- |
| 1 Mobile camp | Pending: simplify competing labels |
| 2 Help | Partial: moves first, advanced rules collapsed; obstacle illustrations pending |
| 3 Upgrades | Pending: level/benefit/price hierarchy |
| 4 Clubhouse | Pending: previews and category navigation |
| 5 Passport | Pending: current-dog-first progress |
| 6 Portrait gameplay | Partial: larger score/action text; dog contrast pending |
| 7 Bridge approach | Pending: bones, lanes and overhead silhouette |
| 8 Results | Partial: lesson before highlights; simplify highlights |
| 9 Small results | Partial: compact heading and earlier advice; screenshot verification pending |
| 10 Small camp | Pending |
| 11 Landscape camp | Pending |
| 12 Landscape gameplay | Implemented corner controls and side guidance; camera center stays unobscured in inspected 844x390 screenshot; physical/coarse-pointer verification pending |
| 13 Pause | Preserve; regression checks remain |
| 14 Regions | Pending: depth and visual language |
| 15 Pickups | Pending: distinct silhouettes and outlines |
| 16 Powers | Pending: contrasting effects and clear state |
| 17 Movement | Pending: Mochi articulation without timing changes |
| 18 Outfits | Pending: rear/three-quarter previews |
| 19 Zipline | Pending: cable, handle and catch-zone readability |
| 20 Split rows | Pending: clearance edge |
| 21 Route choices | Pending: explicit meaning |
| 22 Mochi | Pending: fur, brow and muzzle refinement |
| 23 Turns/hills | Pending: depth; complete later-river visual coverage |
| 24 Desktop camp | Pending: name backing / secondary hierarchy |
| 25 Desktop run | Partial: removed control fading; scenery/depth pending |

## Current evidence

- All 134 tests, build, distribution validation and lint passed after the first
  help/results changes. Subsequent compact-help CSS gets fresh visual checks.
- 844x390 real-input browser run: 1,105m, three hearts, two accepted turns,
  no missed turns, zipline catch/landing, all regions, no reported HUD overlaps.
- Expanded HUD fixture checks individual buttons (44px minimum, bounds,
  guidance collisions) and reserves the middle 20% of landscape for the dog.
  Passed at 320x568, 390x844, 844x390 and 1440x900.
- Small help keeps primary/home actions in view; first capture revealed the
  third move below the fold, prompting a compact-heading adjustment.

## Required remaining gates

Fresh live publication verification for each slice; final full-motion and reduced-
motion input runs, all outfits/puppies, stacked powers, complete terrain gallery,
keyboard/focus, 200% zoom, measured contrast and non-color recognition, touch and
safe-area checks. Physical iOS/Android, glare, low-end hardware, screen-reader
usability and motion comfort require explicit evidence or a clearly recorded
external testing disposition. Do not infer these from desktop screenshots.
