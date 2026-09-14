# Sustained native Safari QA

## Setup

Dedicated simulator: Biscuit Dash QA — Sep 10, iOS 27.0,
`A684C311-2581-42FF-8F83-9E38506B11B5`, Safari in portrait, mirrored through
serve-sim. Another project's simulator remained running and untouched.
This is a shared Mac simulator environment, not physical-phone validation.

`node scripts/build-sustained-qa.mjs` creates a local-only page at
`/runner/sustained-qa.html`. Start its three-minute benchmark with a click.
It runs the production fixed-step clock, renderer, HUD and enabled sound with
Mochi, seed 1989 and trail version 4. An automated driver steers and uses Fetch.
Profile reads/writes and the service worker are disabled. A normal build removes
the fixture. The first two seconds are excluded from the frame-time summary;
the detailed stall log also retains warmup events.

## Measurements

| Native run | Distance | Frames sampled | Median / p95 / p99 | Frames >50 ms | Largest interval |
| --- | ---: | ---: | --- | ---: | ---: |
| Initial baseline | 6,162 m | 10,637 | 17 / 17 / 19 ms | 5 | 400 ms |
| Instrumented baseline | 6,073 m | 10,456 | 17 / 17 / 18 ms | 3 | 3,512 ms |
| Log shadow optimization | 6,188 m | 10,641 | 17 / 17 / 18 ms | 5 | 248 ms |
| Clean rerun (tools panel closed) | 5,737 m | 8,831 | 17 / 39 / 87 ms | 263 | 464 ms |
| Recycled frame caches (latest source) | 6,121 m | 10,582 | 17 / 18 / 27 ms | 11 | 282 ms |
| Layered area soundscape (latest source) | 6,135 m | 10,653 | 17 / 17 / 19 ms | 1 | 87 ms |

Each run lasted 180 seconds and visited all six areas. The per-run turn totals
are recorded below; every run had no missed turns, four ziplines, two rafts and
no hits. Sound was enabled.
The optimized run collected 341 bones. It was observed without running builds
or the test suite concurrently; the host was not otherwise isolated.

The clean rerun used the same dedicated portrait simulator after closing the
serve-sim tools panel. It still visited all six areas, accepted eight turns with
no misses, completed four ziplines and two rafts, collected 329 bones, recorded
no hits, and kept audio enabled. The higher tail (263 frames over 50 ms) shows
that simulator/host scheduling remains variable even when the panel is closed;
it is not treated as a product regression without a matching game-CPU signal.

The latest-source run includes the recycled frame caches. It visited all six
areas, accepted nine turns with no misses, completed four ziplines and two
rafts, collected 352 bones, recorded no hits, and kept audio enabled. Its
10,582-frame sample held the median at 17 ms while reducing p95/p99 to 18/27 ms,
with 11 frames over 50 ms and a 282 ms maximum. This is simulator evidence, not
a physical-device guarantee, but it is a materially cleaner tail than the
uncached rerun above.

The latest-source audio run includes the layered five-note area call-and-response
motifs. It visited all six areas, accepted nine turns with no misses, completed
four ziplines and two rafts, collected 355 bones, recorded no hits, and kept
audio enabled. Its 10,653-frame sample held the median and p95 at 17 ms and p99
at 19 ms, with one frame over 50 ms and an 87 ms maximum. Peak renderer pressure
was 250 draw calls, 32 active objects and 37 pooled objects. This is the cleanest
portrait tail recorded so far, but remains simulator evidence rather than a
physical-device guarantee. The report is retained as
`test-results/sustained-native-audio-latest.png`.

The instrumented baseline's 3,512 ms interval had measured current update/draw
CPU times of 5/3 ms and preceding update/draw times of 0/1 ms. The optimized
run's 248 ms interval had current times of 1/1 ms and preceding times of 0/2 ms.
These measurements do not identify the source of between-frame delays; they
cannot distinguish GPU waiting, Safari scheduling or host interference. The
different maxima are not evidence that the shadow change fixed these stalls.

## Implemented optimization and remaining findings

The renderer now stops allocating ordinary trail objects beyond 140 m ahead of
the puppy. This sits just inside the 145 m fog edge, leaves an approach silhouette
visible, and removes objects hidden in haze from both the active pool and shadow
work. The simulation objects remain untouched, so collision and reward timing do
not change. Visibility tests cover the exact boundary and pulled-bone behavior.

Per-frame route-frame, visible-object and gap lookups are now recycled alongside
the mesh pools. This keeps the long-run draw path from allocating a fresh Map,
Set and gap array on every portrait frame; the simulation and visual output are
unchanged.

The runner now defers mobile service-worker registration until the camp is quiet,
then verifies and caches the 54-file artwork pack in four-response batches. The
previous all-at-once install retained roughly 16 MB of image bodies while WebGL
was starting, which could evict an iPhone graphics context and send a healthy
browser to the recovery screen. Desktop registration remains immediate, and
the worker still deletes an incomplete cache rather than exposing a partial
offline build.

Mobile artwork now compacts each newly loaded painting to a 768px maximum
canvas before it reaches Three.js. The authored illustrations and measured
alpha bounds stay the same, but idle, stride and streamed action frames no
longer reserve desktop-sized texture memory on an iPhone. If a WebKit build
reports a lost context one frame before dispatching `webglcontextlost`, the
render guard enters the same paused wake-up path; mobile recovery waits up to
10 seconds for the browser to restore the context before banking the run and
showing the clean-start screen.

The mobile artwork cache now releases action, costume and legacy crop textures
when the kennel switches to another puppy, and late pose loads are discarded
if that puppy is no longer active. The complete painted pose stack remains the
only visible anatomy, so this trims GPU residency without changing the dog or
its action silhouettes.

After this cull, the five-run accelerated renderer matrix measured 256 peak draw
calls, 35 geometries, 9 textures and 91 active/pooled objects, with stable repeat
laps and all 130 turns accepted. It still covers 90 km, 65 ziplines and 30 rafts.
The cull is a visibility optimization, not a substitute for native frame pacing.

Branch hazards now keep shadows on their two grounded supports and three raised
limbs only. Foliage, the dark clearance band and the two bright action cues stay
visible but no longer cast duplicate detail shadows. A focused model test checks
the five/five shadow split. Re-running the same matrix reduced the peak to 241
draw calls (35 geometries, 9 textures, 91 objects) with all traversal outcomes
unchanged.

Version 4 authored courses now finish with one optional area relic. Its ground-
level placement follows the course's final safe lane, the faceted marker is
tinted to the current landscape, and collecting it awards 160 points without
adding another action or HUD panel. Results and score details name the relics
separately, while legacy trail versions remain unchanged.

Logs retain all seven visible mesh parts. Their solid body now supplies the
shadow rather than also shadowing six surface-detail meshes. The two ends share
one geometry and the two rings share another, eliminating two duplicate geometry
allocations. Model tests preserve the visible envelope and pooled clone behavior.

Continuous sampling caught peaks missed by the previous 250 m checkpoint test:
272 draw calls at 6,015 m before optimization, and 271 at 5,506 m after the log
shadow change. The 250 m matrix does not sample the exact same frames. The
post-cull matrix is below the 260-draw-call budget, but denser continuous native
sampling is still warranted.

A native left swipe reached the real gesture handler and the dog moved left
when the isolated lesson clock advanced. The preview tab closed during the
remaining input sequence, so this is not a complete swipe acceptance pass.
Safari displayed its motion-unavailable fallback with recalibration disabled.
All 32 current tilt/control/permission regression tests passed; actual phone
sensor sensitivity and fresh native permission-dialog behavior remain unproven.

Local screenshots are retained in `test-results/sustained-native-*.png`.
No claim of sustained physical-phone frame rate or complete mobile acceptance
is made by these results.
