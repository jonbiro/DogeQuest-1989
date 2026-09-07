# Puppy Quest — A little adventure

[Play in your browser](https://jonbiro.github.io/DogeQuest-1989/)

Meet Biscuit: a small golden dog with a red scarf and five handcrafted trails to explore. Reach the doghouse to finish each trail. Bones are optional; elevated routes reward exploration. Checkpoint flags save your place, and retries are unlimited.

## Play

Click **Let’s go outside** or press Enter with the start button focused.

- A/D or arrow keys: move.
- Space, W, or Up: jump. Press again for a double jump; release early for a shorter hop.
- Shift: run.
- Escape: pause/resume.
- Touch controls appear below the game on small screens and touch devices.

Hop on beetles from above. Each trail awards one star for reaching home, one for finding at least 65% of bones, and one for finishing without retries. Best times and star counts are saved locally in this browser. No account is needed.

## Development

Requires Node.js 20.19+ and npm.

```sh
npm ci
npm run check
npm start
```

Open http://127.0.0.1:3000. Run `npm run build` again after changes; the server serves the static `dist` directory. The game uses native ES modules and must be served over HTTP.

## Architecture

- `src/rebuild/world.js`: handcrafted course data and deterministic fixed-step physics.
- `src/rebuild/render.js`: original Canvas artwork, puppy animation, scenery, and camera.
- `src/rebuild/app.js`: input, audio, UI states, progression, and persistence.
- `index.html`, `css.css`: responsive game shell and accessible HTML controls.
- `test/rebuild.test.js`: movement, checkpoints, completion, and collision regression checks.

The simulation advances at 120 Hz independently of display refresh rate. Audio is generated locally and enabled by a user gesture. No external fonts, artwork, or runtime libraries are requested. The retired neon engine remains recoverable through Git history.

## Deployment and verification

`npm run check` builds, verifies the distribution, runs ESLint, and executes the simulation tests. GitHub Actions deploys `master` to GitHub Pages. Browser testing should cover startup, movement, double jump, death/retry, pause, completion, and a mobile viewport. Canvas gameplay remains a primarily visual experience; HTML menus support keyboard navigation and important events are announced through a live region.

MIT license. Copyright © 2026 Jonathan Biro. See LICENSE, CONTRIBUTING.md, and SECURITY.md.
