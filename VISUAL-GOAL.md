# Visual audit implementation tracker

Source: 2026-09-08 audit, 25 observations, baseline 043a063.
Full goal remains active. Partial work is not completion.

| Audit item | State / next work |
| --- | --- |
| 1 Mobile camp | Partial: floating puppy card removed on phones; selected puppy named in Run action; challenge no longer covered at 390x844; secondary text hierarchy remains |
| 2 Help | Implemented: actual obstacle illustrations for three basic moves, advanced rules collapsed; all illustrations load and actions remain reachable at four target sizes |
| 3 Upgrades | Implemented name/benefit/level hierarchy, level meters and readable disabled prices; final accessibility checks remain |
| 4 Clubhouse | Implemented separate category navigation and cached model previews; browsing preserves saved profile |
| 5 Passport | Partial: separate Passport category, current dog first; richer badge presentation remains |
| 6 Portrait gameplay | Partial: larger score/action text; dog contrast pending |
| 7 Bridge approach | Partial: continuous cream bone silhouette with dark sides, darker lane inlays, consistent overhead clearance edges and reduced branch foliage; final motion/non-color checks remain |
| 8 Results | Implemented: one next puppy milestone, full rewards/stats behind an expandable section; score and failure advice stay prominent |
| 9 Small results | Implemented: 320x568 screenshot confirms score, lesson, next milestone and retry visible; expanded rewards retain fixed actions |
| 10 Small camp | Pending |
| 11 Landscape camp | Pending |
| 12 Landscape gameplay | Implemented corner controls and side guidance; camera center stays unobscured in inspected 844x390 screenshot; physical/coarse-pointer verification pending |
| 13 Pause | Preserve; regression checks remain |
| 14 Regions | Partial: restrained scenery scale/setback and region-resistant curb contrast; complete recognition/accessibility checks remain |
| 15 Pickups | Partial: pointed shield, faceted gem, dark tennis seams and dark-edged continuous bone silhouette implemented; color-independent testing remains |
| 16 Powers | Partial: compact darker magnet rings, stronger shield bubble and speed streaks; full stacked-HUD / motion checks remain |
| 17 Movement | Pending: Mochi articulation without timing changes |
| 18 Outfits | Implemented front and rear/three-quarter preview toggle; 24 combinations in each angle inspected |
| 19 Zipline | Partial: dark cable/tether and contrasting grip; approach catch-zone work remains |
| 20 Split rows | Implemented dark underside edges, light endpoint markers and stronger uprights across gate/arch/branch vocabulary; final motion checks remain |
| 21 Route choices | Implemented: Scenic / Fewer obstacles and Challenge / More points signs; final motion and non-color recognition checks remain |
| 22 Mochi | Pending: fur, brow and muzzle refinement |
| 23 Turns/hills | Partial: darker curbs and alternating river-corner plank bands; all seven terrain panels now captured and inspected, including later river; water polish remains |
| 24 Desktop camp | Partial: dark name/description backing and larger companion label verified at 1440x900; secondary hierarchy remains |
| 25 Desktop run | Partial: removed control fading, reduced nearby scenery scale and increased setback; final motion coverage remains |

## Current evidence

- Trail-clarity slice: redesigned the bone as one continuous beveled shape with
  baked cream faces and dark sides. Replaced the initial multi-lobe attempt after
  screenshots showed internal ring clutter. Remains one mesh/draw per pickup.
  Regional bridge/course and split-row screenshots inspected; lane and curb
  colors stay dark instead of washing out into each region's stone palette.
- All seven terrain panels inspected using separate top, middle and bottom
  captures. The 2,962.5m river corner now has alternating wooden bands and dark
  curb edges. New tests check finite/reused geometry, both plank colors, and
  material-space curb luminance separation inside each of three region palettes.
  These are rendering regressions, not a claim of screen-space WCAG compliance.
- Overhead arch, gate and branch now share a dark clearance edge with two light
  endpoints; branch foliage reduced. Non-gateway scenery is smaller and farther
  from the road. No movement, collision, reward or saved-profile rules changed.
- Renderer checks: three 4,500m runs, three hearts throughout, 21 turns, nine
  ziplines and 13 split rows. Peak 19 geometries, five textures, 121 pooled/active
  objects and 204 draw calls, within the unchanged limits. Regression suite now
  has 135 tests, including the new curb-color test.
- Fresh 1440x900 reduced-motion input run: 1,105m, three hearts, two accepted
  turns, all regions, zipline catch/landing and no reported HUD overlap. Inspected
  all eight pickup silhouettes in a grayscale gallery: forms remain distinct;
  this is not a substitute for user recognition or color-vision testing.

- Guidance/results slice: illustrated help uses the actual obstacle meshes and
  existing renderer, with three cached images and no new GPU context. Images
  loaded and modal actions remained reachable at all four target sizes. Fresh
  320x568 input run after opening help: 1,105m, three hearts, both turns accepted,
  all regions, zipline catch/landing, no HUD overlaps. Keyboard focus restoration
  for help/shop/clubhouse and pause/resume passed. Stacked HUD passed four sizes.
- Three 4,500m rendering runs: 19 geometries, five textures, 121 objects, 200
  draw calls maximum; three hearts throughout, 21 turns and nine ziplines.
  Texture budget intentionally changed from four to five for one shared fixed
  route-label atlas, not a texture per sign. Physics and reward banking unchanged.
- Camp screenshots exposed a name/challenge overlap at 390x844, fixed by naming
  the puppy in the primary Run action and hiding the floating phone card.
  Desktop retains the new dark backing. All 134 regression tests pass.

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
