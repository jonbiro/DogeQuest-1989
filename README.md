# Puppy Quest — A little adventure

[Play in your browser](https://jonbiro.github.io/DogeQuest-1989/)

Meet Biscuit: a small golden dog with a red scarf and five handcrafted trails to explore. Reach the doghouse to finish each trail. Bones are optional; elevated routes reward exploration. Checkpoint flags save your place, and retries are unlimited.

## New companion: Biscuit Dash

**Run challenges:** Complete a distance, bone-collection, or clean-clear goal in one run to earn additional upgrade points. Goals rotate and grow after each completion. Rewards are credited once when the run ends. A compact strip above the controls shows one useful item at a time: an action cue, route choice, important notice or unfinished goal. No center-screen banners or repeated run tutorials. Every ten consecutive bones grants +100 points; each successful jump/slide over an obstacle grants +20 points.

Movement uses interpolated rendering, momentum-aware lane changes, smooth camera follow and accelerated airborne dives. A jump pressed just before landing is buffered for the next takeoff; diving preserves the full ground-slide duration. Velocity-driven leaning and a brief landing compression add weight without changing obstacle clearance. Decorative weight effects respect reduced-motion mode. Magnet bones curve toward Biscuit from all three lanes within 16 meters ahead; points are credited on arrival, once per bone. Already-attracted bones finish their trip if the magnet expires. Magnetic field rings, pickup halos, collection sparkles, and timer bars make power-up states visible.

Jumps return to the ground in 0.72 seconds at every upgrade level; Spring paws adds 10% height per level instead of longer airtime. Standard slides last 0.58 seconds, rising to 0.79 seconds with all three upgrades. Action hints anticipate the puppy's physical lane and disappear when the current move already covers the obstacle. Swipes wait for a clear horizontal or vertical direction to avoid accidental diagonal actions.

[Play Biscuit Dash in 3D](https://jonbiro.github.io/DogeQuest-1989/runner/)

A separate mobile-first endless runner through jungle ruins, a sunlit canyon and a moonlit crystal glade. Puppy Quest is still available unchanged at the main address.

- Choose Biscuit, Mochi, Pepper or Luna in **Puppies & outfits**. Six visible outfits include an explorer hat/backpack, superhero cape, raincoat and prize-only crown/party hat. Puppies and outfits are cosmetic; upgrades work with every puppy.
- Mochi has a dedicated, photo-inspired model: soft silver-and-charcoal curls, long dark ears, warm brown eyes and a cream beard, eyebrows and paws. The animated coat is generated locally; no reference photograph is included or downloaded.
- Earn four permanent prizes by reaching distance and bone goals or banking presents. The prize cabinet shows exact progress. The crown unlocks at 1,000 meters in one run; three banked gifts unlock the party hat. No reward is granted twice.
- Cross wooden bridges, jump broken trail sections, and choose gentler **Scenic** or tougher **Challenge** sections. Challenge clears pay 60 points. Jump into a turquoise **Sky Paws** handle to ride a 140-meter zipline, steer for airborne bones and land for a 250-point bonus.
- Regional courses now play differently: **Root scramble** alternates jumps and ducks, **Canyon crossings** links two gap jumps with a log, and **Crystal slalom** rewards left/right/center lane changes around crystal clusters. Follow all three beats for +180 points, then collect the gift in a clear recovery stretch. At most one course appears per region visit, away from marked corners, route decisions and ziplines; Scenic excludes them. Ordinary jump/slide timing is unchanged.

- Swipe left/right to switch among three lanes; swipe up to jump logs and down to slide under arches. A tap on the trail also jumps.
- Arrow keys or WASD do the same on desktop; Space jumps and Escape pauses. On-screen buttons support touch and keyboard activation.
- The trail has real 90° corners, gentle climbs and descents. At lime chevron signs, swipe in the displayed direction during the turn cue; one swipe commits the corner for +100 points. A wrong swipe can be corrected before the corner. Missing it costs one heart (or a shield) and recovers safely. Swipes switch lanes between marked turns; ordinary winding bends remain automatic. Turn approaches and recovery stretches stay free of hazards.
- The finish screen shows clean turns, obstacle clears and best bone streak, with a brief tip explaining the final mistake. Retry remains one tap away.
- Jump logs and low stone blocks; slide under arches, branches, and gates. Most rows leave an open lane, but occasional full-width log/gate rows demand a jump/slide. Bone trails can lead into hazards, so they are no longer a safe-lane guide.
- Three hearts per run. A shield absorbs one hit; collecting another while protected awards 100 points instead of stacking protection. Magnets collect nearby bones for ten seconds.
- Purple gems award 250 points; gold tokens double bone points for ten seconds; pink hearts restore one heart (up to three), or award 100 points at full health. Magnets and shields still appear along the trail.
- Tennis balls trigger six seconds of **Zoomies**: faster running, protected obstacle smashes and automatic gap jumps. Presents give 100 points and count toward the party outfit when the run ends.
- Score is distance in meters plus bone points and treasure bonuses. Bones start at 25 points. Completed runs bank their full score as upgrade points; spend them in **Paw upgrades** at camp. Four permanent upgrades improve jump lift, slide duration, magnet duration, and bone value. Each has three levels costing 500, 1,000, and 1,800 points. Purchases apply to the next run and save in this browser. No real money is involved.
- Personal best, lifetime bones, points, and upgrades save locally after completed runs or purchases. Existing records are preserved; upgrade points begin accruing with this update. Leaving an unfinished run does not bank its bones or score.
- The pace starts at 22 meters/second and reaches 36, with earlier hazards, more two-lane blockages, and denser ordinary rows. Full-width action rows have extra space afterward for recovery. Backgrounding the page pauses the run. Sound is opt-in; reduced-motion mode removes decorative movement, though running remains a visual motion-based game.

Requires WebGL2. If 3D is unavailable, the page explains the requirement and links back to Puppy Quest. No accounts, real-money purchases, analytics, or remote artwork/font requests.

## Play

Click **Let’s go outside** or press Enter with the start button focused.

- A/D or arrow keys: move.
- Space, W, or Up: jump. Press again for a double jump; release early for a shorter hop.
- Shift: run.
- Escape: pause/resume.
- Touch controls appear below the game on small screens and touch devices.

Hop on beetles from above. Each trail awards one star for reaching home, one for finding at least 65% of bones, and one for finishing without retries. Best times and star counts are saved locally in this browser. No account is needed.

Runner ability: **Fetch** charges from hand-collected bones (+2%), clean
obstacle clears (+12%) and correct marked turns (+20%). At 100%, tap the Fetch
button or press F for four seconds of magnet collection. Charge stays banked
until used, cannot be spent over another magnet, and resets on retry. The burst
does not recharge itself. It collects aerial bones only while riding a zipline.

The clubhouse **Trail passport** tracks 21 permanent collectibles: three bond
milestones for each of four dogs (10/40/100 clean clears plus correct turns),
and bronze/silver/gold stamps for each region (3/10/25 clean regional courses).
Progress banks at run end; each milestone awards upgrade points once. Old saves
retain their existing progress and begin this new tracking at zero; no historical
mastery is invented. No daily resets, new currency, or dog-specific stat advantage.

After 800 meters, some ordinary and Challenge action rows become **split
decisions**: one lane has an overhead gate, the other two have jumpable logs.
Choose a lane and use the matching move; the quiet action cue follows your
approach. Scenic excludes these rows. Existing action-row recovery spacing,
gap rows, course sequences and protected turn/zipline approaches are preserved.

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
- `src/runner/turns.js`, `route.js`, `terrain.js`: shared corner schedule/input windows, cached world-space centerline, and bounded hill profiles.
- `src/runner/app.js`, `src/runner/ui.css`, `runner/index.html`: runner controls, states, saved records, and mobile interface.
- `test/runner.test.js`: route fairness, bounded object counts, movement, power-ups, collision, and a two-minute survival simulation.

Both simulations advance at 120 Hz independently of display refresh rate. Audio is generated locally and enabled by a user gesture. No external fonts or artwork are requested. Biscuit Dash uses Three.js bundled locally by esbuild; the original game does not load this bundle. The retired neon engine remains recoverable through Git history. Three.js attribution is retained in the generated bundle's linked legal notices, with its full MIT license in `runner/THREE-LICENSE.txt` in the built output.

## Deployment and verification

`npm run check` builds, verifies the distribution, runs ESLint, and executes the simulation tests. GitHub Actions deploys `master` to GitHub Pages. Browser testing should cover startup, movement, double jump, death/retry, pause, completion, and a mobile viewport. Canvas gameplay remains a primarily visual experience; HTML menus support keyboard navigation and important events are announced through a live region.

MIT license. Copyright © 2026 Jonathan Biro. See LICENSE, CONTRIBUTING.md, and SECURITY.md.
