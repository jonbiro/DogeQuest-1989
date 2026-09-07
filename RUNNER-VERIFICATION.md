# Runner verification

## Automated checks

Run `npm run check` for production build, artifact validation, lint and simulation/unit regressions.

## Local real-renderer soak

With the development server running, bundle the local-only fixture:

```sh
npx esbuild scripts/runner-visual-qa.js --bundle --format=esm --outfile=dist/runner/qa.js
```

Open the local `/runner/` page in an isolated browser session and evaluate:

```js
import('/runner/qa.js').then(m => m.longRunCheck())
```

The fixture runs three seeded 4,500-meter simulations using normal lane/jump/slide actions, without invulnerability or position overrides. It renders every 250 meters with the production renderer, reuses that renderer across run restarts, changes puppies/outfits, and includes a reduced-motion run. It throws on premature game-over or resource-budget regression. This is accelerated simulation with rendered checkpoints, not a real-time FPS or physical-phone test. The normal production build removes the fixture bundle.

Latest local result with deliberate Scenic and Challenge gate selections: 3 runs completed, 54 rendered checkpoints, minimum 3 hearts; peaks of 11 geometries, 2 textures, 108 active-plus-pooled objects and 137 draw calls. Final sample: 11 geometries, 2 textures, 9 active objects and 99 pooled objects. No browser errors were reported.

## Settings migration and reload

Unit tests cover absent/malformed preferences, sound opt-in, system reduced-motion defaults and explicit player overrides. In an isolated browser, sound-on persisted across reload; reduced motion was toggled off and on, reloaded each time, and both its pressed state and visible label matched the saved value.

## Remaining release-wide evidence

Real-time touch-driven runs, broad viewport checks, sustained frame-time profiling, audio listening checks, storage/context recovery flows and real-time route-choice UI interaction remain to be verified. Do not treat the narrower soak above as proof of these gates.
