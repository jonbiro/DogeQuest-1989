# Puppy Quest — A little adventure

[Play in your browser](https://jonbiro.github.io/DogeQuest-1989/)

Meet Biscuit: a small golden dog with a red scarf and five handcrafted trails to explore. Reach the doghouse to finish each trail. Bones are optional; elevated routes reward exploration. Checkpoint flags save your place, and retries are unlimited.

## New companion: Biscuit Dash

**Run challenges:** Complete a distance, bone-collection, or clean-clear goal in one run to earn additional upgrade points. Goals rotate and grow after each completion. Rewards are credited once when the run ends. The HUD shows live goal progress and contextual jump/slide cues. Every ten consecutive bones grants +100 points; each successful jump/slide over an obstacle grants +20 points.

Movement now uses interpolated rendering, smooth lane easing and camera follow, gradual airborne dives and slide poses, rounded models, and a soft contact shadow. Magnet bones curve toward Biscuit from all three lanes within 16 meters ahead; points are credited on arrival, once per bone. Already-attracted bones finish their trip if the magnet expires. Magnetic field rings, pickup halos, collection sparkles, and timer bars make power-up states visible; decorative effects respect reduced-motion mode.

[Play Biscuit Dash in 3D](https://jonbiro.github.io/DogeQuest-1989/runner/)

A separate mobile-first endless runner through low-poly jungle ruins. Puppy Quest is still available unchanged at the main address.

- Swipe left/right to switch among three lanes; swipe up to jump logs and down to slide under arches. A tap on the trail also jumps.
- Arrow keys or WASD do the same on desktop; Space jumps and Escape pauses. On-screen buttons support touch and keyboard activation.
- The trail now bends left and right along a continuous centerline. The road, scenery, obstacles, and pickups follow the same bends. Biscuit follows the road automatically; swipes still switch lanes.
- Jump logs and low stone blocks; slide under arches, branches, and gates. Most rows leave an open lane, but occasional full-width log/gate rows demand a jump/slide. Bone trails can lead into hazards, so they are no longer a safe-lane guide.
- Three hearts per run. A shield absorbs one hit; magnets collect nearby bones for ten seconds.
- Purple gems award 250 points; gold tokens double bone points for ten seconds; pink hearts restore one heart (up to three). Magnets and shields still appear along the trail.
- Score is distance in meters plus bone points and treasure bonuses. Bones start at 25 points. Completed runs bank their full score as upgrade points; spend them in **Paw upgrades** at camp. Four permanent upgrades improve jump lift, slide duration, magnet duration, and bone value. Each has three levels costing 500, 1,000, and 1,800 points. Purchases apply to the next run and save in this browser. No real money is involved.
- Personal best, lifetime bones, points, and upgrades save locally after completed runs or purchases. Existing records are preserved; upgrade points begin accruing with this update. Leaving an unfinished run does not bank its bones or score.
- The pace starts at 22 meters/second and reaches 36, with earlier hazards, more two-lane blockages, and denser ordinary rows. Full-width action rows have extra space afterward for recovery. Backgrounding the page pauses the run. Sound is opt-in; reduced-motion mode removes decorative movement, though running remains a visual motion-based game.

Requires WebGL2. If 3D is unavailable, the page explains the requirement and links back to Puppy Quest. No accounts, purchases, analytics, or remote asset requests.

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
- `src/runner/world.js`: seeded endless-track generation and fixed-step runner simulation.
- `src/runner/render.js`: original articulated 3D dog, instanced scenery, and recycled obstacle meshes.
- `src/runner/app.js`, `src/runner/ui.css`, `runner/index.html`: runner controls, states, saved records, and mobile interface.
- `test/runner.test.js`: route fairness, bounded object counts, movement, power-ups, collision, and a two-minute survival simulation.

Both simulations advance at 120 Hz independently of display refresh rate. Audio is generated locally and enabled by a user gesture. No external fonts or artwork are requested. Biscuit Dash uses Three.js bundled locally by esbuild; the original game does not load this bundle. The retired neon engine remains recoverable through Git history. Three.js attribution is retained in the generated bundle's linked legal notices, with its full MIT license in `runner/THREE-LICENSE.txt` in the built output.

## Deployment and verification

`npm run check` builds, verifies the distribution, runs ESLint, and executes the simulation tests. GitHub Actions deploys `master` to GitHub Pages. Browser testing should cover startup, movement, double jump, death/retry, pause, completion, and a mobile viewport. Canvas gameplay remains a primarily visual experience; HTML menus support keyboard navigation and important events are announced through a live region.

MIT license. Copyright © 2026 Jonathan Biro. See LICENSE, CONTRIBUTING.md, and SECURITY.md.
