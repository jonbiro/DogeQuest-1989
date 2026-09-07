# Changelog

Notable changes to Puppy Quest 1989 are recorded here. The project does not currently publish signed release tags; `2.0.0` below describes the current development baseline rather than a package registry release.

## Unreleased

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
