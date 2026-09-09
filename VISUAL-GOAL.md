# Visual audit implementation tracker

## Scope of the active game-improvement goal

All 25 numbered audit observations below are included in the active
"improve the game" goal as ongoing acceptance criteria. Preserve completed
improvements and check for regressions while improving gameplay, physics,
visual clarity, contrast, clutter, controls, progression and power-ups.
Completed audit items are not reopened merely by adding them to this goal.
Physical-device and human usability checks remain explicitly unverified
until the necessary devices or user sessions are available.

Source: 2026-09-08 audit, 25 observations, baseline 043a063.
Final acceptance reconciled against published implementation 2a58d17.
All 25 observations are resolved or explicitly dispositioned below. Historical
slice notes retain the issues and intermediate gates found during the work;
the final acceptance summary supersedes their pending/partial statuses.

## Final acceptance summary

- Items 1–5: grouped navigation, movement-first illustrated help, readable
  upgrades with item-specific action names, actual collection previews, and
  current-puppy-first passport. Four-size layouts and native 200% zoom pass.
- Items 6–16: contact shadows and backed HUD, darker bones, clearer obstacle
  vocabulary, simpler results/failure advice, landscape corner controls and
  upper guidance, preserved pause, restrained regional scenery, eight distinct
  pickup forms inspected in grayscale, and verified combined power lifecycles.
- Items 17–21: articulated short movement poses, all 24 puppy/outfit pairs in
  both preview angles, clear zipline attachment/catch cue and camera framing,
  distinct mixed jump/slide rows, and explicit route meanings in the HUD.
- Item 22: refined silver/charcoal Mochi remains intentionally stylized. The
  close-up is not photorealistic; retain bounded strand/model complexity for
  mobile readability and performance. This is an explicit art disposition.
- Items 23–25: dark curbs, alternating wooden river-corner bands, all seven
  terrain panels inspected, backed desktop companion text and less dominant
  foreground scenery. Calm water is retained to avoid distracting reflections.
- Final trusted-input runs cover 320x568, 390x844, 844x390 and 1440x900, including
  all regions, both turns, zipline catch/landing and no HUD collisions. Final
  live desktop run: 1,141m, three hearts, 52 trusted/zero synthetic key events.
- Final renderer gate: three 4,500m runs, 54 framing checkpoints, 21 turns,
  nine ziplines and 13 split rows. Peaks: 20 geometries, five textures,
  121 objects and 204 draw calls, within existing limits.
- Keyboard/focus and held Escape checks pass. Dedicated Chrome touch gestures
  pass in portrait/landscape with verified coarse pointer and safe-area insets.
  Actual 200% Chrome zoom passes camp, help, upgrades, passport, stacked HUD
  and a 1,105m DOM-input run. Synthetic zoom inputs are not called trusted.
- All 140 tests, lint, build and artifact checks pass. Published code 2a58d17
  passed CI 34284090735 and Pages 34284090763; live assets byte-matched and
  live landscape/desktop playthroughs passed. Original 2D source is unchanged
  from the audit baseline; 0.72s jump, 0.58s base slide and 120Hz simulation remain.
- Physical iOS/Android, sunlight/glare, low-end GPU, screen-reader usability
  and human motion comfort require external devices/user sessions and are not
  claimed verified. Grayscale review and named CSS contrast checks are not
  universal recognition tests or blanket WCAG/canvas-contrast certification.

Detailed numbered evidence and screenshots are retained locally in
`../DogeQuest-1989-visual-audit-2026-09-08/final-acceptance/`, especially
`ACCEPTANCE-MATRIX.md` and `FINAL-AUDIT.md`. External device/user validation is
the explicit remaining validation boundary, not unimplemented audit work.

| Audit item | State / next work |
| --- | --- |
| 1 Mobile camp | Implemented grouped two-column actions below the dog, selected puppy named in Run action, restored compact challenge, removed phone tagline; four-size and safe-area checks pass |
| 2 Help | Implemented: actual obstacle illustrations for three basic moves, advanced rules collapsed; all illustrations load and actions remain reachable at four target sizes |
| 3 Upgrades | Implemented name/benefit/level hierarchy, level meters and readable disabled prices; final accessibility checks remain |
| 4 Clubhouse | Implemented separate category navigation and cached model previews; browsing preserves saved profile |
| 5 Passport | Implemented current puppy and next milestone first, other six cards collapsed, larger numbered/checked badges with explicit earned state; all seven cards and 21 badges retained |
| 6 Portrait gameplay | Larger score/action/region/power labels and backed hearts; conservative CSS contrast checks added for powers, hearts and region name; full scene contrast disposition remains |
| 7 Bridge approach | Partial: continuous cream bone silhouette with dark sides, darker lane inlays, consistent overhead clearance edges and reduced branch foliage; final motion/non-color checks remain |
| 8 Results | Implemented: one next puppy milestone, full rewards/stats behind an expandable section; score and failure advice stay prominent |
| 9 Small results | Implemented: 320x568 screenshot confirms score, lesson, next milestone and retry visible; expanded rewards retain fixed actions |
| 10 Small camp | Implemented grouped 44px-or-larger controls and visible challenge instead of secondary records; 320x568 screenshot inspected |
| 11 Landscape camp | Implemented grouped left-hand actions and clear right-hand dog display; 844x390 screenshot with 44px side safe areas inspected |
| 12 Landscape gameplay | Upper-right guidance now keeps every near-track lane clear (200% zoom exposed right-lane overlap in the earlier side dock); stacked HUD and trusted coarse-pointer checks pass with safe areas; physical-phone testing remains external |
| 13 Pause | Preserved; keyboard focus/held-Escape and trusted touch pause pass; background HUD now inert while modal is open |
| 14 Regions | Partial: restrained scenery scale/setback and region-resistant curb contrast; complete recognition/accessibility checks remain |
| 15 Pickups | Partial: pointed shield, faceted gem, dark tennis seams and dark-edged continuous bone silhouette implemented; color-independent testing remains |
| 16 Powers | Partial: compact darker magnet rings, stronger shield bubble and speed streaks; full stacked-HUD / motion checks remain |
| 17 Movement | Implemented Mochi-specific lowered torso and opposing front/rear leg folds, preserving short slide timing; six outfits checked in both motion modes |
| 18 Outfits | Implemented front and rear/three-quarter preview toggle; 24 combinations in each angle inspected |
| 19 Zipline | Implemented dark cable/tether, three contrasting lane grips and explicit Jump / Catch the zipline approach sign; catch timing and aerial reward rules unchanged |
| 20 Split rows | Implemented dark underside edges, light endpoint markers and stronger uprights across gate/arch/branch vocabulary; final motion checks remain |
| 21 Route choices | Implemented: Scenic / Fewer obstacles and Challenge / More points signs; final motion and non-color recognition checks remain |
| 22 Mochi | Partial: neutral charcoal palette, quieter undercoat, finer strands, recessed brows and narrower overlapping cheeks; model remains stylized/photo-inspired, not a photorealistic replica |
| 23 Turns/hills | Partial: darker curbs and alternating river-corner plank bands; all seven terrain panels now captured and inspected, including later river; water polish remains |
| 24 Desktop camp | Implemented dark name/description backing, larger companion label and grouped secondary controls; 1440x900 screenshot inspected |
| 25 Desktop run | Partial: removed control fading, reduced nearby scenery scale and increased setback; final motion coverage remains |

## Current evidence

- Expanded route wording now verified in an actual 320x568 full-motion run:
  the saved 320m capture shows both meanings on the backed guidance panel,
  above the controls and below the dog. Run completed 1,112m, three hearts,
  two turns, all regions, complete zipline, no HUD overlap, 51 trusted and
  zero synthetic keys. Publishing this verified slice does not close the
  remaining full-audit acceptance work.

- Route-choice clarification: production HUD now spells out "Scenic: fewer
  obstacles" and "Challenge: more points" beside the direction arrows, so the
  explanation does not rely solely on distant sign text or color. Added a
  visible-route variant to the stacked-HUD fixture; all four target sizes pass
  overlap and near-track boundary checks. Corrected its check to inspect the
  active route label instead of the hidden action cue. Fresh production-run
  screenshot for the expanded wording remains required before publication.

- Fresh closing terrain review: inspected all three regional courses, the
  mixed gate/log row, route-choice signs and all seven terrain checkpoints
  using top/middle/bottom captures, including the 2,962.5m river corner.
  Dark curb edges, alternating wooden bands and Mochi's contact shadow remain
  visible. Mixed rows distinguish an open slide clearance from solid jump
  obstacles. Route names are explicit; small explanatory sign text still
  requires a native-phone-distance check. Water remains deliberately calm:
  retain this low-detail treatment to keep road edges and hazards dominant,
  rather than adding reflective motion that competes with gameplay. This is
  an explicit art disposition, not a claim of a new water shader.

- Updated-bone native-size motion gate: 390x844 full-motion trusted run passed
  1,109m, three hearts, both turns, all regions and zipline catch/landing;
  55 trusted/zero synthetic key events and no HUD overlap. Inspected the
  682m capture: dark bone outlines remain visible along the aerial trail.
- Combined powers rechecked in full and reduced motion: three bones are
  pulling at 0.1s and collected by 0.4s; Zoomies has expired at 6.5s; magnet
  and double have expired at 10.5s; shield persists in all four samples.
  Fresh saved galleries show rings and speed streaks disappear with their
  powers while the shield remains. Nine geometries/two textures at the final
  sample. These deterministic lifecycle checks are not motion-comfort testing.

- Bone-contrast follow-up: darkened the existing baked edge and retained dark
  coloring across the bevel instead of blending it into the pale face. Fresh
  eight-pickup color and grayscale galleries show a clearer continuous bone
  outline against the road. Geometry, mesh/draw count, pickup size and gameplay
  behavior are unchanged. Saved evidence: `15-pickups-dark-bevel.png` and
  `15-pickups-dark-bevel-gray.png` in the closing audit folder. This establishes
  a visual improvement in the fixture, not full user-recognition or glare
  testing; native-size motion confirmation remains in the closing checklist.

- Current-build menu-label follow-up: browser accessibility snapshots confirm
  all four upgrade buttons include the upgrade name and target level; puppy
  and outfit actions include their item names, including locked prizes.
  No purchases or equipment changes were made. Seven camp controls pass
  44px-minimum target, bounds, hit-test and backed-text checks at all four
  required sizes. Conservative measured CSS text/backing contrast is at least
  7.29:1 for these tested controls, not a claim about all scene/UI contrast.
  The served local HTML, script and stylesheet byte-match the current build.

- Browser access restored on the resumed closing review. Current camera guard
  passed fresh full-motion trusted-keyboard runs at 390x844 (1,109m) and
  320x568 (1,141m): three hearts, both turns, all three regions, complete
  zipline ride, no HUD overlaps, 52 trusted and zero synthetic key events each.
  Both saved zipline screenshots were inspected; the dog remains inside frame.
  Three 4,500m renderer runs pass all 54 puppy-envelope checkpoints, 21 turns,
  nine ziplines and 13 split rows. Peaks: 20 geometries, five textures,
  121 objects and 202 draw calls. These changes remain unpublished pending
  the other closing-review checks, including distant bone contrast.

- Closing audit, current unpublished work: added camera-local framing guard
  with regression coverage across portrait/landscape, lane lag, curves and
  jump/zipline heights. Added explicit item names to collection/upgrade button
  accessibility labels and stronger camp-control backings. These changes still
  require the remaining fresh browser checks before publication.
- Trusted-input acceptance now explicitly requires at least 1,000m and two
  accepted turns; zero missed turns alone cannot pass an incomplete run.
  Added rejection tests for short runs, missing turns, duplicate regions,
  synthetic-only input, damage, incomplete zipline and HUD collisions.
- Latest continuation: browser access reports the Mac locked. Fresh browser
  verification is paused pending manual unlock; no new visual or live-release
  claim is made from the successful local regression gate.

- HUD/zoom follow-up: removed remaining 8px/9px mobile power-label overrides;
  power labels are now 11px, region label 10px, hearts have a dark backing.
  Four-size stacked HUD checks include minimum label sizes and conservative
  CSS text contrast against a white scene behind the translucent backings:
  power labels 7.44:1, hearts 6.80:1, region label 11.20:1. These measurements
  do not establish canvas contrast, all UI contrast or user recognition.
- Actual native Chrome page zoom now verified through the dedicated test
  browser's Appearance > Page zoom setting, selected at 200%. A 1440x900 test
  viewport reports 720x450 CSS pixels, DPR2 and pinch scale1. Camp, help,
  upgrades, passport and stacked HUD checks pass. Fresh camp/passport renders
  inspected. Unlike previous unsuccessful shortcut/extension attempts, this
  changes browser layout zoom and requires no access to the locked desktop.
- Zoomed gameplay exposed a right-lane dog/guidance overlap missed by the old
  central-20% check. Moved landscape guidance to the upper-right status area,
  restricted powers to its left, and added a near-track boundary check. Hid the
  decorative wordmark subtitle during landscape play to separate header/stats.
  Coarse-pointer/safe-area portrait and landscape gestures pass after the HUD
  sizing change; landscape stress fixture retains all five power indicators.
- A further live capture exposed power/score overlap, also present by two
  pixels on desktop. Added explicit score-to-power checks to both fixture and
  input-run verification; reserved additional vertical space under the score.
  Final native-200% input run reached 1,132m, three hearts, both turns, all
  regions and zipline catch/landing, with no reported HUD overlaps. Fresh
  canyon screenshot shows upper guidance clear of the right-lane dog and
  magnet status separated from the score. All 136 tests/build/lint pass.

- Compact-UI/zipline slice: camp targets, three decoded help illustrations,
  current-puppy-first passport (seven cards / 21 badges), fixed dialog actions
  and stacked HUD pass at 320x568, 390x844, 844x390 and 1440x900. Fresh small,
  desktop and safe-area camp screenshots inspected. Small passport exposes the
  current puppy and next milestone above the fixed actions; remaining badges
  are deliberately scrollable. Route-label atlas UVs rechecked visually for
  Scenic, Challenge and the new zipline sign.
- Added local-only `scripts/runner-device-qa.mjs`: actual browser touch input,
  verified `(pointer:coarse)` and `maxTouchPoints:1`, and browser safe-area
  environment overrides. Portrait 390x844 with top44/bottom34 and landscape
  844x390 with left44/right44/bottom21 both pass right/left/jump/slide/pause,
  camp hit targets and stacked-HUD checks. This is desktop browser emulation,
  not physical iOS/Android evidence. The CLI device preset alone was found not
  to enable coarse-pointer input and is not accepted as touch proof.
- Automated axe 4.12.1: compact passport and pause have zero violations and
  zero incomplete rules. Camp has zero violations but incomplete contrast
  assessment over gradients/scenery; this is not a WCAG conformance claim.
  Corrected the heart display's accessible role and made background HUD inert
  during modals; keyboard regression checks both pause and resume exposure.
- Build, distribution checks, lint and all 136 tests pass. Three 4,500m
  renderer runs retain three hearts, 21 turns, nine completed ziplines and 13
  split rows over 54 rendered checkpoints. Peak resources: 20 geometries,
  five textures, 121 objects, 204 draw calls. The one shared sign atlas is now
  1024x512; no per-sign textures or physics/save changes were introduced.
- Earlier native 200% browser zoom attempts were unverified: shortcut and test-extension
  attempts did not change the measured browser zoom. Native UI access reported
  the Mac locked; user was asked to unlock it. Resizing, DPR and pinch scaling
  were not substituted for native browser zoom. The native Settings test above
  now supersedes this blocker.
- Fresh 844x390 full-motion browser input run reached 1,105m with all three
  hearts, both turns, all three regions, a zipline catch/landing and no reported
  HUD collisions. Desktop timing sample: mean 16.66ms / p95 16.70ms; this is
  one automated desktop run, not a low-end/mobile performance certification.

- Mochi slice: compared fresh close-ups with the previous model. Rejected opaque
  clumps, ring meshes and hard alpha-cut strands because previews looked like
  scales/rings or pixelated patches. Retained the strand renderer with subtler
  palette/undercoat, finer locks, integrated brows and closer cheek transitions.
  Photo is reference-only; no external image dependency was introduced.
- Model remains deterministic and bounded: 64,288 triangles, 2,920 strand
  instances, 61 meshes, three shared geometries and two 128x128 textures.
  136 tests pass, including new finite/bounded cosmetic-crouch tests. Movement
  timing, collision logic, banking and other puppies' pose rules are unchanged.
- Six Mochi outfit slide previews inspected in full and reduced motion. Normal
  clubhouse selection followed by a 390x844 full-motion input run reached 1,105m,
  all three hearts, both turns accepted, all regions and zipline catch/landing,
  with no reported HUD overlaps. Longer renderer gate remains at 19 geometries,
  five textures, 121 objects and 204 draw calls across three 4,500m runs.

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

## Historical gate list — superseded by final acceptance summary

Fresh live publication verification for each slice; final full-motion and reduced-
motion input runs, all outfits/puppies, stacked powers, complete terrain gallery,
keyboard/focus, 200% zoom, measured contrast and non-color recognition, touch and
safe-area checks. Physical iOS/Android, glare, low-end hardware, screen-reader
usability and motion comfort require explicit evidence or a clearly recorded
external testing disposition. Do not infer these from desktop screenshots.
