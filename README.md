# Puppy Quest 1989

Puppy Quest 1989 is a neon, retro-styled browser platformer built with vanilla JavaScript, HTML, CSS, and the Canvas 2D API. The project lives in the legacy `DogeQuest-1989` repository, but **Puppy Quest 1989** is the canonical in-game name.

[Play Puppy Quest 1989 online](https://jonbiro.github.io/DogeQuest-1989/)

Collect every bone in a level, use the movement abilities to cross the course, and avoid lava, spikes, and patrol enemies. A level is complete when all of its bones have been collected.

## Features

- Canvas-rendered neon/synthwave presentation with procedural player art, parallax scenery, particles, screen transitions, screen shake, and combo feedback.
- Responsive platforming physics: acceleration, air control, coyote time, jump buffering, variable jump height, double jump, wall slide, and wall jump.
- Hazards and interactive objects: stationary and moving lava, falling lava, spikes, patrol enemies that can be stomped, springs, breakable walls, question blocks, speed boosts, and shields.
- Synthesized sound effects and background music through the Web Audio API; no audio files are required.
- Ten selectable level slots: a fixed tutorial followed by nine procedurally generated levels whose layouts vary between successful runs. A level layout is cached while retrying it, then regenerated when it is completed.
- Pause/resume, restart, level select, game-over flow, lives, timer, combo scoring, high score, and progress persistence.
- Keyboard controls plus touch controls on small/coarse-pointer devices. Haptic feedback is used when the browser supports it.
- A colorblind display option is available from the pause menu.

## Controls

| Action | Keyboard | Touch |
| :--- | :--- | :--- |
| Move | `Arrow Left` / `Arrow Right` or `A` / `D` | Left and right buttons |
| Jump | `Arrow Up`, `W`, or `Space` | `JUMP` |
| Double jump | Press jump again while airborne | Tap `JUMP` again while airborne |
| Wall jump | Press jump while sliding against a wall | Tap `JUMP` while sliding against a wall |
| Dash | Hold `Shift`; direction follows movement input or the last facing direction | Hold `DASH` |
| Pause / resume | `Escape` | Use the pause menu when available |

Click **START GAME** once before playing. This user gesture also lets browsers enable the synthesized audio. On mobile, hold a movement or action button for continuous input; vibration is optional and depends on device/browser support.

## Local development

The game uses native ES modules, so serve it over HTTP instead of opening `index.html` directly from the filesystem.

### Requirements

- Node.js 20.19 or newer is required by the development tooling.
- npm, included with Node.js.

### Run it

```bash
git clone git@github.com:jonbiro/DogeQuest-1989.git
cd DogeQuest-1989
npm ci
npm run check
npm start
```

`npm start` builds the static site into `dist/` and serves that directory. Open the local URL printed by the server, usually `http://localhost:3000`. There is no bundler or server-side runtime; the build step copies the browser files into a clean deployable directory. To build without starting a server, run `npm run build`.

Run `npm run check` before submitting changes. It builds the static site, lints the project, and runs the Node test suite without requiring a browser. For gameplay changes, also test a complete level in a desktop browser and on a touch-capable viewport.

### Troubleshooting

- A blank page or module error usually means the file was opened directly; use `npm start` or another local HTTP server.
- Sound may remain silent until **START GAME** is clicked because browsers require a user gesture before starting an `AudioContext`.
- Progress, unlocked levels, high score, death count, play time, and the colorblind preference are stored in this browser's `localStorage`. Clearing site data resets them.
- Procedural layouts use randomness, so exact level geometry and screenshots can differ between fresh runs.

## Project structure

| Path | Purpose |
| :--- | :--- |
| `index.html` | Game shell, overlays, HUD, start screen, and touch controls. |
| `css.css` | Neon/CRT styling, responsive layout, overlays, and mobile controls. |
| `src/main.js` | Application entry point, tutorial plan, and level catalogue. |
| `src/Game.js` | Game lifecycle, animation loop, progression, pause menu, persistence, and level selection. |
| `src/Level.js` | Tile-plan parsing, actor management, collisions, scoring, and win/loss state. |
| `src/LevelGenerator.js` | Difficulty-scaled procedural level generation. |
| `src/actors/Actors.js` | Player, lava, bone, spring, spike, patrol, power-up, breakable-wall, and question-block actors. |
| `src/CanvasDisplay.js` | Canvas renderer, camera, HUD updates, particles/effects, and procedural player art. |
| `src/Input.js` | Keyboard and touch input handling. |
| `src/particles/ParticleSystem.js` | Transient particle effects. |
| `src/utils/` | Vector math and Web Audio helpers. |
| `scripts/build.js` | Copies the static site into the clean `dist/` deploy directory. |
| `test/` | Node-based unit tests for deterministic utilities and level generation. |

The first level slot is the fixed tutorial. Slots 2–10 are generated with increasing difficulty. Completing a slot unlocks the next one and saves the result locally. Completing slot 10 shows the quest-complete screen and offers a fresh run.

## Accessibility and device support

- Keyboard play is supported throughout the game, and touch controls appear on small or coarse-pointer devices.
- The pause menu includes a colorblind display option and exposes restart, level selection, and quit actions without requiring a page reload.
- The game is primarily a visual Canvas experience. When changing overlays or controls, preserve readable text, keyboard access, visible focus, touch targets, and non-color cues. Test CRT/glow animations with reduced-motion settings in mind.
- Audio is synthesized locally in the browser; no account or server connection is needed to play. The page currently requests the `Press Start 2P` font from Google Fonts.

## Deployment

The production deployment is GitHub Pages:

[https://jonbiro.github.io/DogeQuest-1989/](https://jonbiro.github.io/DogeQuest-1989/)

To deploy another static host, run `npm run build` and publish `dist/`. Use HTTPS and preserve the relative source and stylesheet paths; no bundling or server-side runtime is required. After pushing to the default branch, confirm the GitHub Pages build completes and smoke-test the deployed start screen, module loading, touch controls, audio gesture, and a level transition.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Use the issue forms for reproducible bugs and scoped feature proposals. Do not add third-party art, fonts, sounds, or code without recording its source and license.

For security-sensitive reports, follow [SECURITY.md](SECURITY.md) rather than opening a public issue. The community expectations are in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the current development history and notable gameplay phases.

## License

Copyright © 2026 Jonathan Biro.

This project is licensed under the MIT License. See [LICENSE](LICENSE) for the complete text.
