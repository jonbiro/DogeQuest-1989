# Changelog

Notable changes to Puppy Quest 1989 are recorded here. The project does not currently publish signed release tags; `2.0.0` below describes the current development baseline rather than a package registry release.

## Unreleased

- Scheduled wade stones and root rails on fixed endless grids (water at
  4,160, rails at 3,310, every 1,400 meters) after a survey found the row
  lottery emitting ~zero of either per 9,000 meters and no 130-meter wade
  window anywhere in adventures. Courses yield on true overlap only, chase
  reservations cover both chapters, and legacy trail hashes are untouched.
- Narrowed rail-break pairs from fourteen meters apart to ten so one
  well-timed jump honestly clears both inside a ~280ms window.
- Locked the mid-ski fork in tests: the 1,750 fork resolves passively while
  the ride owns the banner, all early forks count, and none strands pending.
- Board the minute-one Frostpeak slope: version-six trails ski at 1,667 m
  (riding before the 60-second mark) with the 1,750 fork resolving passively
  mid-descent. The moving gate slides into the old chase slot at 1,400 and the
  puppy chase moves out to 2,780, so every adventure keeps all verbs and
  nothing overlaps. Also fixed a latent unfair slope: every third yeti
  crossing walked its wide body through its own safe lane; crossings now step
  to the neighboring lane so the untouched lane stays genuinely safe.
- Dealt every 2D trail fresh: biome themes stay, layouts generate per game from
  a seed, and a bot-verifier proves each deal finishable before it ships, so no
  two sessions repeat and none loops unfairly. Retries replay the same deal;
  menu, continue, next and replay deal anew. Trails also greet the player in
  day, golden, dusk or night light with matching clouds, stars, fireflies and
  a lit doghouse porch, while background phases, a tail wag and reachable
  platform staircases keep repeat visits visually new.
- Broke the root-rail log in two places: hop the striped breaks (one timed
  jump clears the span) while steering the bone line, with its own miss
  coaching when the hop comes late.
- Rebuilt climb bone lines as three well-spaced pickups that bend across
  lanes, so pumping and steering combine; the edge cue now points at bones
  first since the exit needs no action.
- Corrected stale help copy (mine-cart distance, Frostpeak availability) and
  kept wade stones an endless chapter after verifying no fair adventure slot.
- Added a duck move and hanging vines to all five 2D trails, with per-world
  enemy rhythms (hoppers, chargers), moving ferry platforms, signposts
  teaching the tuck, a visible crouch sprite, and dive-on-hold in mid-air.
  Releasing duck under a vine keeps the tuck until headroom clears, and
  beetles still meet the full standing height so tucking never grants immunity.
- Added climbable vine walls and a glide canopy to runner adventures, plus
  hop-friendly wade stones and steerable root rails in endless. Adventures
  now run 2.6 km and include the moving gate; mine-carts and Frostpeak debut
  earlier in endless.
- Added wall-pump, shimmer-glide, mine-cart steering and Frostpeak skiing
  practice drills, and routed cart/ski failures to them from results.
- Taught the run HUD a first-charge Fetch hint (once per profile), a hazard
  key beside the pickup key, and bond requirements on Pepper and Luna so the
  roster signals skill as well as savings.
- Added fourth upgrade levels (3,000 points each) with full refunds, and
  widened early-game margins: a gentler speed ramp, earlier weave hints, a
  renewal slide prompt, and a brief slide-expiry grace at the collision plane.
- Refined the zipline hang composition with a warm, rounded handhold and
  high-contrast end caps that sit behind the puppy's raised paws. Hanging
  paintings now normalize their transparent matte before upload, removing the
  dark/gray fringe that could show through the gap between the arms on desktop
  and mobile.
- Guarded the render loop against mobile GPU or texture draw exceptions. A
  failed frame now opens the existing 3D recovery screen instead of silently
  stopping animation and leaving the runner looking stuck.
- Hardened held touch steering for real thumbs: same-direction lane moves now
  re-arm only after the finger stops briefly, so slow over-swipes cannot walk
  the puppy across the trail. Guidance now says “STOP, THEN DRAG AGAIN” while
  preserving no-lift axis changes and the button fallback.
- Made the held-drag pause detector ignore tiny resting-thumb jitter, so a
  player can pause and continue a no-lift lane drag even when a phone emits
  small pointer samples beneath a stationary finger.
- Reworded touch onboarding around one clear rule: one swipe equals one move;
  the pause-and-drag continuation is now explicit without suggesting that a
  single long swipe should steer across the whole trail.
- Fixed no-lift reversals on sampled touch paths. A thumb can now drag back in
  several small steps to change lanes; the complete opposite segment counts as
  one deliberate move instead of being mistaken for jitter.
- Applied the same sampled-path handling when a held horizontal drag turns into
  a jump or slide, so fast over-swipes no longer strand the next vertical move.
- Added a release-time fallback for browsers that coalesce the final reverse,
  jump, or slide samples into `pointerup`, preserving one deliberate action.
- Processed coalesced touch samples in order, so a fast held swipe keeps its
  direction changes even when Chrome reports the whole path as one event.
- Replaced abstract touch coaching with the literal action “STOP, THEN DRAG
  AGAIN,” making the no-lift pause easier to understand at a glance.
- Bounded a hung mobile motion-permission request so the runner returns to
  touch controls instead of waiting forever with gameplay paused.
- Made full WebGL2 presentation the runner's only default: browsers with GPU
  acceleration disabled now receive an actionable 3D setup screen instead of a
  silent 2D downgrade. Chrome's hardware-acceleration steps are shown inline,
  and “Try 3D again” performs a cache-busted re-probe after relaunch.
- Normalized the alternate puppy paintings against each dog's canonical watercolor
  artwork. Removed generated matte halos and cutout gaps, restored the correct
  coat/collar palette for every action and sailor frame, and re-measured visible
  alpha bounds so swapping poses no longer causes a size or baseline pop.
- Added a dedicated sailor rafting look for every puppy. Each dog now swaps to a
  connected, transparent captain painting with a navy cap, striped neckerchief,
  and anchor detail when boarding the river raft; the shared streaming slot
  keeps the richer art within the mobile texture budget while a gentle bob and
  paddle sway follow the raft's movement.
- Added paired animated raft paddles with a reduced-motion-safe stroke, tying
  the sailor puppy to the boat visually while preserving the shared geometry
  budget.
- Added a Mochi-specific rear chase-camera painting based on the supplied
  running-away references. Normal ground runs now show his curled tail, back,
  collar, and lifted paws moving away from the player, with a subtle whole-body
  bounce, tail-side mirror, and lane lean; jump, slide, turn, raft, and zipline
  actions keep their dedicated silhouettes.
- Refined Mochi's stride painting from the additional supplied frames. His
  stretched side-gallop silhouette now alternates two authored phases during
  real route bends and lane banks, while straightaways stay on the rear chase
  view and the extra phase uses the final mobile texture-budget slot.
- Added a second authored beat for every runner move across the dog roster.
  Biscuit, Pepper, Luna, and Mochi now stream alternate run, jump, slide, turn,
  and zipline-hang paintings through one bounded action slot; Mochi keeps his
  supplied side-gallop as the bend-specific phase.
- Added authored zipline hanging paintings for all four puppies. The new
  transparent frames keep paws connected to each body, align them to the cable
  handle, hide mismatched costume plates while suspended, and add a restrained
  swing/kick so every ride feels animated rather than like a frozen jump.
- Added physics-timed puppy takeoff and touchdown feedback: authored jump poses now
  react to ascent/descent velocity, landings get a restrained squash-and-roll, and
  small local paw particles make both contacts readable without screen shake or
  extra HUD copy.
- Replaced the straight runner corridor with a continuously winding track; road sections, scenery, pickups, and hazards share the curved centerline.
- Raised difficulty with a 22–36 m/s pace, earlier/denser obstacles, frequent two-lane blockages, full-width jump/slide rows, and riskier bone trails. Kept readable cues, forgiving inputs, and recovery space after action rows.

- Added rotating, increasingly challenging run goals with one-time earned upgrade-point rewards and live progress.
- Added bone-streak and clean-clear score bonuses, live score/streak display, and contextual jump/slide warnings. Fixed repeated streak resets from already-missed bones and aligned menu keyboard order with its visual layout.

- Smoothed runner rendering with fixed-step interpolation, frame-rate-independent lane easing, eased camera and slide poses, and non-teleporting airborne slides. Rounded models, softened lighting/shadows, and reduced HUD churn.
- Rebuilt magnets with visible all-lane bone attraction, arrival-based scoring, larger readable horseshoe pickups, field rings, pickup halos, sparkles, and active power-up timer bars. Added expiry, range, high-speed attraction, and motion regressions.

- Made Biscuit Dash faster (18–32 m/s), with higher/longer jumps, jump buffering, instant slides, earlier swipe response, and more forgiving collision timing. Low stone blocks can now be jumped.
- Added slide-under branches and hanging gates, treasure gems, double-bone-point tokens, healing hearts, and more frequent bonus pickups.
- Added earned upgrade points and a permanent four-track Paw upgrades shop, preserving existing records. Added timing, new obstacle, bonus, and upgrade-economy regression tests.

- Added Biscuit Dash, a separate original 3D endless-runner companion at `/runner/`, without replacing Puppy Quest.
- Added swipe/keyboard/button controls, seeded fair-lane track generation, logs and slide arches, bone magnets, shields, three-heart runs, local records, pause-on-background, and reduced decorative motion.
- Added an articulated low-poly Biscuit, jungle ruins, batched scenery, pooled obstacles, and local Three.js bundling. Added eight runner simulation tests, including long-run survival and generation bounds.

- Rebuilt the game from scratch around Biscuit, five handcrafted outdoor courses, double jumps, beetles, optional bones, checkpoint flags, unlimited retries, and doghouse goals.
- Replaced the neon presentation with original puppy artwork, layered outdoor scenery, a cream-and-green interface, and touch controls below the game.
- Retired the previous runtime and replaced its tests with simulation regressions for the new engine. Removed external font requests.

- Made the game start reliably with Enter, Space, the start button, or a tap/click anywhere on the opening panel.
- Rebuilt the opening screen, HUD, level-select grid, mission briefing, and results flow with a more cohesive responsive arcade presentation.
- Added ten named world themes with individual palettes, taglines, par times, and tempo variations.
- Added real event scoring, capped combo multipliers, time/combo completion bonuses, C-to-S speedrun ranks, and saved per-world records.
- Added rare golden bones to generated worlds; collecting one awards extra points, refreshes dash, and activates turbo speed.
- Expanded automated coverage from 24 to 31 tests for world metadata, scoring, ranks, formatting, golden-bone behavior, and existing game systems.
- Added repository documentation, contribution guidance, security policy, community standards, and issue/pull-request templates.
- Documented the live GitHub Pages deployment, procedural level behavior, mobile controls, persistence, and browser setup.
- Added a clean static build, lint/test check, deterministic level-generation hooks, and automated coverage for core level and actor behavior.
- Hardened lifecycle, visibility, input-reset, persistence, level-plan validation, and final-level handling.
- Added responsive short-screen onboarding, live gameplay announcements, power-up status, and in-pause help.
- Removed unused legacy level definitions and image assets from the production path.
- Fixed terminal-state actor updates, stale coin-block rewards, overlapping collision priority, breakable-wall momentum, and immediate death-stat persistence.
- Cached wall, skyline, gradient, star, and nebula rendering; culled offscreen actors and particles; compacted transient arrays in place; and added complete visual/audio teardown.
- Updated GitHub Actions to their current major releases and grouped future Dependabot updates.

## 2.0.0 development baseline — 2026-02-09

### Added

- Modular ES module architecture with a game loop, level parser, actor system, particles, combo feedback, and screen effects.
- Neon/synthwave rendering, parallax scenery, transitions, synthesized music, and expanded sound effects.
- Difficulty-scaled procedural level generation with springs, moving/falling lava, spikes, patrol enemies, power-ups, breakable walls, and interactive blocks.
- Pause/restart and level selection, tutorials, saved progression, high score, play statistics, colorblind mode, mobile touch controls, and optional haptic feedback.
- Stompable patrol enemies, refreshed player physics and rendering, and a game-over flow.

### Changed

- Reworked the player presentation and movement feel, including double jump, dash, coyote time, jump buffering, wall slide, and wall jump behavior.
- Improved backgrounds, particle trails, lava effects, HUD feedback, screen shake, and audio polish.

## Legacy

- The original DogeQuest-1989 experience was a keyboard-driven browser platformer. The current project retains that repository name for continuity while using **Puppy Quest 1989** as the in-game title.
