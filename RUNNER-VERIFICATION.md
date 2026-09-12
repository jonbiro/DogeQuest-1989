# Runner verification

## Native Safari frame-pacing finding (2026-09-12)

- Used only the booted Biscuit Dash QA — Sep 10 simulator, UDID
  A684C311-2581-42FF-8F83-9E38506B11B5, through the simulator-browser skill.
  Safari initially held an older script; reloaded and confirmed the current
  game.js?v=ddd523eda74edcaa before measuring. Other projects' simulators were
  not controlled. The existing native profile held 1,360 credits.
- Measured requestAnimationFrame intervals during the real unscored three-move
  rehearsal, started through its existing handler from WebKit's console. After
  one second of warmup, 229 samples over approximately eight seconds averaged
  28.62fps: median 17ms, p95 96ms, maximum 565ms, sixteen intervals above 50ms.
  The game was still playing when sampling ended and was then paused.
- This is NOT a smoothness pass or isolated renderer benchmark. Live mirroring,
  DevTools and concurrent simulators/shared-host load were present. The poor tail
  latency requires separating host/mirror scheduling from game rendering before
  attributing a regression or claiming a phone performance improvement.
- Full saved-profile text was unchanged at measurement completion. Returned to
  camp with the same displayed balance. Screenshot evidence is in the sibling
  DogeQuest-1989-native-qa-2026-09-12/performance-return-to-camp.png. A transient
  mirror disconnect was recovered by reloading the existing mirror, not restarting
  the running measurement. The completed measurement was not repeated.
- Closed the mirror tab, stopped the tracked helper and confirmed terminal exit
  plus no listener on port 3200. The dedicated simulator remains booted. No
  production code changed; next performance work must investigate these stalls.

## Compact queued-label visual correction (2026-09-12)

- The actual queued-control fixture at 320x568 exposed 1px horizontal overflow
  (51px scroll width in a 50px client area). Reduced only queued-state internal
  horizontal padding to 2px; retained font size and all 52x60px touch targets.
- Rebuilt and visually inspected the correction: both labels fit and every
  control reports scroll width equal to client width. Additional 390x844 and
  844x390 checks report no overflow, with 60px/56px tall targets respectively.
- This was a deliberately staged control-state fixture using the production
  updater and CSS, not a natural gameplay screenshot. Temporary DOM changes
  disappeared when the tab closed; viewport reset and no save changes made.

## Buffered-action confirmation (2026-09-12)

- Existing Jump/Slide controls now display QUEUED with a steady contrasting
  treatment when a follow-up is pending, rather than adding a trail banner.
  Labels and accessible descriptions restore when the move starts, expires or
  is canceled. Zipline unavailability takes precedence, and state changes avoid
  repeated DOM writes. Controls remain enabled for deliberate overrides.
- Jump confirmation requires projected landing within the remaining buffer;
  an early input that expires before landing is not presented as queued.
  Tests cover this distinction, slide queue cancellation and cable precedence.
- Full check: 292 tests passed. This pass verifies state/label behavior and CSS
  build integration, not a fresh visual or physical-device inspection.

## Recognition beyond score records (2026-09-12)

- Results can now recognize a new distance or single-run bone best without a
  score record. The existing summary chooses one compact message, prioritizing
  score and rematch records; no new panel, toast or currency award was added.
- Completion snapshots the record flags before updating the profile. Re-reading
  the receipt retains the result. Distance compares displayed whole meters, so
  invisible fractional improvements do not trigger a record message.
- Tests cover distance only, bones only, both, ties, fractional distance, score
  and rematch precedence, stable receipts and unchanged earned credits. Full
  build, distribution verification, lint and 291 tests passed. This pass has no
  new screenshot or physical-device coverage.

## Visible total run earnings (2026-09-12)

- The existing results summary now states the exact upgrade points banked,
  including score, mission, prize and mastery awards. The completion receipt
  captures the credit delta once; repeated reads or later purchases cannot
  change that historical total or bank it again. Existing currency rules are
  unchanged, and unavailable-storage messaging still takes precedence.
- New tests verify every award category with both zero and nonzero starting
  balances and a subsequent purchase. Full check: 289 tests pass.
- An actual disposable 1m run at 320x568 displayed its 1-point total, matching
  saved credits. Retry and camp buttons remained visible in the screenshot.
  Fixed singular wording after that check. The previously absent disposable
  save was restored, the temporary tab closed and viewport override reset.

## Frame-limited reaction coverage (2026-09-12)

- Confirmed urgent action hints update every draw before the 10Hz score/HUD
  throttle. Added a structural regression check for that ordering.
- Delayed-response tests now observe cues only at simulated 30 or 60fps, not
  every 120Hz physics step. Eight 3km seeds, three response delays (100/150/200ms),
  two upgrade levels and both display rates cover 288km with no hit or shield
  break events. These display-sampling intervals model added input visibility
  latency; they do not measure actual renderer FPS or hardware performance.
- No production gameplay or visuals changed in this verification-only pass.

## Upgraded consecutive-slide recovery (2026-09-12)

- Expanding delayed-response coverage to fully upgraded runs exposed an early
  slide failure on seed 4 at 1648m with 150ms response delay. The long upgraded
  slide ended too close to the following overhead hazard for a fresh response.
- Refined the fixed-duration rule: early repeats remain ignored, but a grounded
  press in the final 240ms queues one follow-up slide without restarting the
  active timer. Jump cancels the queue; cable transitions clear it. Dive repeats
  still preserve buffered jumps. Guidance acknowledges the queued coverage.
- Both upgrade levels 0 and 3 now pass eight 3km seeds at each of 100/150/200ms
  input delay: 144km total, with neither hit nor shield-break events. This remains
  bounded deterministic cue-response simulation, not a human-playability claim.
- Dedicated 60/120/240Hz tests cover queue deduplication, exact transition timing,
  no recursive extension and jump cancellation. Full check: 285 tests pass.

## Delayed-response consecutive hazards (2026-09-12)

- Eight seeded 3km simulations at each of 100/150/200ms cue-response delays
  exposed one hit at 200ms on seed 7, 1623m: the second-jump hint arrived too
  late after the preceding jump. Expanded the landing input buffer from 120ms
  to 240ms without changing jump airtime, height or collision clearance.
- The same 72km matrix now completes without hit events. Inputs are queued from
  actual guidance changes rather than obstacle-oracle perfect timing. This is
  bounded deterministic simulation evidence, not proof of all layouts or human
  usability; the fixture does not assert that shields were never consumed.
- Active slides that will expire before an overhead obstacle now show the
  non-actionable OVERHEAD NEXT cue, followed by SLIDE after expiration. This
  removes an outdated renewal instruction following the fixed-duration change.
- Full build, distribution verification, lint and 283 tests passed, including
  early-buffer expiration and unchanged jump timing regressions.

## Predictable slide duration (2026-09-12)

- Repeated Slide actions no longer restart an active slide timer or erase a
  jump buffered during a dive. Fresh slides remain available after expiration;
  a grounded Jump still interrupts a slide immediately. Initial dive motion,
  upgraded duration and collision rules remain unchanged.
- Regression tests repeatedly press Slide at 60/120/240Hz for all four upgrade
  levels and verify expiration within one simulation step of the original
  duration, one start event, a fresh subsequent slide and immediate jump cancel.
  A separate actual motion simulation proves a late buffered jump survives a
  repeated dive input and launches on landing. Full check: 282 tests pass.
- This change is verified through the production action/motion implementation;
  no new physical-phone timing or human-playtest claim is made.

## One press per focused action control (2026-09-12)

- Suppressed repeated Enter/Space keydowns only on focused gameplay action
  buttons, matching the existing one-press direct shortcuts. First presses,
  subsequent fresh presses and unrelated native controls retain ownership.
- All five action buttons have repeat regression coverage; 280 tests pass.
- In the actual local browser, a native Enter press emitted one right-button
  click, six synthetic repeat keydowns were default-prevented, and a fresh native
  Enter emitted the second click. Raw native repeat injection was unavailable;
  this verifies native first/fresh presses plus synthetic repeat suppression,
  not physical held-key timing. An initial test outlived its run and was rejected;
  its disposable save was restored to the confirmed absent baseline. The final
  test paused immediately, left no save, and its temporary tab was closed.

## Shared route-frame computation (2026-09-12)

- The renderer now prepares the player transform, detour reveal and player
  terrain once per draw instead of repeating them for each unique road depth.
  Depth caching remains in place. A sampler snapshots its route descriptor so
  route changes cannot mix player and target coordinate systems.
- A pre-change SHA-256 geometry fixture covers 12,450 complete frames: base,
  Scenic and Challenge paths, hills/flat terrain, five depths and 415 distances
  spanning multiple gates, corners and regions. The optimized outputs match
  exactly on the same local runtime. The portable fixture rounds to 1e-7 units:
  the first CI attempt exposed platform differences in raw floating-point bits.
  Separate tests cover mutation isolation and non-finite coordinates.
- Identical local Node workloads (1,000 frames, 180 depths per frame, Challenge
  detour) produced warmed old timings 403/388/355ms and new timings 95/91/92ms,
  with identical accumulated results. These are CPU microbenchmark results,
  not browser FPS or a measured physical-phone speedup.
- Full build, distribution verification, lint and 278 tests passed. No visual
  quality, geometry density, physics rules or obstacle placement was reduced.

## Selected-route detours (2026-09-12)

- Scenic moves up to 8m left and Challenge up to 12m right. The smooth detour
  occupies gate +45m through +205m, rejoining 15m before route expiry. A 40m
  distant-road reveal avoids a selection snap; underfoot geometry stays fixed.
  Road stretch closes spacing gaps and all objects share the selected frame.
- Initial bends clipped outside-lane rewards in narrow portrait at boosted
  speed. Reduced excursions and smoothly blended camera anticipation fixed the
  projection regression across both routes, four gates, three portrait aspects,
  all player/reward lanes, camera lag and grounded/airborne player heights.
- Full check passed: 276 tests. Three 6,000m input-driven runs with the real
  renderer completed all twelve courses, 27 turns and twelve ziplines with zero
  hits, zero shield saves and minimum three hearts. Across 72 render checkpoints,
  peaks remained 184 draws, 22 geometries, five textures and 107 active/pooled
  objects. This is perfect-input simulation, not human reaction or device FPS.
- A fresh actual UI run selected Challenge and was captured at 440m with three
  hearts in 390x844 portrait, then paused at 502m. The disposable save remained
  absent. Final route comparison and actual-run screenshots are in the sibling
  DogeQuest-1989-detours-2026-09-12 folder; earlier non-final images there show
  intermediate tuning. Help explains automatic bends versus marked corners.

## Continuous long-run and honest HUD regression checks (2026-09-12)

- Re-ran three 6,000m input-driven simulations in the actual renderer after the
  recent gameplay/visual changes: all twelve course variants, 27 turns with no
  missed turns, twelve zipline finishes and sixteen split-decision rows.
- Tightened the helper to account for hearts, hit events and shield saves every
  simulation step rather than only at 250m render checkpoints. The stricter run
  reports zero hits, zero shield saves and minimum three hearts, reaching 46.8m/s.
  Seventy-two rendered checkpoints peaked at 184 draw calls, 22 geometries, five
  textures and 107 active/pooled objects. These are perfect-input simulation and
  sampled-render resource results, not human reaction or physical-device FPS.
- The HUD stress fixture was giving a false-clear result for the power panel:
  it populated an element that remained hidden, yielding a zero-size rectangle.
  It now uses the actual power-HUD builder, tests the visible active cue, and
  rejects zero-size measured elements. Its cleanup restores original DOM nodes,
  not HTML copies that detach the running app's cached power-chip references.
- With all five power chips visible, both action-cue and route-choice modes pass
  at 390 × 844, 320 × 568 and 844 × 390. Power panel bottoms were 224, 260 and 170px
  respectively, no longer zero. A deliberately display:none panel correctly
  reports “#power is not visibly measurable”; node identity and original hidden
  state were verified unchanged after cleanup. No new product UI was needed.
- All 273 tests and build/lint/distribution checks pass. No browser errors or
  saved-profile changes occurred; the temporary tab and viewport were cleaned up.
  Both helper repairs are development-only and excluded from the shipped game.

## Understandable score sources without in-run noise (2026-09-12)

- Expanded results now start with distance points + bone points + trail bonuses
  = run score. Bone-streak and clean-move streak amounts are explicitly included
  in trail bonuses, not additional awards. Challenge/passport rewards keep their
  existing separate accounting. No in-run notices or HUD elements were added.
- A run-local streakPoints counter records every earned ten-bone bonus even when
  later misses reset the combo. It is explanatory only, is not saved as currency,
  and does not change score or banking behavior.
- All 273 tests and build/lint/distribution checks pass. New tests cover separate
  streaks, resets, base and upgraded/doubled bone values, quiet in-run feedback,
  empty runs, source sums, included amounts and exactly-once banking.
- An input-driven 903m browser run earned 3,518 points: 903 distance + 975 bones
  + 1,640 trail bonuses, including 200 from bone streaks and 150 from clean moves.
  The original placement was too deep in the reward text, so the explanation was
  moved to its own leading paragraph. A fresh short run on the final build verified
  that placement at 320 × 568, with details scrolling and retry/camp fixed in view.
  The screenshot is in the sibling readability audit folder as score-sources.png.
- No browser warnings/errors appeared. The disposable local profile was restored
  to its absent baseline after banking the test runs; temporary tab/viewport were
  cleaned up. No native/live profile was touched. This is browser UI and accounting
  evidence, not physical-phone or comparative player-satisfaction evidence.

## Grounded overhead-branch silhouette (2026-09-12)

- A deterministic real-renderer approach fixture compared arch/gate/branch at
  35m and 16m ahead, 390 × 844, with Mochi and the same bridge/background/camera.
  The branch lacked the grounded uprights of the other overhead hazards and
  could resemble a floating low log. Two slim supports now make the opening
  underneath explicit. There are no new signs, animation, collision or cue rules.
- All 271 tests and build/lint/distribution checks pass. The model test checks
  ground contact, upright height, support clearance outside the 0.95m collision
  corridor, neighboring-lane bounds, shared resources and exactly two new meshes.
- Matched before/after captures show the opening at both distances. The fixture
  rose from 94 to 96 draw calls while retaining 10 geometries and 4 textures.
  This is a measured fixture cost, not an FPS or player-recognition claim.
  Screenshots are in the sibling local DogeQuest-1989-overhead-check-2026-09-12
  folder. The helper is development-only and excluded from the production build.
- The only console warnings were the expected duplicate-Three imports caused
  by the separately bundled diagnostic helper. No rendering errors occurred,
  no save changed, and the temporary tab/viewport were cleaned up. This inspection
  addresses the earlier silhouette concern, without claiming physical-phone
  performance or universal recognition from a few screenshots.

## Screenshot-led traversal-control audit (2026-09-12)

- Fresh 390 × 844 captures covered camp, a live ground course, and the actual
  high-bone rehearsal. The cable screen showed Jump as the brightest active
  control even though the world ignores jumps/slides while riding.
- Jump and Slide now become disabled on the cable, with a subdued legible style
  and accessible availability explanation. Steering and Fetch retain their own
  availability rules; no buttons move and the physics remain unchanged.
- All 270 tests and build/lint/distribution checks pass. New checks verify the
  two disabled actions, untouched steering/Fetch, labels, restoration and actual
  simulated dismount followed by a working dive. Browser accessibility output
  confirmed disabled cable controls and re-enabled Jump/Slide after dismount.
- Before/after screenshots match viewport and riding state (136m/141m rehearsal
  progress, not identical world position). One late pause screenshot was rejected;
  timed observations were inspected on the same continuing rehearsal, not retried
  as new runs. No save changed, no browser errors/warnings appeared, and temporary
  tab/viewport cleanup completed. Screenshots and notes are in the sibling local
  DogeQuest-1989-readability-audit-2026-09-12 folder. This is browser/reduced-motion
  evidence, not physical-device FPS or full accessibility certification.
- Ground contrast and bottom-docked progress were readable in the captured
  section. Distant overhead rows remain a specific recognition follow-up; the
  thin horizon silhouette is a risk to inspect, not a verified cue failure.

## Optional daily shared trail (2026-09-12)

- The Help disclosure selects a deterministic UTC-day seed and current layout
  version, removes any prior score target, and returns to camp with a dated
  notice. Selection is explicit, so midnight does not mutate an active run or
  retry. The ordinary trail URL survives reload and remains replayable on later
  days; after reload it is honestly labelled Shared trail, not a live daily mode.
- All 268 tests and build/lint/distribution checks pass. New tests cover UTC
  boundaries across time-zone offsets, 366 distinct daily seeds, versioned links,
  target removal, invalid inputs, matching generated objects after link parsing,
  and the actual selector's camp/focus/state changes without run/bank calls.
- At 320 × 568, actual Help disclosure and selection showed the 2026-09-12 UTC
  notice with all camp controls reachable. The selected trail started and paused
  normally. Reload retained the replay URL; Switch to random trails cleared it.
  No save was created or changed, no browser errors/warnings were reported, and
  the temporary tab and viewport were cleaned up. This is browser portrait QA,
  not a physical-device or ranked cross-player comparison.

## Safer route-choice timing (2026-09-12)

- Investigation reproduced the earlier seed-38 conflict: at 4489m the right lane
  has a branch and the center has a rock, while the old 100m route prompt invites
  movement toward the 4550m gates. This is a guidance conflict, not evidence that
  the physical row itself is impossible.
- Actionable route instructions now appear only in the final 40m, within the
  existing 45m obstacle-free reservation. No generated row, seed, reward or
  difficulty was changed. Hazard cues keep their existing priority.
- All 265 tests and build/lint/distribution checks pass. Tests cover prompt
  boundaries, both route choices with two delayed inputs at 46.8m/s (including
  100ms HUD delay and 150ms initial reaction), and 48km of seeded generation over
  both layout versions without an unpassed pre-gate hazard during a route prompt.
  That generation check uses invulnerability and is not a survival claim.
- Portrait browser play at 390 × 844 followed visible cues and reached the first
  prompt at 310m, exactly 40m before the gates, with three hearts. No early route
  prompt appeared while the preceding Root scramble was still active.
  Resuming and steering right selected Jungle · Challenge at 351m. The run stayed
  unbanked (save remained absent), browser warnings/errors were empty, and the
  temporary tab and viewport were cleaned up. This is browser, not phone evidence.

## Rotation-safe mobile interruptions (2026-09-12)

- Device orientation changes pause active play through the existing pause path,
  stopping audio and clearing unfinished input. Modern screen-orientation events
  are preferred, with the legacy window event as fallback. Ordinary resize is
  deliberately excluded so browser address-bar changes do not interrupt play.
- All 262 tests and build/lint/distribution checks pass. The actual event-binding
  and pause functions are exercised for both APIs, repeated events and all
  non-playing panels; rotation never resumes a paused game automatically.
- A disposable browser run at 390 × 844 paused on a dispatched orientation event.
  The pause controls remained reachable at 844 × 390. Keep running resumed play;
  an ordinary resize event did not pause it. A second orientation event paused at
  195m and distance remained 195m on the subsequent observation. No save was
  created or changed, no browser errors/warnings appeared, and the temporary tab
  and viewport were cleaned up. This is browser event/layout verification, not
  a physical-device rotation or operating-system event-delivery test.

## Contextual lane-weave rehearsal (2026-09-12)

- Course-rock collisions now preserve a run-local weave marker. Results explain
  open-lane movement and ×2, and offer Practise lane weaves rather than generic
  jump/slide basics. Ordinary rocks and other collision shortcuts retain their
  existing coaching. Retired runs still do not receive unsolicited rehearsal.
- The roughly ten-second unscored lesson uses actual crystal course geometry,
  steering and per-beat open-lane scoring: right edge to left, back to right, then
  center. Five swipes clear three decisions. Misses never lose hearts or bank
  rewards; the same controls return to a fresh adventure afterward.
- At 320 × 568, input-driven play intentionally skipped weave moves and ended
  naturally at 1160m with 3,875 points. The results showed the relevant coaching
  and reachable lesson button. Following visible rehearsal hints with 150ms
  delayed keyboard events completed 3/3 with exactly five inputs. The banked
  profile was byte-for-byte unchanged through practice. Run the adventure then
  restored normal scoring, three hearts, zero Fetch charge and a fresh challenge.
- Unit coverage exercises base/max upgrades, successful and unanswered lessons,
  contextual collision evidence across all regions, reward exclusion and the
  actual result-button retry routing. No browser warnings/errors were reported.
  All 260 tests and build, lint and distribution checks pass.
  The disposable local save was removed to its absent baseline; temporary tab
  and viewport were cleaned up. No native/live save was touched. This is browser
  portrait evidence, not physical-phone usability verification.

## Explicit two-swipe lane guidance (2026-09-12)

- A delayed-input audit exposed a concrete ambiguity: the first Crystal slalom
  beat at 1090m could require right-to-left traversal, but its hint did not change
  after the first swipe left. Course and aerial-reward cues now append ×2 for a
  two-lane move, shorten after the first accepted swipe, and disappear at the
  target. One swipe still moves exactly one lane; no obstacle or physics change.
- All 257 tests and build/lint/distribution checks pass. Tests cover both
  directions, weave/bone/gift labels, actual two-input course clears with 150ms
  reaction at 36 and 46.8m/s, and existing aerial cue/magnet behavior.
- Repeating a 40-seed, 6,000m delayed-cue audit removed the missed two-lane
  course moves. Thirty-nine runs had no hit; one had a nonfatal branch hit after
  the controller changed route lanes mid-jump. That residual automation behavior
  is not presented as a complete difficulty/fairness pass.
- At 320 × 568, actual app play reached Crystal slalom, displayed LEFT ×2 in the
  existing edge dock, changed to LEFT after a native keyboard move, and accepted
  the second move. At 1095m it offered the next rightward two-swipe cue with all
  three hearts. A timed observation expired while the controller was still live;
  the same run was inspected and continued, not restarted on timeout.
- An initial attempt ended before the controller was attached and was not counted
  as passing evidence. Its disposable local save was removed back to the absent
  baseline; the successful retry stayed unbanked. Temporary tab and viewport were
  cleaned up. This combines synthetic cue-following setup with native keyboard
  acceptance checks, not physical-phone touch validation.

## Quiet physics-timed touchdown sound (2026-09-12)

- Actual vertical ground contact emits one landing cue, including normal jumps,
  dives, buffered rebounds and zipline dismounts. It does not change timing,
  collision clearance, scores or HUD notices. Sound remains opt-in.
- The 65ms descending sine uses a quieter per-note gain. All 255 tests and
  build/lint/distribution checks pass, including base/max leap at 30/60/120Hz,
  no repeated grounded cue, rebound event count and the existing output ceiling.
- In the actual browser app, a native Space press during unscored practice
  produced the jump posture, then the running posture and exactly one 180Hz
  landing oscillator. A second jump with sound muted returned to the ground
  without adding another oscillator. A temporary AudioContext wrapper observed
  scheduling only; it did not inject movement or landing events.
- OfflineAudioContext rendered all eight cues with finite, nonzero output. The
  landing peak was 0.01447 versus jump's 0.03343, with lower RMS as intended.
  These are audio-engine measurements, not human listening or physical-speaker
  validation. The disposable local profile created by toggling sound was removed
  back to its absent baseline and the temporary tab closed.

## Shared bone rendering batch (2026-09-12)

- Bones now share one instanced draw while retaining the same beveled geometry,
  vertex-color contrast, lane/terrain transforms, bobbing and magnet pull arc.
  Capacity grows without dropping pickups; old instance buffers are disposed
  without disposing shared geometry or materials. Empty/menu frames hide the batch.
- A matched 390 × 844 real-WebGL fixture with 59 visible bones (ground, aerial
  and a partly attracted bone, with one used pickup excluded) measured 97 draw
  calls before and 39 after, with eight geometries and two textures in both.
  Screenshots retained the same outlines and placement. Removing all bones left
  zero instances and 38 scene draws. This is reduced submission overhead, not a
  claim of 60% faster frame rate or physical-phone performance.
- The long-run fixture exposed its obsolete nine-course expectation. It now
  runs 6,000m per seed and requires all twelve current course names explicitly.
  Three runs passed 72 rendered checkpoints, 27 turns without misses, twelve
  zipline finishes and minimum three hearts. Peaks: 182 draw calls, 22 geometries,
  five textures, and 107 active/pooled objects. Simulation inputs drive this
  accelerated check; it is not a real-time frame-rate benchmark.
- Combined-power checks in both motion modes confirmed three attracted bone
  instances before collection and zero afterward, through magnet/Zoomies/double
  expiry. Unit tests cover transform retention during capacity growth, shared
  resource ownership, repeated shrink/reset, and visibility of an empty batch.
  All 253 tests and build/lint/distribution checks pass.
  Temporary fixture tabs were closed; no scored runs or saved profiles changed.

## Score chases remain visible on routes (2026-09-12)

- Scenic/Challenge sections no longer replace the score-chase line. The existing
  location line instead uses compact labels such as Jungle · Challenge. Full
  region names return at route expiry; practice remains explicitly unscored.
- All 251 tests and build/lint/distribution checks pass. New coverage exercises
  both route kinds in all three regions with shared targets, personal records and
  rematches, plus the exact expiry boundary and practice precedence.
- Actual app play at 320 × 568 followed visible cues with synthetic keyboard
  events, without editing simulation state. At 350m the Challenge route and
  1,285 / 1,500 pts target progress were both present. The rendered location line
  measured 119.4 × 11px and did not overlap the score, bones or controls.
- Continuing the same run to 581m restored Biscuit Canyon and showed 2,216 pts ·
  TARGET BEAT with all three hearts. The run was paused unbanked; the local save
  remained absent, no warnings/errors appeared, and the temporary tab/viewport
  were cleaned up. This is browser portrait evidence, not native touch or physical
  phone validation. It supersedes the previous route-label-over-score priority.

## Friendly shared score targets (2026-09-12)

- Valid versioned trail links can carry one positive integer target, capped at
  999,999,999. Missing/duplicate/malformed targets are ignored without discarding
  a valid layout. Sharing removes unrelated URL data and uses the completed run's
  score, never the received target. The checkbox can omit the score entirely.
- Unit coverage checks parsing, boundary values, legacy layout-only links, the
  real sharing/reset handlers, retry/practice transitions, tie-versus-beat labels
  and identical reward transactions with or without a target. All 249 tests and
  build/lint/distribution gates pass. Active route labels retain HUD priority.
- At 320 × 568, opened a 200-point challenge and played to a natural 270m finish:
  the existing score line showed TARGET BEAT, results scored 420 and explained
  the 220-point lead. Sharing offered target=420; unchecking left only trail=2-1j9.
  The checkbox, copy button, retry and camp actions remained reachable in the
  scrollable result panel. Retry showed the original 200-point target, not 420.
- Switching to random removed both URL parameters and restored the normal Play
  label. The largest supported target also fit camp and the gameplay score line.
  No browser warnings/errors were reported. The isolated local origin started
  without a saved profile; only this check's disposable save was removed afterward.
  No live or native Safari profile was touched. This is browser portrait evidence,
  not physical-phone or ranked competitive validation.

## Forgiving thumb-arc release (2026-09-12)

- Previously a 40 × 34 px swipe remained unresolved even on release. Movement
  still requires a 1.25 dominant-axis ratio for immediate commitment; release
  now accepts 1.1. The 24 px minimum and one-action-per-contact guard are unchanged.
  Equal or near-equal diagonals stay uncommitted instead of guessing a move.
- All 245 tests and build/lint/distribution checks pass. Regression coverage uses
  the actual pointer listeners and checks all four directions, tiny gestures,
  unresolved diagonals, release ownership and no duplicated action.
- Real browser drag input during unscored practice moved from center to right
  after a 40 × 34 px drag; a subsequent -40 × 40 px drag kept the right lane.
  The practice was paused and the temporary tab closed. No scored run was started
  and no settings were changed. This is browser pointer evidence, not a physical
  phone or native Safari gesture measurement.

## Portrait Safari practice check (2026-09-12)

- Used only the dedicated Biscuit Dash QA — Sep 10 iOS 27 simulator. Native
  Safari reloaded the current local runner; camp displayed 1,380 points before
  and after the rehearsal. Other projects' simulators were left untouched.
- Native touch dragging scrolled Help. Expanding the practice disclosure brought
  all three lesson buttons into view without covering the fixed start/camp actions.
  Tapping Practise turns started the real rendered unscored left-turn lesson.
- An intentionally unanswered turn showed a compact edge coaching hint and then
  Try the turn again, with timing instructions and reachable rehearsal/camp actions.
  Returning to camp preserved the displayed balance. No scored run was started.
- The mirror briefly disconnected after opening Help; reloading the mirror alone
  restored the existing Safari state. This checks native Safari layout, navigation
  and missed-turn practice completion, not successful timed steering, physical
  touch feel, audible sound, frame-rate performance or full saved-profile equality.

## Space respects focused controls (2026-09-12)

- A failing regression reproduced Space being prevented and interpreted as jump
  when an ordinary button was focused. The shortcut now yields to native buttons,
  form fields, disclosures, links and button-role controls, not only action buttons.
- Browser keyboard presses on Pause opened the pause screen with the dog in its
  running posture. Space on Keep running resumed, and Space on the Slide button
  produced the slide posture. A fresh run verified Space on the trail produces
  the jump posture, waiting for that actual rendered state rather than sampling
  too early. No gameplay events or simulation state were injected.
- Both runs were paused unbanked and temporary tabs closed. No settings were
  changed. Unit regression covers native controls and retains action-button,
  modifier/composition and ordinary trail-shortcut checks. All 244 tests and
  build/lint/distribution gates passed. This is desktop browser keyboard evidence.

## Audio resumes with the player's resume action (2026-09-12)

- Opted-in audio now resumes during Resume itself rather than waiting for the
  next effect. The same guarded helper is used for effects; rejected requests,
  synchronous failures, absent contexts and closed contexts remain non-fatal.
  Resume is queued even if an earlier suspend has not yet changed context state.
- In the browser, a temporary AudioContext subclass observed the actual context.
  Pause left it suspended with two resume calls; clicking Keep running added one
  resume and returned it to running at the opening 0m, before any pickup effect.
  After muting, another pause/resume left the context suspended and the resume
  call count unchanged. No browser warnings/errors were reported.
- Unit checks cover suspended/interrupted/running contexts, rejected/thrown
  requests and the actual application's muted/enabled resume handler. All 243
  tests/build/lint/dist gates pass. This checks browser audio state, not listening
  quality or native Safari/physical-speaker behavior.
- The test initially had no local profile. The sound setting was returned to
  muted, the disposable profile it created was removed, and the tab was closed.

## Same-trail rematch target (2026-09-12)

- Results-screen retries preserve the strongest score in their current retry
  streak. A fresh camp/help/practice adventure resets it. The existing score line
  shows a nearby rematch target and a beaten-target label, while all-time record
  cues retain priority. Results details give the exact score difference.
- At 320x568, an isolated 10,000-point record fixture distinguished global from
  rematch progress. A natural 420-point result was retried through visible UI;
  rendered-cue-driven synthetic keyboard inputs reached the target and displayed
  1,067 pts · REMATCH BEST. Its score-line bounds remained inside the viewport.
- Finishing the paused run banked the final 1,068 score and showed Rematch best,
  target 420 and 648 ahead. The all-time record stayed 10,000; rematchBest was not
  added to the saved profile. The disposable profile was removed to restore the
  verified absent-save baseline. No console warnings/errors, tab closed, viewport
  restored. This is browser fixture evidence, not physical-phone play evidence.
- All 241 tests/build/lint/dist gates pass, including increasing/decreasing retry
  scores, target reset, ties, invalid targets and all-time record priority.

## Clean-course progress in the existing dock (2026-09-12)

- Active courses reuse the normal challenge-progress slot to report clean moves
  and honest +180 eligibility; a missed beat reports bonus missed. The progress
  meter changes its accessible name to Clean course moves, then restores Challenge
  progress afterward. Challenge completion calculations remain independent.
- A 320x568 actual-app run completed Root scramble while synthetic keyboard
  events followed rendered cues. The display advanced through 1/3, 2/3 and 3/3
  clean, with one course credited. Action prompts were never hidden by course
  progress. The dock occupied x=16..304/y=432.5..472 without overlapping controls.
  At course end the original challenge label and meter name returned.
- No browser warnings/errors; run paused unbanked, save remained absent, tab
  closed and viewport restored. Unit checks cover failed eligibility and inactive,
  finished and practice states. All 240 tests/build/lint/dist checks pass. This is
  browser/simulation evidence rather than physical-phone usability evidence.

## Consecutive-jump guidance timing (2026-09-12)

- A 150ms delayed-cue simulation exposed late takeoffs on seeds 5, 7 and 8.
  Seed 7 hid the second hint until 1615m, took off at 1621m and hit a rock at
  1623m. Near-landing airborne suppression was leaving too little reaction time.
- Guidance now forecasts ordinary-jump touchdown and can request JUMP AGAIN in
  the existing 120ms buffer window when a separate hazard arrives after landing.
  Queuing that jump silences the cue immediately, without changing velocity or
  height. Dives and hazards reached before landing do not request another jump.
- All three seeds now reach 5000m with zero hit events under the same delayed
  controller. Regression tests also cover base/max leap and buffer acknowledgement.
- In the actual app at 390x844, a 57-second run on shared trail `2-7` used synthetic
  keyboard events delayed 150ms from rendered cues. It reached 1778m with three
  hearts throughout and three correct turns/no misses. The new hint was observed
  at x=32.5..357.5/y=725..739 inside the lower dock. The run was paused unbanked;
  save remained absent, no browser warnings/errors, tab closed and viewport reset.
- All 239 tests/build/lint/distribution gates pass. These timing checks are not
  a claim about human reaction times or physical-device performance.

## Surface-aware puppy shadow (2026-09-12)

- The contact shadow now fades across the approach to a missing 5m road slab,
  disappears over the hole and returns smoothly at the far edge. Its existing
  height-dependent size/opacity on solid trail and all collision rules remain.
- Tests cover both lips, the whole absent slab, multiple gaps, continuity and
  unchanged solid-ground height response. A local-only renderer fixture compared
  the same airborne Mochi pose at 390x844 over paving and over a gap: the paving
  retains a soft shadow and the gap has no floating contact disc.
- The fixture intentionally loads its own Three.js bundle beside the app, which
  emitted duplicate-library warnings; it is excluded from production artifacts.
  No gameplay/save actions were performed. Temporary tab closed and viewport
  reset. This is a rendered fixture comparison, not physical-phone play evidence.

## Contextual gap rehearsal (2026-09-12)

- Missed-gap results now offer a five-second gap lesson. It uses a grid-aligned,
  full-width road break and actual jump/collision simulation, without adding a
  camp button. Base/max leap clear the jump, including a 100ms response delay;
  sliding, steering and no input fail the lesson without persistent penalties.
- At 320x568, rendered-cue-driven browser inputs reached a natural gap death at
  1885m on shared trail `2-1j9`. The results offered Practise gap jumps. A visible
  click entered the lesson; the actual renderer showed the striped road break,
  the cue-driven jump cleared it, and Gap cleared results fit on screen.
- The profile banked by the scored run remained byte-for-byte unchanged through
  practice. Only that disposable test profile was then removed to restore the
  origin's verified absent-save baseline. No console warnings/errors; tab closed
  and viewport reset. Synthetic input evidence is not physical-touch evidence.
- All 235 tests and build, lint and distribution gates passed.

## Collision-to-practice shortcut (2026-09-12)

- Collision results offer a matching corner rehearsal or the basic movement
  trail directly. Retirement, unknown mistakes and gaps (not covered by the
  basic trail) do not fabricate a practice recommendation. Tests exercise the
  actual results-button handler, direction selection and rehearsal retry routing.
- At 320x568, a natural 270m collision result banked 420 points and showed
  Practise the basics beside Back to camp, with the primary retry still visible.
  Clicking it started unscored practice; after its natural 0/3 completion, the
  saved profile was byte-for-byte unchanged. Run the adventure started a normal
  run near zero distance with three hearts, zero Fetch uses, and challenge HUD.
- This used visible browser clicks, not physical-phone touch. No console errors
  or warnings were reported. The origin initially had no save: only the test
  profile created during this check was removed afterward, restoring that exact
  baseline. Temporary tab closed and viewport reset.

## Safe corner practice (2026-09-12)

- Added an optional seven-second corner rehearsal with real left/right geometry,
  turn acceptance and wrong-direction correction. Successful results offer the
  opposite direction; missed results retry the same direction. No banking occurs.
- Simulation regression covers both directions, early lane changes, accepted,
  missed and corrected inputs, completion, unchanged hearts, empty obstacle
  generation and no persistent rewards. All 231 tests/build/lint/dist checks pass.
- At 320x568, shortened Help copy keeps all three practice choices visible after
  expanding the disclosure. Actual browser menu clicks started the left rehearsal;
  rendered-cue-driven synthetic keyboard events completed it and its right retry,
  each with one accepted corner and zero misses. An unanswered left turn showed
  missed-turn coaching, and its retry remained left. Results buttons fit on screen.
- The local profile remained absent throughout; no browser errors/warnings.
  Temporary tab closed and viewport restored. These are browser/simulation checks,
  not physical-phone gesture or human learning-effectiveness measurements.

## Useful spare shields (2026-09-12)

- A shield collected while already protected now gives 100 bonus points instead
  of being wasted. Protection still absorbs exactly one hit; spare pickups do
  not stack lives or protection. The existing pickup feedback remains unchanged,
  with the rule explained in Help rather than adding a mid-run banner.
- Regression checks cover first/spare collection, single award, score inclusion,
  unchanged bones/combo/Fetch charge and no double-token multiplier. Two later
  collisions prove that only the first hit is protected. All 230 tests and the
  build/distribution/lint gates passed. This is simulation evidence, not new
  physical-device or human play evidence.

## Portrait early-jump recovery in the production app (2026-09-12)

- Tested build `e0958a2` at 390x844 on local shared trail `2-1j9`. A temporary
  browser controller read the rendered cue and sent keyboard events, deliberately
  choosing jump at the first slide prompt before following the resulting dive
  prompt. It did not set simulation state or call movement functions directly.
- The recorded sequence was turn-left, jump, deliberately wrong jump, dive,
  jump, slide. The dive cue appeared while the rendered posture was `jump`, at
  bounds x=32.5..357.5/y=725..739, inside the portrait lower dock.
- After 14 seconds the actual app reached 330m, completed its first regional
  course, accepted one corner with no misses and retained three hearts. It was
  paused without banking. No browser warnings/errors were reported; the isolated
  origin's save remained absent. The temporary tab was closed and viewport reset.
- This is end-to-end rendered-app evidence with synthetic keyboard events,
  not trusted touch input, human reaction-time evidence or physical-phone play.

## Airborne overhead escape guidance (2026-09-12)

- Airborne movement previously suppressed all ordinary obstacle cues. An
  approaching overhead arch, branch or gate now requests a downward dive in
  the existing edge dock. Starting the dive immediately removes that hint;
  jumping over low obstacles still does not repeat the jump instruction.
- Simulation checks cover all three overhead types, base/max leap, ascending,
  near-apex and descending jumps, and 22/36m/s running. In all 36 combinations,
  acting 100ms after the hint clears the row without losing a heart. Safe lanes,
  distant/used/passed gates and active Zoomies do not request a dive.
- This validates the guidance and collision simulation, not human reaction time
  or physical-device play. No movement timings or collision thresholds changed.

## Short-screen shared-camp reachability (2026-09-12)

- Browser measurement reproduced clipped clubhouse/upgrades controls in shared
  mode at 844x320: their bottom edge was 361px, below the viewport. Below 340px
  landscape height, camp now uses a smaller, readable title, omits the decorative
  eyebrow and permits vertical menu scrolling as a fallback. Gameplay and
  portrait styling are unchanged.
- At 844x320 the final action bottom is 308.44px and the menu requires no scroll.
  At 844x280 the browser successfully scrolled to and opened Upgrades. At
  320x568 portrait the title remains 51.2px and all action bottoms are within
  499.3px. No purchases or profile writes were made. Temporary tab/viewport
  settings were cleaned up. These are browser viewport checks, not native zoom.

## Mixed-action course expansion (2026-09-12)

- Added Fern dash (jump/right/duck), Ridge switch (gap/left/gap), and Moonlit
  hurdles (right/jump/left). New runs rotate four variants per region instead
  of three; existing 35m beats, recovery spacing, course bonuses and collision
  ownership remain unchanged. Version-one shared links keep their old generator,
  retries preserve that version, and newly shared links encode version two.
- All 227 tests, build, lint and artifact checks passed. Coverage includes all
  twelve courses at base/max leap and top/boosted speeds, new generated mixed
  rows, twelve laps of legacy course patterns, old/new link parsing and retry
  version preservation. Invalid future link versions still fall back safely.
- A 95-second production-app probe at 390x844 on seed 1989/version two reached
  3,081m with three hearts, five correct turns and zero misses. DOM observations
  recorded all three new named courses; regional completion totals 3/2/2 account
  for all seven encountered courses. Zipline catch/landing and Challenge were
  observed; the sampled HUD overlap checks found no issues.
- Inputs were synthetic responses to rendered prompts, not human playtesting.
  The run paused without banking, the isolated profile remained absent, and the
  temporary tab and viewport override were cleaned up.

## CPU-throttled integration check (2026-09-12)

- Ran the same local-only prompt-driven production-app probe for 60 seconds at
  390x844 with tab-scoped `Emulation.setCPUThrottlingRate` configured to 4.
  This is a desktop browser stress configuration, not an identified phone model
  or proof of a particular real-device speed. Inputs were synthetic.
- Reached 1,818m with three hearts, all regions, three correct turns and zero
  misses, three Fetch activations, Challenge selection and zipline catch/landing.
  Regional course totals were 2/1/1. Sampled HUD overlap checks found no issues.
- 7,095 frame intervals averaged 8.457ms with p95 10.2ms. The randomized route
  differs from the earlier run; these figures are not a controlled A/B comparison
  or evidence of thermal endurance. No new gameplay defect was reproduced.
- Restored CPU rate to 1, closed the paused unbanked probe and reset viewport.
  The isolated saved-profile key remained absent throughout the completed run.

## Current-release 90-second integration run (2026-09-12)

- Release `55025da`, 390x844 browser viewport, actual production app and renderer.
  The local-only `uiPlayCheck(90)` responded to rendered prompts with synthetic
  keyboard/pointer events; it did not read or change simulation state. This is
  automated integration coverage, not trusted human input or mobile hardware.
- Reached 2,901m with three hearts, four accepted turns, zero missed turns,
  all three regions, Challenge selected, and zipline catch/landing observed.
  Completed regional courses: jungle 3, canyon 2, glade 2. The rendered scene
  counter confirmed five actual Fetch uses.
- All sampled power/score/guidance/control overlap checks returned empty.
  A gameplay screenshot at 1,972m showed active magnet and double-point chips;
  the pause endpoint retained all five reusable chip elements. This supplements
  the isolated power-HUD and start-path regressions with real-run integration.
- 10,760 frame intervals: mean 8.365ms, p95 10.2ms on this Mac's browser.
  These are animation-frame intervals, not GPU timings, not an A/B improvement
  measurement, and not physical-phone performance evidence.
- The run paused at the endpoint without banking. The isolated profile remained
  absent. The temporary QA tab was closed and viewport override reset.

## Shareable starting trails (2026-09-12)

- Added versioned, validated replay links in expanded run details. Shared mode
  is explicit at camp and can be switched off without reloading or changing
  progress. Copy is user-triggered, with a selectable-field fallback when the
  clipboard is unavailable; the modal focus trap includes that field.
- All 225 tests, build, lint and artifact checks passed. Tests cover 32-bit seed normalization (including
  timestamp seeds), matching generated objects over 3,000 simulation steps,
  malformed/duplicate/incompatible codes, unrelated URL data removal, shared
  starts/retries/practice exit and failed-clipboard fallback.
- At 320x568, browser controls opened a shared trail, started and voluntarily
  finished it, exposed the matching replay link and reported successful copy.
  Link and primary actions remained reachable. Switching to random removed the
  trail parameter/banner and restored the puppy's normal Run label. The local
  test's initially absent profile was restored after its zero-score finish.
- No account, leaderboard, invitation transmission or saved-profile transfer
  was added. Links reproduce a starting layout for this generator version;
  upgrades and later route choices remain player-specific.

## Power-display start-path correction (2026-09-12)

- Follow-up integration review found the old start reset still cleared `#power`
  text, detaching the new reusable nodes. Start now resets powers through their
  owner and updates the HUD class, without erasing its children.
- The new regression executes the actual start-reset segment, checks node
  retention and reactivation, and rejects clearing the power container. All
  222 tests, build, lint and artifact checks passed. Real browser Play then
  Escape confirmed five chip nodes and four progress elements still connected
  while correctly hidden with no active powers. The unbanked test tab was closed.

## Stable power-up display elements (2026-09-12)

- Replaced the 10Hz power-display HTML rebuild with five reusable chips and
  four persistent progress elements. Labels update only when changed; timer
  values update in place. Inactive chips and the empty container are hidden.
  Existing classes, labels, order, timer scales and HUD spacing are retained.
- All 221 tests, build, lint and artifact checks passed. The new regression
  exercises 500 updates, expiration and reactivation with no new allocations
  or insertions, and verifies the four-second Fetch versus upgraded magnet scale.
- A local-only browser fixture of the bundled production module displayed all
  five powers and exposed all four correctly named progress indicators. All
  nine element identities survived 100 timer updates. The temporary fixture tab
  was closed; it did not change the saved profile or production page contents.
- This establishes reduced DOM replacement and stable accessibility identity,
  not a measured frame-rate improvement or a new full-game portrait layout audit.

## Native Safari offline reopening (2026-09-12)

- Tested release `c175da7` in iOS 27 Safari on the dedicated Biscuit Dash QA
  simulator (A684C311-2581-42FF-8F83-9E38506B11B5). An online reload requested
  the current script and offline shell; the game server was then stopped and
  connection refusal verified before and during the offline check.
- Native Safari reload displayed camp with the existing 1,380-point balance.
  Native touch opened illustrated Help, scrolled, expanded practice and started
  the basic trail. A live frame showed practice at 116m; it naturally completed
  at 0/3 with all result actions visible. This proves executable cached content,
  not only a retained menu screenshot. The saved result image is in the sibling
  `DogeQuest-1989-native-qa-2026-09-12/offline-practice.png`.
- The simulator mirror disconnected intermittently; reconnecting only the
  viewer recovered the native Safari state. The game server remained stopped
  throughout the reload, navigation and practice completion. It was restored
  after the check. No profile was cleared and no other simulator was modified.
- This closes native Simulator Safari basic offline reopening/practice coverage.
  It does not prove cache retention after OS eviction, airplane-mode behavior
  on physical hardware, offline scored-run persistence or native touch timing.

## Preserve earned rewards after graphics loss (2026-09-12)

- A graphics interruption now retires and finishes a playing/paused adventure
  before showing reload recovery. It uses the existing completion transaction
  and persistence path, preserving earned score, bones, gifts and completed
  missions instead of discarding the unfinished run. Practice remains unscored.
- Regression tests execute the actual recovery handler with the real banking
  transaction: both active states bank once, duplicate errors do not replay
  rewards, inactive/practice states do not bank, and unavailable storage shows
  an explicit reload-loss warning rather than claiming persistence.
- Recovery stops audio after finishing, so the finish cue cannot leave sound
  running on the error screen. These are handler/transaction tests, not a new
  native GPU-loss or physical-device persistence observation.

## Render-rate decision cues (2026-09-12)

- Moved adventure/practice decision-cue evaluation outside the 10Hz counter
  update. Previously a newly eligible cue or movement acknowledgement could
  wait almost 100ms for the next counter tick. It now follows rendered frames;
  score/progress counters retain their lower refresh rate. Existing `setText`
  changes the DOM only when text differs, and the edge dock remains unchanged.
- All 218 tests, build, lint and artifact checks passed. The regression executes
  the actual pre-counter cue update with real adventure/practice cue functions,
  crosses a jump deadline and starts a jump within one 100ms bucket. It verifies
  immediate warning and in-progress/cleared-text transitions. This proves the
  scheduling change, not a measured physical-device latency or frame-rate gain.

## Useful spare hearts (2026-09-12)

- Heart pickups now award 100 bonus points at full health instead of disappearing
  without benefit. At one or two hearts they still heal exactly one heart and
  award no bonus. The existing pickup sound/effect and score convey collection;
  no new notice or panel was added. Help and README explain the conversion.
- All 217 tests, build, lint and artifact checks passed. The added simulation
  regression checks all three health states, single consumption, exact score,
  no bone/count/combo/Fetch changes and no doubling of this non-bone reward.

## Optional-route collection fairness (2026-09-12)

- Fixed a reproduced scoring bug: inaccessible airborne bones reset the ground
  runner's collection combo when passing underneath an optional cable. Missed
  bones now reset the combo only when their route is reachable. They still get
  marked processed, cannot be collected from below, and award no free points.
- Two regressions failed before the fix and passed afterward. Coverage checks
  ground/airborne bones with and without an active cable, and skipping complete
  generated cables at 650m and 2,050m followed by a real ground pickup that earns
  the expected ten-bone bonus. Reachable misses continue to reset the combo.
- All 216 tests, build, lint and artifact checks passed, including existing
  18-bone cable steering and magnet isolation checks. This is simulation-backed
  scoring verification; no visual or native-input behavior changed.

## Native portrait practice navigation (2026-09-12)

- Real iOS 27 Simulator Safari on the dedicated Biscuit Dash QA device exposed
  practice buttons clipped beneath Help's scrollable content after expansion.
  Practice now uses the same reveal-on-open behavior as challenge help; closing
  either disclosure does not move the viewport.
- All 214 tests, build, lint and artifact checks passed. A regression executes
  the actual disclosure handlers and checks open versus collapse behavior.
- Native touch opened Help, scrolled, expanded practice and started the basic
  trail. Both practice buttons became fully visible above the fixed actions.
  An idle run naturally reached its 0/3 result; Back to camp retained the shown
  1,380-point balance. Screenshots are in the sibling directory
  `DogeQuest-1989-native-qa-2026-09-12` (practice-visible and practice-result).
- This establishes native Safari navigation, rendering and basic practice
  completion, not successful native timed gestures, multi-touch, physical-phone
  performance or native offline reopening. Those remain separate checks.

## Practice timing feedback (2026-09-12)

- Basic practice now distinguishes preparation, movement in progress and the
  actual result. It no longer repeats `JUMP NOW` or `SLIDE NOW` while the named
  action is underway. A one-second message in the existing edge dock confirms
  a clear or explains a missed/early move using recorded collision evidence.
  No new panels, center-screen messages or adventure-physics changes.
- All 213 tests, build, lint and artifact checks passed. Tests exercise actual
  moves and collision outcomes, early jump/slide coaching, unconsumed feedback,
  and 0/0.1/0.2/0.3-second cue response delays at base and maximum upgrades.
  Every delayed-input simulation clears all three lessons.
- At 320x568, browser keyboard play with a deliberate 150ms input delay cleared
  3/3. Observed cue transitions included preparation, `Jumping`, `Jump cleared`,
  `Sliding`, `Slide cleared`, steering and `Open lane found`. An idle retry ended
  0/3 and showed the three appropriate action instructions. The saved profile
  remained absent through both checks; the isolated local cache was cleaned.
- A saved screenshot in the sibling
  `DogeQuest-1989-practice-feedback-2026-09-12/jump-feedback.png` confirms the
  feedback below the dog at compact portrait size. Browser and simulation
  evidence do not establish human learning effectiveness or native touch timing.

## Tall-phone decision-window framing (2026-09-12)

- Projection diagnostics found opposite-lane bone centers outside the viewport
  after a bend with the fixed 52-degree vertical field of view. These were
  representative camera/route configurations, not a claim that every sampled
  point contains a generated bone.
- Gameplay now preserves a minimum 30-degree horizontal view for supported
  portrait ratios. At 390x844 this uses a 60.22-degree vertical view; 320x568,
  desktop and landscape keep 52 degrees. Menus and generated previews explicitly
  retain their original framing. Extremely narrow/invalid dimensions are bounded.
- A new projection regression samples 50–4,500m, three portrait ratios, all
  three lanes, camera-follow offsets and 0.45/0.6/0.8-second approach windows.
  It checks a conservative ground-bone envelope, excluding the deliberately
  object-free corner reservations. Existing puppy-envelope checks retain jumps,
  zipline height, lane lag and curves. This is not visibility certification for
  every airborne/power-up shape or every possible long-run state.
- A 390x844 browser keyboard run reached 1,008m with three hearts, two accepted
  turns and zero missed turns. Canyon and left-lane glade screenshots confirmed
  readable dog/controls and the opposite lane visible after the bend. Files are
  in the sibling `DogeQuest-1989-camera-check-2026-09-12/` folder. Illustrated Help
  images all loaded afterward. The local save remained absent throughout.
- All 210 tests, build, lint and artifact checks pass. No pickup positions,
  collision boxes, input windows, physics or reward rules changed. Very close
  peripheral objects can still clip; this fix targets the earlier decision
  window. These are desktop-browser and projection tests, not physical-phone,
  glare or human motion-comfort evidence.

## Fresh portrait scene audit and cable cleanup (2026-09-12)

- Used the screenshot-led product-design audit on the current 390x844 runner:
  jungle at 108m, canyon at 536m, cable at 721m, and glade at 1031m. The run
  retained three hearts through both turns and all regions. Saved screenshots
  and step-specific findings are in the sibling folder
  `DogeQuest-1989-visual-audit-2026-09-12/AUDIT.md`.
- The cable's camera-side tail became a thick foreground beam. Renderer-only
  clipping now ends it 1.5 units behind the dog, retaining its normal thickness,
  contrast, forward geometry and attachment. Full-length segments ahead are
  unchanged; overlapping clipped segments preserve continuity as tiles recycle.
- A fresh practice screenshot in the same cable section confirmed the beam
  removed and dog/handle visible. Before/after frames have different lane and
  HUD states, not pixel-identical gameplay. That practice finished with 18/18
  bones. All 208 tests, lint, build and artifact checks passed; the new test
  sweeps tile phases for continuity, attachment coverage and tail bounds.
- Other findings: near-canyon bones retain dark outlines; distant sign text
  needs the existing backed guidance; peripheral foreground bones can clip.
  This pass is not a full accessibility, glare, native touch or low-end GPU
  certification. No movement, collision, reward or save rules changed.

## High-bone rehearsal and catch visibility (2026-09-12)

- How to play now offers an optional 17-second high-bone practice trail.
  It starts just before the actual first zipline, uses the adventure's generated
  cable/reward layout and real catch, steering and landing physics at practice
  speed. All 18 high bones are reachable without a magnet. Saved upgrades apply.
- A missed handle ends after under four seconds with specific advice and a
  same-rehearsal retry. Successful results report bones collected and explain
  automatic landing. Practice stays unscored, never banks rewards, and normal
  adventure starts fresh. Displayed practice distance begins at zero; the
  initial interpolation state starts at the cable approach rather than camp.
- A compact aerial screenshot exposed an instruction sign covering the dog.
  The sign and its backing now disappear inside the catch window or after a
  catch, while the station, grips and cable remain visible. Reused stations
  restore their sign on approach. This visibility fix also applies in adventures.
- All 207 tests, lint, build and artifact checks passed. Tests cover missed
  catch, all 18 bones and automatic landing at every jump-upgrade level,
  non-banking, initial interpolation and sign/structure visibility separation.
- Browser keyboard play at 320x568 followed only visible jump/steering prompts
  and collected 18/18 before and after the sign fix. Screenshots confirmed the
  obstruction and its removal. Same-rehearsal retry, natural missed catch,
  readable results and the fresh normal-adventure transition were checked.
  The local save remained absent throughout; the isolated cache was cleaned.
  This is desktop browser portrait evidence, not native touchscreen coverage.

## Two-thumb controls (2026-09-12)

- Explicit action buttons now accept a second touch contact, so one thumb on
  a direction control cannot block the other thumb's jump, slide or Fetch.
  Free trail gestures still require one primary owner. Alternate mouse buttons
  and secondary non-touch pointers remain rejected.
- An explicit action cancels an unfinished trail gesture. Releasing that old
  finger cannot add an accidental tap-jump or swipe. Native click events do not
  duplicate the pointer action; keyboard activation remains available.
- All 204 tests, lint, build and distribution checks passed. Tests execute the
  actual trail/button listeners together, including two-thumb left-plus-jump,
  slide superseding a trail contact, stale release, next valid tap, pause and
  keyboard activation.
- At 390x844, synthetic browser PointerEvents with primary left and secondary
  jump contacts produced rendered lane 1 and jumping posture. The observer
  confirmed `isTrusted: false`; this is integration evidence, not hardware
  multi-touch evidence. The in-app browser rejected native multi-touch dispatch
  as unsupported. Native touchscreen verification remains open.
- Disposable progress/cache from this local check were cleaned afterward.

## Finish on your own terms (2026-09-12)

- Paused adventures now offer `Finish & bank points` instead of abandoning
  earned progress. This ends the simulation without removing hearts and uses
  the normal, once-only reward transaction. Unfinished challenges, courses and
  ziplines do not gain completion rewards. Practice still leaves without banking.
- Voluntary results say `Home safe` and do not blame an earlier collision.
  Resume stays the primary pause action; no new in-run controls or notices.
- All 203 tests, lint, build and artifact checks passed. New tests execute the
  actual camp-button handler, check once-only rewards, unchanged hearts,
  frozen completed simulation, unfinished-goal exclusion and practice behavior.
- A real browser run at 320x568 paused at 83m with three hearts. Finishing
  banked 183 points and four bones, with zero challenges completed. Returning
  to camp and reloading retained exactly those totals. Pause/results screenshots
  showed reachable actions and readable content. This is browser-emulated
  portrait evidence, not a native Safari or physical-phone result.
- The isolated local playtest progress and runner cache were removed afterward;
  production progress was not changed.

## Offline recovery follow-up (2026-09-12)

- Temporary navigation failures (HTTP 500, 502, 503 and 504) now use the
  previously verified cached game when available. Intentional 404 responses
  remain visible, and a missing cache preserves the original server response.
- Cache access failures no longer prevent known game assets from loading
  online. If both storage and networking fail, loading still fails honestly.
- All 200 tests, lint, production build and artifact checks passed. New
  regression tests execute the worker with simulated server and storage
  failures; these are not native Safari outage tests.
- The dedicated simulator follow-up could not finish because its mirror
  disconnected and Device Hub timed out. Its helper was stopped without
  changing other simulators. Native Safari checks of practice and offline
  reopening remain open; previous browser evidence is recorded below.

## Isolated iOS Safari follow-up (2026-09-10)

- Used a newly created iPhone 17 Pro / iOS 27 simulator named
  `Biscuit Dash QA — Sep 10` (UDID
  `A684C311-2581-42FF-8F83-9E38506B11B5`). Other projects' simulators were
  not reused or modified. Safari ran the local production build through a
  live simulator mirror. This is iOS Simulator evidence, not physical hardware.
- Actual mirrored gestures started play, changed lanes, jumped and slid;
  pause/resume and natural game-over were also inspected. Tool-paced play
  is not a difficulty or frame-rate benchmark.
- Landscape Safari exposed clipped primary results, camera-cutout overlap
  with hearts, and upgrade dialogs whose items were hidden by their actions.
  Short landscape dialogs now use bounded, independently scrollable content
  beside their actions. Safe-area-aware HUD margins clear either cutout side.
- Scrolled upgrades exposed a second issue: Help inherited the previous
  dialog's scroll position. Changing dialog state now resets content to the
  top without focus-induced scrolling; same-state purchase updates preserve
  the current list position. A regression test executes the actual state
  transition function and checks both cases.
- Simulator screenshots verified primary results and both cutout directions,
  upgrade content scrolling with actions retained, and Help starting at its
  heading. Rotation back to portrait retained readable Help instructions,
  camp navigation, upgrade rows and reachable primary/back actions.
- At a separately emulated 874x300 viewport with 62px side safe areas,
  normal and route-choice stress checks passed after moving the route dock
  above the near trail. A 40-second trusted-input run reached 1,095m with
  three hearts, two turns, all regions, a caught/landed zipline and two Fetch
  uses: 51 trusted and zero untrusted key events, no checked HUD overlaps.
  This browser run is separate from the simulator gesture evidence.
- Layout guards now reject initially clipped primary results and score/heart
  overlap with side safe areas. Temporarily restoring the old layouts made
  these guards fail; restored fixes passed.
- Release `4404311`: all 150 tests, lint, build and artifact checks passed.
  CI `34533271417` and Pages `34533271484` succeeded. Published runner HTML,
  JavaScript and CSS each matched the tested local build byte-for-byte.
  No physics, scoring, save format or original 2D gameplay changes were made
  in these layout fixes.

## Input and feedback follow-up (2026-09-08)

- Gameplay release `010826b`, acceptance helper `8d6ac1d`: 149 tests pass.
  The helper now requires at least one actual Fetch activation, in addition
  to distance, turns, regions, zipline completion, hearts and trusted inputs.
- Live 1280x720 run: 1,102m, three hearts, two turns, all three regions,
  zipline caught and landed, two Fetch activations, 54 trusted/zero synthetic
  key events and no checked HUD overlaps.
- Live 320x568 browser-emulated layout: 1,105m, three hearts, two turns,
  all regions, complete zipline, two Fetch activations, 50 trusted/zero
  synthetic keys and no checked HUD overlaps. This is not physical touch QA.
- Local browser pointer check on `a4be957`: a 600ms held contact released
  without jumping while still playing; a following quick tap produced jump.
  Unit tests also cover secondary buttons, unrelated pointers and diagonal
  out-and-back drags. These mouse inputs do not establish phone usability.
- Local browser sound check on `dbc31b8`: enabled slide created a voice;
  mute suspended the audio context, and an isolated muted jump/slide sequence
  created zero voices. Temporary instrumentation was removed.
- All seven cues, including slide and Fetch-ready, rendered finite, nonzero
  offline browser audio below the established peak limit. Readiness tests
  cover one chime per usable transition and waiting for magnet expiry.
  This verifies generated audio, not subjective listening quality.
- Gameplay assets for `010826b` matched live HTML, JavaScript and CSS bytes.
  CI and Pages for acceptance-only `8d6ac1d` both succeeded
  (34294609456 / 34294609508). No gameplay files changed in that commit.

## Contrast and scenery decluttering follow-up

- Noninteractive scenery sits 25% farther from the lane center; roughly one
  third of nongateway decoration groups are omitted. Hazards, route markers,
  rewards and collision geometry are unchanged.
- Score, bones, mission and touch controls have darker backings; hearts have
  a dark edge shadow. Removed control backdrop blur for a cleaner silhouette.
- All 134 tests, lint, build and distribution checks passed. Inspected the
  running HUD at 390x844 and all three regional previews. Worst-case HUD
  checks at 320x568 and 844x390 reported no overlaps or out-of-bounds controls.
- Three seeded 4,500m runs retained all hearts, completed 21 turns and nine
  ziplines, and exercised 13 split rows. Renderer peaks: 15 geometries, four
  textures, 121 objects and 197 draw calls. An input-driven 40-second local
  run also retained all hearts and caught/landed the zipline. These are desktop
  browser checks, not physical-phone verification.

## In-run visual readability

- Bones are 30% larger with a saturated gold, shaded material and bounded
  quarter-radian sway instead of full spins that turn them edge-on. No change
  to pickup reach, collisions, jump/slide timing or saved progress.
- Solid logs/rocks have darker bodies against the pale road. Overhead arches
  and gates use deep teal frames and bright mint clearance strips; branches
  share the mint strip. Actual obstacle shapes still distinguish actions, so
  the distinction does not depend on color alone.
- Hazard crystals are saturated purple/teal rather than pale scenery-like
  colors. Noninteractive decorative gateways are hidden during runs, leaving
  actual slide gates and route-choice markers intact. Camp decoration remains.
- Split-decision and three-region renderer previews were inspected at phone
  aspect ratios. All 134 tests pass. Three 4,500m renderer runs retained three
  hearts, with 21 turns, nine ziplines and 13 split rows. Peaks remain bounded:
  15 geometries, four textures, 121 objects and 203 draw calls.
- Full-motion 60-second 390x844 browser run: 1,821m, three hearts, all regions,
  three correct turns, zipline catch/landing, no HUD overlaps or browser errors.
  Mean frame interval 16.66ms and p95 16.70ms. These are desktop-browser results,
  not a physical-device performance guarantee.

## Split-decision obstacle rows

- Later ordinary/Challenge action rows periodically offer one slide-under gate
  beside two jumpable logs. The gate lane varies using the seeded route choice.
  Introduction is after 800m; Scenic, full-width gaps and authored courses keep
  their existing patterns. Full action-row spacing (at least 42m) is retained.
- All 134 tests pass. New checks cover row composition, Scenic/opening exclusion,
  reward preservation and recovery distance; every lane's correct cue/action at
  22/36/46.8m/s; wrong-action damage with no free clear. The seeded-row invariant
  now explicitly validates mixed rows instead of assuming uniform obstacle type.
- Long-run QA now reads the obstacle in the occupied lane when an action row
  has no open lane. Three seeded 4,500m runs encountered 13 split rows, completed
  21 turns and nine ziplines, and retained three hearts throughout. At 54 renderer
  checkpoints: peaks 15 geometries, four textures, 121 objects, 197 draw calls.
- The real-renderer split-row fixture was inspected at 390x844 with Mochi:
  low logs and overhead gate are distinct, with no new model or texture budget.
- Input-driven 60-second 390x844 playtest: 1,821m, three hearts, all regions,
  courses 2/1/1, three turns with zero misses, zipline catch/landing, no HUD
  overlaps or browser errors. Mean frame interval 16.66ms, p95 16.80ms. This
  is desktop browser emulation, not a physical-phone performance claim.

## Zipline collection guidance follow-up

- The edge dock now points toward the nearest upcoming aerial bone or gift.
  Choosing the requested lane clears its cue while steering settles. Bone cues
  disappear during magnetic attraction; gift cues remain because gifts require
  physical lane alignment. No mid-screen banner or change to physics/rewards.
- New simulation checks follow only these cues with 150ms input sampling and
  collect all 18 bones plus the gift on both first and later ziplines. Cue tests
  cover reward ordering, immediate quieting, used/pulled pickups, magnets and
  the gift exception. Full suite: 131 tests.
- 40-second 390x844 browser check saw left/right bone and gift guidance, caught
  and landed the zipline, and reached 1,105m with three hearts, two correct turns
  and no HUD overlaps or browser errors. Mean frame interval 16.65ms, p95 16.70ms.
  The subsequent magnet/gift exception has a targeted regression assertion;
  final published build receives a fresh live check.

## Persistent dog bonds and regional passport

- Four dogs each have 10/40/100-clear-plus-turn milestones; three regions each
  have 3/10/25-clean-course stamps. All 21 collectibles are persistent, with
  one-time rewards in existing upgrade points. The chosen dog is captured at
  run start, not inferred from the later equipped dog. No stat advantages,
  daily requirements or additional currency. Old saves begin new counters at
  zero without losing existing progress or inventing past achievements.
- Build, artifact checks, lint and all 129 tests pass. Tests cover malformed
  and old saves, isolated dog and regional progress, all tier crossings,
  single payment, unfinished-run rejection, invalid dog IDs, stable banking
  receipts and save roundtrips.
- Local browser used a documented near-threshold fixture: Mochi bond 9,
  regional counts 2/9/24, 123 credits and magnet upgrade 1. A real input-driven
  60-second 390x844 Mochi run reached 1,821m, three clean turns, courses 2/1/1,
  all regions, zipline catch/landing, three hearts, zero HUD overlaps or browser
  errors. 3,602 frames; mean 16.66ms, p95 16.70ms (desktop emulation).
- Continuing without controls ended naturally at 2,235m: 23 clears + 3 turns
  increased Mochi to 35; other dogs remained zero. Regions became 4/10/25.
  Four threshold crossings awarded exactly 1,850 points. Final credits 11,938
  equal prior 123 + score 8,915 + mission 250 + existing prizes 800 + mastery
  1,850. Retry started immediately at zero Fetch charge. Reload preserved all
  counters and the same balance without replaying any milestone reward.
- Final badge UI was inspected at 320x568: seven earned badges, no horizontal
  overflow, scrollable cards and reachable persistent actions. Passport is
  collapsible so dog/outfit selection remains near the top. This section is
  slice evidence, not completion of the entire expanded-goal audit.

## Player-controlled Fetch ability

- Fetch earns 2% per hand-collected bone, 12% per clean obstacle and 20% per
  correct marked turn. At 100%, F or the touch button starts a four-second
  magnet. Active magnets preserve charge; Fetch cannot recharge itself.
  Saves and jump/slide durations are unchanged; charge is run-local.
- Build, artifact checks, lint and all 125 tests pass. Ability tests cover
  charge/cap/single spend, correct skill rewards, assisted-smash exclusion,
  actual side-lane collection, aerial exclusion on the ground, expiry, zipline
  activation, ended-run rejection and fresh retry. An additional simulation
  check confirmed aerial collection while riding.
- Browser run at 390x844: 60 seconds, 1,821 meters, 3,602 frames, mean 16.66ms,
  p95 16.70ms, three hearts, three correct turns, zero missed turns, all regions,
  courses 2/1/1, zipline catch and landing. Three actual Fetch activations used
  alternating keyboard and touch input. No HUD overlaps or browser errors.
- A first layout overlapped the guidance dock; it was replaced before release.
  Final 320x568 layout inspection confirmed five separate controls, each at
  least 48x56 pixels and fully on screen. Desktop emulation, not physical-phone
  performance verification. Persistent mastery remains unfinished.

## Regional courses and pressure/recovery pacing

- Replaced the generic repeated sequence with three authored regional courses:
  jungle log/branch/log timing, canyon gap/log/gap crossings, and glade left/right/
  center slaloms with distinct crystal models. Three beats are spaced 35 meters
  apart, followed by a gift and 30 meters without another hazard. All gap rows
  align to the paving grid. A clean course awards 180 points exactly once.
- Courses stay inside their region, avoid corners/route-decision/zipline
  reservations, and appear at most once per region visit. Scenic skips them.
  Challenge hazard beats remain inside its duration; only the clear recovery
  may extend past it. Jump/slide durations, turn controls and existing saves are
  unchanged. The three regional completion counters are per-run, ready for the
  later persistent mastery work; no persistent mastery is claimed yet.
- All 120 tests pass with build, lint and artifact checks. Coverage includes all
  courses at normal top speed and with Zoomies, base/max leap upgrades, explicit
  slalom lane requirements, failed-course denial, duplicate-award prevention,
  reservations, recovery spacing and guidance priority.
- Final accelerated production-renderer check: three 4,500-meter seeded runs,
  54 checkpoints, 21 clean turns, zero missed turns, nine ziplines, and three
  hearts throughout. Clean courses: 12 jungle, three canyon, three glade. Peaks:
  15 geometries, four textures, 123 pooled-plus-active objects and 197 draw calls.
- The three course entrances were visually inspected through the production
  renderer at a 390×600 camera aspect. This is a local fixture; naturally earned
  course coverage comes from the separate input-driven checks, not the gallery.
- Final 60-second local keyboard-driven 390×844 run with Mochi and full motion:
  1,821 meters, two jungle courses, one canyon course, one glade course, three
  clean turns, zero misses, zipline catch/landing and three hearts. 3,602 frames,
  mean 16.66 ms, p95 16.80 ms, no detected HUD overlap and no browser errors.
  This is desktop browser emulation, not a physical-phone performance claim.

## Research-led adventure: deliberate corners and real terrain

This is the first verified slice of the expanded goal in `ADVENTURE-ROADMAP.md`,
not completion of the remaining traversal, charged-ability and mastery work.

- Marked 90-degree corners share one schedule between simulation and rendering.
  Left/right input commits during a one-second cue window, does not also change
  lanes, and can correct an initially wrong direction. A clean turn awards 100
  points exactly once. Misses cost a heart or shield and recover; Zoomies does
  not turn for the player. Generation reserves clear approaches and exits.
- A cached, true world-space centerline replaces lateral-only bends. Gentle
  hills change road, scenery, obstacle and puppy grade together without changing
  jump airtime or slide duration. Corners and special traversal remain level.
  Geometry tests cover continuity through 280 km, bounded grades and arc length.
- Continuous corner ribbons replace intersecting slabs/rails, including later
  corners on wooden river decks. Terrain banks follow the hills. Overhead meshes
  and decorative archways leave the chase-camera corridor after passing, without
  changing collisions or interrupting magnet pickups.
- One quiet edge cue confirms turns, with a matching control highlight. Results
  show clean turns, clears and best bone streak, plus advice based on the actual
  final mistake. The retry action remains visible in the scrolling result dialog.
- Build, artifact checks, lint and all 118 tests pass. New coverage includes turn
  timing/correction/rewards/damage, reservation safety, route geometry, ribbon
  buffer reuse, wooden corners, visibility and post-run guidance.
- Final accelerated production-renderer check: three 4,500-meter seeded runs,
  54 rendered checkpoints, 21 clean turns, zero missed turns, nine ziplines and
  minimum three hearts. Peaks: 15 geometries, four textures, 108 active-plus-pooled
  objects and 165 draw calls. This is simulation with rendered checkpoints, not FPS.
- A 60-second local keyboard-driven run with Mochi and full motion at 390×844
  reached 1,821 meters, completed three turns with zero misses, visited all three
  regions and caught/landed the zipline. Three hearts remained; 3,601 frames,
  mean 16.66 ms, p95 16.70 ms and no detected HUD overlap. A separate unadapted
  driver missed the first three corners and ended at 1,550 meters; the resulting
  right-turn advice and visible retry were checked on screen.
- Normal/reduced-motion galleries were visually inspected at both corner
  midpoints, bridge joins, a hillside and the later 2,950-meter river corner.
  Combined powers retained their expected attraction/expiry/shield behavior when
  the test driver handled turns; the previous driver incorrectly spent its
  shield by ignoring a newly required turn and was updated, not the game rules.
- Five-indicator layout fixtures pass at 320×568, 390×844, 568×320 and 844×390.
  Keyboard menu focus, pause/resume, frozen Mochi body/leg poses and short-landscape
  dialog actions were checked. No browser errors were reported. These checks are
  desktop browser emulation; physical-phone performance is not claimed.
- Normal builds exclude the local-only browser fixture. Existing saves and the
  separate original 2D game are preserved; their regression tests remain green.

## Shorter actions and a quieter trail

- Normal jump airtime is 0.72 seconds at all four leap levels; launch speed and gravity scale together so upgrades add height without extra float. Ground slides last 0.58 seconds, or 0.79 seconds at level three. The late-jump buffer is 120 ms; continuous dives, full slide duration on touchdown and momentum-aware steering remain intact.
- Removed center-screen banners, repeated tutorials, milestone interruptions and duplicate power-up chatter. A single edge dock prioritizes actionable cues, route choices, brief important notices and unfinished goals. Hints forecast the physical lane at impact, avoid repeating a covered slide, and still allow a jump hint during a ground slide. Power indicators use compact chips without moving the score panel when they activate.
- Ambiguous diagonal swipes wait for a clear axis instead of triggering the wrong action. Short trail taps still jump. Paused runs explicitly warn that leaving will not bank points or gifts; the action is labelled “Leave this run.”
- All 98 simulation/unit tests pass, including every hazard with the shorter cue window, base/top/boost-transition speeds, unchanged upgraded airtime, too-early actions expiring, cue priority/suppression, physical-lane prediction and swipe classification. Build, lint and release-artifact checks pass; normal builds remove the local-only browser fixture.
- Real-time local 390×844 run with Mochi and full motion: 60 seconds, 1,886 meters, 3,600 frames, mean 16.67 ms and p95 16.80 ms. All three regions, Challenge selection, zipline catch and landing were observed, with three hearts and no detected HUD overlap or browser errors. This is desktop-browser viewport emulation, not a physical-phone performance guarantee.
- Accelerated production-renderer check: three 4,500-meter runs, 54 checkpoints, nine ziplines and minimum three hearts. Peaks: 14 geometries, four textures, 117 active-plus-pooled objects and 182 draw calls.
- Five-indicator layout stress checks pass at 320×568, 390×844, 568×320 and 844×390. The final compact labels fit a single row at 320 pixels wide; the cue sits at y=453 above the controls. This fixture tests layout, not naturally earning five powers simultaneously. Before/after phone-sized gameplay screenshots were visually inspected.
- Actual keyboard-driven browser actions returned from jump posture in 708 ms and slide posture in 584 ms, consistent with the simulation durations and frame-sampled height threshold. The pause warning and leave label were verified in the rendered interface.

## Momentum, air slides and landing weight

- Replaced instantaneous sideways velocity changes with an exactly integrated damped spring. Jump presses use a 180 ms time window instead of a fixed near-ground height cutoff. Air slides accelerate into a capped dive, and their full ground duration starts at touchdown; basic jump height, gravity, obstacle thresholds and progression remain unchanged.
- Landing integration records the exact impact time/speed and preserves the remaining part of a simulation step for a buffered rebound. Decorative banking follows sideways velocity; nose pitch follows vertical velocity; a small impact-weighted compression settles after landing. In-air and sliding poses no longer receive the unrelated running bob. Reduced motion disables these decorative weight cues.
- New tests cover 30/60/120 Hz steering and reversal equivalence, standard/upgraded late jump buffers, expiry without midair jump stacking, continuous dives, full slide duration, exact landing time/impact, a rebound precisely on a step boundary, invalid delta no-ops and bounded/reduced-motion body poses. Existing obstacle-clearance, difficulty, gap, upgrade and zipline regressions continue to pass.
- Local 390×844 real-time run with Mochi and full motion: 60 seconds, 1,821 meters, 3,600 frames, mean 16.67 ms and p95 16.70 ms. Three hearts remained; all three regions, Challenge, and zipline catch/landing were observed, with no detected HUD overlaps. This is desktop-browser viewport emulation, not a physical-phone performance guarantee.
- Accelerated production-renderer check: three 4,500-meter runs, 54 checkpoints, nine ziplines and minimum three hearts. Peaks: 14 geometries, four textures, 117 active-plus-pooled objects and 182 draw calls. Local-only movement galleries isolate takeoff, dive, touchdown, slide and lane reversal on an empty practice strip; real obstacles are covered by the separate run checks.
- Full build, release-artifact validation, lint and all 87 tests pass. Normal/reduced-motion galleries were visually inspected; `posePauseCheck('mochi')` verified the entire body transform and leg angles remain identical over 60 paused draws, then leg easing resumes. No browser errors were reported.

## Photo-inspired Mochi character

- Mochi now uses dedicated smooth anatomy, a silver crown, charcoal coat, longer dark floppy ears, brown eyes and cream eyebrows/beard/paws. The supplied photograph was used as a visual reference only and is not a repository asset. Two deterministic 128×128 procedural textures and instanced hair cards create the coat; no external artwork request or per-frame fur allocation is needed.
- All 80 tests pass. New model coverage checks animation-joint ordering, deterministic finite transforms, independent instances, shared geometry, at most 64 meshes, fewer than 100,000 triangles and the two small generated textures. Running physics and saved progression are unchanged.
- Inspected an enlarged portrait and all six Mochi outfits through the production renderer. The gallery switches a contrasting puppy/party outfit before every capture; a separate Pepper gallery checks the reverse Mochi-to-original-model transition. Hats are lifted for Mochi's crown, with separate coat/cape fitting and full transform resets for other puppies.
- Real-time local run at 390×844 with Mochi/scarf selected through the clubhouse and full decorative motion enabled: 60 seconds, 1,886 meters, 3,602 frames, mean 16.66 ms and p95 16.70 ms. All three regions, Challenge, zipline catch and landing were observed; three hearts remained, with no detected HUD overlap or browser errors. This is desktop-browser viewport emulation, not a physical-phone performance claim.
- Accelerated production-renderer check: three 4,500-meter runs, 54 checkpoints, nine completed ziplines, minimum three hearts. Peak resources: 14 geometries, four textures, 117 active-plus-pooled objects and 186 draw calls. A 220-draw-call regression ceiling supplements the existing resource checks. The normal production build removes all local-only visual fixtures.

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

## Audio and release assets

`audioCheck()` in the local fixture renders all five cues with a real browser OfflineAudioContext and rejects silent, invalid or excessive output. Latest peaks ranged from 0.0334 to 0.0348, with nonzero RMS for every cue. Unit tests verify the 12-voice cap, immediate mute stop calls and node disconnection. This is output validation, not a physical-speaker listening check.

The build bundles runner CSS and adds content-derived revision queries to both the stylesheet and game script. Artifact verification recomputes both hashes and rejects stale HTML references or unbundled CSS imports. The local browser loaded both versioned assets and reached the playable state without errors.

## Real-time UI and compact layouts

A 22-second browser run driven by visible prompts reached 547 meters, saw the route gates and selected Challenge. At a measured 500×481 desktop-browser viewport it recorded 1,321 animation frames, 16.66 ms mean and 16.70 ms p95 frame intervals, with two hearts remaining. This is one desktop-browser sample, not a physical-phone or worst-case performance guarantee. A prior attempt lost its page and is excluded. `uiPlayCheck()` provides a reusable local-only version of the prompt-driven check, without reading or modifying simulation state.

A real pointer drag moved the puppy to lane 3; the on-screen Slide button changed posture after resuming. Distance remained 110 meters across a 750 ms paused interval. Compact portrait (320×568) inspection found overlapping footer/stats and buttons over the puppy; a dedicated compact layout corrected both. Landscape (568×320) inspection found a 340-pixel game area; it now fits 320 pixels, with controls ending at 298 pixels and the motion toggle available. Screenshots were inspected after both fixes.

A second 22-second run using the reusable `uiPlayCheck()` at 1280×800 with decorative motion enabled reached 558 meters, saw and selected Challenge, and retained all three hearts. It recorded 1,322 frames, 16.65 ms mean and 16.70 ms p95 intervals. This strengthens desktop real-time coverage but is not a worst-case or device-wide guarantee.

## Graphics and storage recovery

Actual `WEBGL_lose_context` loss was triggered at camp and during a run. Both displayed the dedicated recovery dialog. During-run distance stayed at 8 meters over a 750 ms interval and serialized saved progress was unchanged. Reload returned to a playable menu. Initial WebGL creation failure was also injected: Play remained disabled, the recovery dialog appeared, Tab focused its fallback link, and that link opened the 2D Puppy Quest.

Generate local fault pages with `node scripts/prepare-recovery-qa.js` after building. Use `/runner/recovery?fault=graphics` or `/runner/recovery?fault=storage`; the local server's `.html` redirect drops the query, so that form must not be used. Fault-mode presence was verified before accepting results.

With storage reads and writes blocked, equipping Mochi and starting/pausing still worked, while the session-only warning remained visible after menu refresh and on pause. Unit tests distinguish unavailable storage from malformed/absent saves, test quota failure and prevent overwriting progress that could not be read at startup. Normal builds remove the fault pages, and artifact verification rejects them if accidentally retained.

## Remaining checks

Broader device/viewport coverage, longer worst-case frame-time profiling and physical-speaker listening checks remain unverified. The real-time runs, pointer tests, route-choice interactions and injected recovery tests above prove only their stated scope.
# Alternating obstacle sequences

- Added deterministic coverage for both three-beat patterns, full-width rows, gift placement, Scenic exclusion and gate approach clearance.
- Input-driven simulation clears both patterns at 36 m/s with base and level-three leap, retaining three hearts and collecting the finish gift.
- `npm run check`: 60 tests pass, build, artifact verification and lint pass.
- Browser real-renderer accelerated check after this change: three 4,500-meter runs, 54 rendered checkpoints, minimum three hearts; peak 11 geometries, two textures, 113 active-plus-pooled objects and 140 draw calls. This is not a real-time frame-rate measurement or physical-phone validation.
# Wooden river crossings

- Real-time 390×844 browser run used visible prompts and keyboard events for 22 seconds: reached 547 meters across the first bridge, selected Challenge, retained three hearts; 1,321 frames, mean 16.67 ms and p95 16.70 ms. This is desktop browser emulation, not a physical phone.
- Grid-aligned deck boundaries and 20 repeating cycles covered by unit tests; full check passes 61 tests plus build, lint and artifact checks.
- Real-renderer 390×844 screenshots inspected at the entrance and on the deck: continuous paving-to-plank transition, readable rope rails and unobstructed obstacle silhouettes.
- Accelerated browser check: three 4,500-meter runs, 54 checkpoints, minimum three hearts. Peaks: 11 geometries, two textures, 113 active-plus-pooled objects, 137 draw calls. Rendering remains batched; no physical-phone performance claim.
# Sky Paws zipline traversal

- Final real-time 390×844 check used visible prompts and keyboard input: 34 seconds, 907 meters, three hearts, Challenge selected, zipline caught and landed. 2,042 frames, mean 16.66 ms, p95 16.70 ms. This is desktop browser emulation, not a physical phone.
- Directly awaiting a 34-second browser evaluation caused the automation client to retry the test and overlap runs. Those interrupted attempts are excluded. The passing check was started once with an immediate return and its stored result read separately; `startUiPlayCheck()` / `readUiPlayCheck()` now provide that reusable pattern.
- Full `npm run check` passes 67 tests, build, lint and artifact checks.
- Simulation covers exact schedule, clear approach/landing and aerial prize generation; catches from all lanes at early/middle/late jump inputs, base/max leap, ordinary/capped/Zoomies speeds; continuous vertical motion, input lock for jump/slide while retaining steering, automatic release and one-time rewards.
- Missed catches retain three hearts; ground magnets cannot take airborne rewards. Real lane inputs collect all 18 bones and the gift without a magnet. Magnet + double-point interaction retains normal timer behavior and yields 900 bone points.
- The local real-renderer fixture uses actual jump and steering inputs to enter the ride, rather than setting the riding state. Phone-sized inspection caught decorative archway interference; those decorations are now hidden within the cable interval.
- Updated three × 4,500-meter browser simulation completes nine ziplines with minimum three hearts, 54 rendered checkpoints and peaks of 11 geometries, two textures, 111 active-plus-pooled objects and 133 draw calls. This is accelerated checkpoint rendering, not real-time performance.
# Integrated gameplay, rewards and dialog navigation

- After the HUD repair, the 320×568 real-time check ran 34 seconds to 907 meters with three hearts, all three regions, Challenge and a completed zipline, with no observed HUD overlap. It recorded 2,041 frames, mean 16.66 ms and p95 16.70 ms. The five-indicator stress case also passed at 320×568, 390×844, 568×320 and 844×390, with no tested overlap or offscreen HUD element.
- A second 60-second 320×568 run reached 1,821 meters with three hearts and all regions, but recorded power/cue overlap. That observation led to compact portrait power cards and a short-landscape power row; it is not counted as a clean layout pass. A five-indicator UI-only stress case (including the longest zipline cue and gate directions) reproduced overflow and overlap at 568×320 before the fix. It does not simulate earning those powers.
- A fresh, naturally ended 320×568 run verified the repaired results dialog: primary action at y=411–467 and Back to camp at y=475–519, both hit-testable while long content scrolls. The second mission paid its 350-point reward; already-claimed prizes were not awarded again.
- A 60-second real-time run at 844×390 with decorative motion enabled reached 1,821 meters, observed all three named regions, selected Challenge and caught/completed the zipline. It retained three hearts; 3,602 frames, mean 16.66 ms and p95 16.70 ms. Runtime bounds checks found no overlap among power chips, action cue, mission panel and controls in the states encountered. This does not prove every possible power combination or physical-device performance.
- Continuing that run without further movement input ended naturally at 2,311 meters: 6,146 score, 75 bones and two gifts. From a zero-credit profile, the result banked exactly 7,196 credits (score + 250 mission + 800 prize points) and unlocked the royal crown. Buying the explorer outfit, first leap upgrade and Pepper consumed 700 + 500 + 1,500 credits, leaving 4,496. Reload preserved ownership, selected Pepper/crown, upgrade level and balance. The equipped spotted puppy and crown were visually inspected.
- Long results copy exposed a clipped Back to camp action in landscape. Dialogs now have one scrolling content region and a separate, always-visible action area. Help/clubhouse checks at 568×320, 844×390 and 320×568 verified both actions are within the viewport and receive pointer hits; long lists can be scrolled without moving those actions offscreen. Browser automation explicitly centered deeply nested shop items before clicking and verified the saved outcome, rather than treating a click acknowledgment as purchase evidence.
- The local fixture now records visited regions and HUD overlaps, and `dialogLayoutCheck()` rejects clipped/covered action buttons.
# Puppy pose transitions

- Corrected airborne leg pairing to match the renderer's left-front, left-rear, right-front, right-rear ordering. Running, jumping, sliding and zipline targets now blend with time-based exponential easing; collision physics are unchanged.
- 69 tests pass, including front/rear symmetry, bounded transitions, zero-time stability and equivalent 30/120 Hz transition results.
- Real-renderer phone-sized jump and reduced-motion zipline screenshots inspected. `posePauseCheck()` verified identical leg angles over 60 paused draw calls and continued easing after resume.
# Incomplete collection recovery

- Claimed costume prizes now restore missing outfit entries during save normalization, without replaying points, changing the supplied object, or unlocking unknown/unclaimed prizes. Repeated normalization is idempotent; 71 tests pass.
- An isolated browser loaded a deliberately incomplete test save: 200 credits, claimed crown/party prizes, but only the scarf in its outfit list. The crown was restored as equipped; the party outfit could be equipped. Reload retained both restored outfits and the party selection, with credits still exactly 200. This verifies recovery, not natural prize earning (covered separately above).
# Keyboard dialog navigation

- Escape now dismisses Help, Upgrades and Clubhouse to their opener buttons. Held/repeating Escape is ignored, preventing repeated pause/resume toggles. Graphics recovery and results behavior are unchanged.
- Browser `keyboardCheck()` verified all three opener-focus returns, ten repeated Escape events while paused, normal resume with trail focus, and ten repeated events while playing. Native browser Shift+Tab from the first available clubhouse selection wrapped to Back to camp; Tab wrapped back to that selection. No browser errors.

# Stronger bends and escalating trail pressure

- Opening and later centerline bends are stronger while remaining continuous and tangent-aligned at the puppy. Ordinary late rows block two lanes and change the escape lane; spacing tightens gradually without reducing full-width action spacing. Scenic retains its gentler generation.
- All 73 tests pass, including opening-bend visibility, smooth route transitions, 100 seeded late-row checks and existing input-driven survival, jump, slide and zipline coverage.
- Accelerated browser simulation: three 4,500-meter runs, 54 rendered checkpoints, minimum three hearts and nine completed ziplines. Peaks: 11 geometries, two textures, 117 active-plus-pooled objects and 164 draw calls. This is not real-time frame profiling.
- Release `3921be8` passed CI and Pages deployment. Live HTML loaded the matching `15fe054f6c505a4f` game revision; Play, jump input and Escape reached a paused run at 17 meters without browser errors.
- Updated 60-second, 390×844 prompt-driven run with reduced motion: 1,886 meters, three hearts, all three regions, Challenge selected, zipline caught and landed, no detected HUD overlap. 3,602 frames, mean 16.66 ms and p95 16.80 ms. Desktop-browser viewport emulation, not physical-phone validation.
- Updated 120-second, 320×568 prompt-driven run with full decorative animation enabled (`aria-pressed=false` on Less motion): 4,046 meters, three hearts, all three regions, Challenge selected, zipline caught and landed, no detected HUD overlap or browser errors. 7,202 frames, mean 16.66 ms and p95 16.70 ms. This is a real-time desktop-browser sample, not a worst-case guarantee across devices.

# Full wardrobe rendering matrix

- Inspected all six outfits on each of Biscuit, Mochi, Pepper and Luna in four 1080×800 browser galleries, using the production renderer. Before each target appearance, the same renderer drew a contrasting puppy in the party outfit, exercising palette, ear, spot and accessory reset paths.
- All 24 combinations showed the expected puppy identity and distinct scarf, explorer hat, cape, raincoat, crown or party hat, with no visible accessory carryover. Each gallery retained five geometries and two textures; final draw calls ranged from 33 to 38.
- `wardrobePreview()` is a local-only visual fixture, not evidence of natural earning or purchase flows. Those have separate checks above. The production build excludes this fixture.

# Prize cabinet progress

- Cabinet rewards now show labeled progress meters and exact counts. Best-run bones are tracked separately from lifetime bones; banked gifts and best distance use their existing records. Already-claimed prizes always display complete, including older saves without the new bone record.
- All 75 tests pass. New tests distinguish lifetime totals from single-run records, cap progress, preserve earned state and confirm that display calculation does not grant prizes.
- At 320×568 the cabinet's bottom meters and both main actions were visually inspected. A separate injected browser save with 900 lifetime bones, 23 best-run bones, 450 meters and two gifts reloaded to meter values 300/300, 23/50, 450/1000 and 2/3. This is save-loading/display evidence, not a natural earning test.

# Unified run banking

- Completion now uses one guarded `bankRun()` operation for score, lifetime bones, best-run records, mission points, gifts and prizes. A repeated completion returns the same receipt without paying any component again; unfinished runs cannot bank.
- All 77 tests pass. Integrated reward tests cover ten repeated completions, an unfinished run and a second completed run that earns another mission and the cumulative-gift outfit without reducing previous records.
- A fresh browser run ended naturally at 212 meters: 662 score, eight bones, no mission or prize. Results announced a personal best; saved credits were exactly 662 and both lifetime and best-run bones were eight. Reload retained those values and returned to camp without browser errors.

# Pickup matrix and combined power lifecycle

- Inspected real-renderer galleries of all eight pickups (bone, magnet, shield, gem, double points, heart, present, tennis ball). The double-points coin initially resembled Pause; its two bars were replaced with a legible geometric ×2 stamp using shared box geometry and no extra textures.
- `powerPreview()` places test pickups into the real simulation rather than setting active timers. Normal and reduced-motion runs both show three bones pulling at 0.1 seconds with zero credited, three collected at 0.4 seconds, Zoomies expired at 6.5 seconds, and magnet/double expired at 10.5 seconds. Shield remains one throughout. Assertions reject lifecycle deviations.
- Four-stage screenshots in both motion modes were inspected for attraction rings, collected-bone disappearance and effect expiry. The local fixture is excluded from release artifacts. These are sampled simulation/render checks, not real-time frame pacing or natural random-spawn frequency evidence.

# Published integrated acceptance — 279bba6

- CI and GitHub Pages succeeded for `279bba616925ee7e72c4560b2ca00808a1f1d14b`. Live runner loaded `game.js?v=f42114f7da643b2d`, matching the local build. A fresh isolated browser profile had no runner save; no currency or simulation state was injected.
- At 390×844 with full decorative motion enabled, the published game ran for 60 seconds under visible-prompt keyboard input. It reached 1,886 meters, retained three hearts, visited all three regions, selected Challenge and caught/completed a zipline. 3,600 animation frames: mean 16.67 ms, p95 16.80 ms; no detected HUD overlap.
- Resuming the same run without movement input ended naturally at 2,405 meters: 6,780 score, 59 bones, two gifts and one completed zipline. Banking produced exactly 7,830 credits (6,780 score + 250 mission + 800 prize points), three claimed prizes and the crown. Best-run bones were 59.
- Real clubhouse/shop button clicks purchased Luna for 2,500, the raincoat for 1,800 and the first magnet upgrade for 500, leaving exactly 3,030 credits. Deeply nested buttons were scrolled into view before clicking and saved outcomes checked after each purchase. Reload preserved the balance, records, gifts, prizes, Luna/raincoat selection and magnet level one. The equipped puppy was visually inspected; no browser errors.
- The published root Puppy Quest separately started with its Play button, accepted direction/jump input, paused with Escape and resumed with Keep exploring. The menu/pause panels were hidden after resume, the timer read three seconds and the world was The backyard. Pause screenshot inspected; no browser errors. This is a preservation smoke check, not a new five-course browser completion claim (simulation coverage remains separate).

# Audio output and mute resource lifecycle

- An independent browser audit captured the actual enabled game audio through MediaRecorder and decoded it: 48 kHz stereo, 2,523 nonzero frames, peak 0.034679 and RMS 0.009457. This proves an output signal, not human sound-quality approval or physical-speaker audibility. Offline checks separately cover all five named cues and non-clipping output.
- The audit found that mute stopped notes but left the AudioContext running. `stopSound()` now immediately disconnects each active oscillator/gain exactly once, then suspends the engine, including when all notes have already ended.
- The rebuilt browser app passed enable → running, idle mute → suspended, re-enable → running, active-yip mute with both voices stopped/disconnected, and rapid off/on/off/on ending running with sound enabled. Preferences and ARIA matched; no browser errors or duplicate cleanup.
- Full local build/artifact/lint gates and all 77 tests pass after the fix; dependency audit reports zero vulnerabilities. Human listening and physical-device audio remain explicitly unverified limitations rather than inferred results.
- Final code release `52b02a1510c745764fdd5aea5e56f4f3a2169e6e` passed CI 34171529902 and Pages 34171529958. Production loaded script `a7934184b5900004` and stylesheet `1b29b96179d0ec91`, both matching the local build. An isolated live browser observed the actual lazily created AudioContext: enabled/running → muted/suspended → enabled/running, with matching pressed state and saved `sound:true`. No browser errors. The observer wrapped only the context constructor; it did not replace audio methods or game state.

## September 11 follow-up: current build in isolated iPhone Safari

Checked gameplay build `05fde6b` on the dedicated **Biscuit Dash QA — Sep 10**
simulator (`A684C311-2581-42FF-8F83-9E38506B11B5`, iOS 27), using the simulator
browser mirror and native on-screen touches. Other projects' simulators were
not selected or controlled. Safari restored an older page; its visible reload
control loaded the current local `http://127.0.0.1:3000/runner/` build, confirmed
by the new contextual mission help, three-goal HUD and clean-move results text.

- Portrait help expands and scrolls; the Run button stays reachable.
- The five gameplay buttons remain above Safari's bottom toolbar.
- Start, lane swipe, pause and resume responded; the resumed dog was in the
  right lane. Exact resume timing remains covered by the separate browser and
  simulation tests, not inferred from the mirrored screenshots.
- The run naturally ended at 270 m with 420 points and six bones. Results,
  expanded details, the clean-streak breakdown and Retry button remained usable.
- Screenshots captured the actual simulator frame for menu, help, gameplay,
  pause, results and expanded results. This was not a no-damage playthrough,
  physical-device check, frame-rate measurement or jump-timing acceptance.
- Mirror keyboard forwarding was unreliable and a stream interruption recovered
  on the same running helper. These were tooling limitations, not game failures.

### September 11: runner offline reopening

- `npm run check` passes all 183 tests, including full-build integrity, failed
  download/quota preservation, scoped request handling and generated-manifest
  hashes matching the release files.
- Browser QA used isolated `127.0.0.1:3012`, not the user's production save.
  Installation and activation completed with four cached files. At 390 × 844,
  the expanded offline help remained readable and the Run button reachable.
- A stricter server-stopped reload initially exposed redirected HTML responses
  being unsuitable for cached navigation. Normalizing verified response bodies
  fixed this. With the local server completely stopped, the final worker
  reopened the runner, rendered the game, accepted Start and Jump input, advanced
  the distance HUD, and paused using Escape. No network was available to that
  local origin. The initial network-emulation-only reload is not counted as
  independent offline evidence.
- Worker changes never request a page reload. Failed caching does not block
  online play or touch local saved progress. Only known runner files are cached;
  the root 2D game and arbitrary requests are excluded.
- This is desktop browser offline coverage, not an iOS airplane-mode or native
  installation test. Browser storage eviction can remove cached files; the help
  explains this limitation. No cloud synchronization is implied.

### September 11: evidence-based retry coaching

- `npm run check`: 187 tests pass. Actual simulated collisions prove late-jump,
  incorrect slide and overhead-jump diagnoses; controlled state cases cover
  descent, recent landing, aerial dive and expired-slide evidence. A naturally
  expired slide is distinguished from a slide cancelled by jumping. Fresh runs
  reset evidence; generic lessons remain when no specific diagnosis is proven.
- In the isolated local browser, an unassisted run naturally ended at 200 m,
  300 points and four bones, displaying the existing generic collision lesson.
  All eight specific coaching strings were then previewed in that real results
  layout at 320 × 568. Retry remained within the viewport for each; a screenshot
  confirmed the final message's readability and accessible primary action.
- The eight-message layout preview is synthetic UI coverage, not eight trusted
  playthroughs. Collision classification is verified separately by simulation.
  No jump, slide, speed or collision threshold was changed; slide-expiry
  timestamps record existing motion without extending or shortening it.

### September 11: reversible upgrade tuning

- All 190 checks pass. Tests buy and refund all three levels in every track,
  proving exact balance restoration and unchanged unrelated profile data.
  Invalid/unowned refunds fail without mutation. Removing three slide levels
  restores the base .58-second slide for a new run; an existing run keeps its
  snapshotted upgrades.
- In an isolated 320 × 568 browser profile, real button clicks refunded slide
  levels 3 → 2 → 1 → 0 for 1,800 + 1,000 + 500 points. Reloading preserved the
  3,300-point balance and level zero. The fixture's 123-point record and seven
  lifetime bones were unchanged. Focus followed the refund button and moved to
  the corresponding purchase button when the last level was removed.
- A screenshot confirmed readable buttons and an unobstructed Run action while
  scrolled to Silky slides. Test profile and offline cache were removed afterward;
  production saves were not modified. This is browser portrait evidence, not a
  new native-phone performance measurement.

### September 11: focused keyboard controls

- Fixed Space being intercepted as Jump when a gameplay button such as Slide
  had focus. Native Space activation now invokes that button's named action;
  Space on the focused trail retains its jump shortcut. Modified browser
  shortcuts, composition and already-handled events no longer trigger gameplay.
- All 192 tests pass, including the actual keyboard-handler block for focused
  controls, normal shortcuts and modifier combinations. Existing pointer tests
  continue to cover one action per swipe, cancelled ownership, hold rejection
  and native keyboard clicks without duplicate pointer clicks.
- Real browser Space input on focused Slide produced the rendered `slide`
  posture. After resuming with trail focus, Space produced `jump`. Escape
  paused both checks. No synthetic movement was injected for these observations.

### September 12: optional unscored practice trail

- `npm run check`: 195 tests pass. Tests exercise a full no-input practice and
  successful jump/slide/steer rehearsals at all four movement upgrade levels.
  Practice ends at 130 m, never loses its three hearts, and cannot enter the
  reward transaction. Starting adventure afterward clears practice state.
- Browser QA at 390 × 844 inspected the actual trail and single edge prompt.
  A real-time keyboard run driven only by visible Jump now, Slide now and Steer
  left prompts completed 3/3 moves. An unassisted run completed 0/3 without
  ending early. The local save remained null after practice completion.
- At 320 × 568, the success screen, Run the adventure, Practise again and camp
  actions were readable and reachable. Rehearsal restarted at zero progress;
  pause used unscored copy. Run the adventure restored normal points, three
  hearts, region name and the first challenge, then paused normally.
- These are actual browser input and rendering checks, not physical-device
  performance or evidence that three practice moves teach every advanced feature.

### September 12: quiet personal-best chase

- All 198 checks pass. The existing score line shows distance in points to a
  reachable personal best, requires one additional point when tied, and marks
  a surpassed record as BEST. First runs and distant records remain ordinary
  score displays. Practice and active route labels retain priority.
- In an isolated 320 × 568 browser run with a 120-point record fixture, normal
  gameplay displayed 115 points to best, then 178 points · BEST after crossing
  the record. Screenshots at both stages showed no added panels or overlap with
  bones, hearts, the dog or controls. The run was paused before banking; the
  feature itself does not mutate saves or award extra points.
