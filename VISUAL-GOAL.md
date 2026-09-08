# Visual audit implementation tracker

Source: 2026-09-08 audit, 25 observations, baseline 043a063.
Full goal remains active. Partial work is not completion.

| Audit item | State / next work |
| --- | --- |
| 1 Mobile camp | Pending: simplify competing labels |
| 2 Help | Partial: moves first, advanced rules collapsed; obstacle illustrations pending |
| 3 Upgrades | Implemented name/benefit/level hierarchy, level meters and readable disabled prices; final accessibility checks remain |
| 4 Clubhouse | Implemented separate category navigation and cached model previews; browsing preserves saved profile |
| 5 Passport | Partial: separate Passport category, current dog first; richer badge presentation remains |
| 6 Portrait gameplay | Partial: larger score/action text; dog contrast pending |
| 7 Bridge approach | Pending: bones, lanes and overhead silhouette |
| 8 Results | Partial: lesson before highlights; simplify highlights |
| 9 Small results | Partial: compact heading and earlier advice; screenshot verification pending |
| 10 Small camp | Pending |
| 11 Landscape camp | Pending |
| 12 Landscape gameplay | Implemented corner controls and side guidance; camera center stays unobscured in inspected 844x390 screenshot; physical/coarse-pointer verification pending |
| 13 Pause | Preserve; regression checks remain |
| 14 Regions | Pending: depth and visual language |
| 15 Pickups | Partial: pointed shield, faceted gem and dark tennis seams implemented; bone contours and color-independent testing remain |
| 16 Powers | Partial: compact darker magnet rings, stronger shield bubble and speed streaks; full stacked-HUD / motion checks remain |
| 17 Movement | Pending: Mochi articulation without timing changes |
| 18 Outfits | Implemented front and rear/three-quarter preview toggle; 24 combinations in each angle inspected |
| 19 Zipline | Partial: dark cable/tether and contrasting grip; approach catch-zone work remains |
| 20 Split rows | Pending: clearance edge |
| 21 Route choices | Pending: explicit meaning |
| 22 Mochi | Pending: fur, brow and muzzle refinement |
| 23 Turns/hills | Pending: depth; complete later-river visual coverage |
| 24 Desktop camp | Pending: name backing / secondary hierarchy |
| 25 Desktop run | Partial: removed control fading; scenery/depth pending |

## Current evidence

- Clubhouse follow-up: 24 front and 24 rear puppy/outfit thumbnails rendered
  and inspected, with no duplicate/empty PNGs. Uses the existing GPU context,
  caches by puppy/outfit/angle, restores scene visibility and viewport, then
  redraws the equipped appearance. No new renderer or WebGL context per card.
- Category switching passed, all four puppy images loaded, and the saved
  profile was unchanged by browsing. Primary/Home actions remain reachable
  at 320x568, 390x844, 844x390 and 1440x900. Full regression suite: 134 tests.

- Pickup/effect follow-up: all 134 tests, lint, build and distribution checks
  passed. Fresh pickup, combined-effect and phone zipline previews inspected.
  Three 4,500m renderer runs retain three hearts, with 21 turns, nine ziplines
  and 13 split rows. Resource peaks remain below budget (17 geometries,
  four textures, 121 objects). Phone input run reached 1,132m with all hearts,
  two correct turns, zipline catch/landing and no reported HUD overlaps.
  Cable thickness was reduced again after the close-up showed excessive width;
  its stronger color contrast is retained. No movement or collection rules changed.

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
