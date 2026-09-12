# Puppy adventure goal

## Primary mobile orientation

Design and verify portrait first: assume most phone sessions are vertical.
Prioritize swipe-anywhere, one-handed play, reachable fallback controls and a
clear view of the puppy and upcoming obstacles. Landscape remains supported,
but must not determine compromises in the main portrait experience. Check
compact 320px portrait as well as taller phones before landscape regressions.

## Research-led goal

Build a richer, skill-based adventure inspired by the Temple Run 2 research,
without copying its branding, ads, excess currencies, or punitive daily demands.
Keep Puppy Quest available, preserve saved progress, and publish verified playable
increments. The current expanded-scope audit is at the top of
`COMPLETION-AUDIT.md`; the historical evidence below describes the earlier scope.

Priority order:

1. Deliberate, readable corners and genuine climbs and descents. Preserve the
   quick jump/slide timing and keep turn approaches free of conflicting hazards.
2. Region-specific traversal and authored pressure/recovery stretches that make
   the environments play differently, not merely look different.
3. One player-activated charged ability with clear readiness and meaningful timing.
4. Dog and region mastery, collection goals, and useful permanent progression.
5. Clear post-run learning and one-tap retry; personal-best ghosts are optional
   polish after the core loop is verified.

Each slice must pass relevant simulation tests, real-renderer and input-driven
browser checks, mobile-size layout/performance checks, and publication checks.
No physical-phone performance claim follows from desktop browser emulation.

## Previous scope and historical completion

The expanded goal now includes implemented regional obstacle courses and their
pressure/recovery pacing: jungle jump/duck timing, canyon gap crossings, and glade
lane slaloms, with clean-course bonuses. Fetch adds a player-controlled charged
magnet burst, earned from manual bone collection, clean clears and correct turns.
Persistent dog/region mastery now banks four dogs' bond milestones and three
regions' bronze/silver/gold stamps, with 21 permanent collectibles and one-time
upgrade-point rewards. The end-to-end expanded-objective audit now records the
requirement evidence and final release gate in `COMPLETION-AUDIT.md`.

The earlier requested browser-game scope was delivered at baseline `52b02a1`.

## Required product areas and completion evidence

See `COMPLETION-AUDIT.md` for the current requirement-by-requirement assessment,
the evidence behind each area, closure of the completion checks and explicit validation limits.

- Expressive, selectable puppy characters: distinct 3D appearance, selection and persistence verified in browser.
- Costumes: visible equipped accessories, earn/unlock/equip flow, ownership and reload tests.
- Puppy-themed powers: distinct models and useful mechanics, durations and interactions verified in simulation and browser.
- Prizes and progression: earned rewards, achievements, collection goals, understandable economy, exactly-once grants and migration tests.
- Varied adventure: multiple environments, meaningful route decisions and traversal set pieces beyond a winding corridor; fair challenge verified at speed.
- Full play loop: onboarding, responsive touch/keyboard controls, pause/resume, retry, results, records, settings, and recovery from unavailable graphics/storage.
- Polish and reliability: consistent art/audio/feedback, mobile and desktop QA, frame pacing, bounded runtime resources, accessible menus and reduced decorative motion.
- Release: CI, artifact checks, GitHub Pages deployment, and live gameplay verification. Do not claim physical-phone validation from a resized desktop browser.

## Delivered implementation

How to Play now includes an expandable guide for the current mission, with its
target, reward and concrete scoring rules. It explains Fetch versus pickup
magnets, zipline height and timing, clean-course beats and streak resets.
Expanding the guide reveals it within the scrollable help panel while the play
button stays reachable. Verified by actual clicks and screenshots at 320 × 568;
all 163 checks pass. No in-run HUD elements were added.

After the first six introductory missions, eight rotating adventure goals now
cover clean turns, player-activated Fetch bursts, completed ziplines, clean
regional courses, bone streaks, distance, bone collecting and obstacle clears.
Targets and reward growth are capped so experienced players still get finite,
useful goals instead of ever-longer survival requirements. Existing saved mission
counts continue directly into the rotation; no reset or new currency is needed.
The 162-test check covers rotation, course aggregation, bounded late targets,
invalid indices and exactly-once rewards. New mission UI uses the existing compact
goal slot; no additional in-run banners were added.

Results now offer “Retry this trail”: a fresh run using the previous seed so
players can learn an obstacle sequence instead of receiving a different layout
after every mistake. Camp and help starts still generate fresh adventures.
Route choices can still change subsequent obstacles. A regression test executes
the real start handler, checks reset state and deterministic simulation, and
checks fresh camp/help seeds. All 160 checks pass; a natural browser run and
actual retry were verified at 320 × 568, including readable results and restored
three-heart play. This is desktop portrait coverage, not a physical-phone test.

Final acceptance combines the full four-puppy/six-outfit matrix, eight-pickup and overlapping-power checks, input-driven challenge/traversal tests, compact/mobile-sized UI checks, recovery tests and published play → rewards → purchases → reload. All 77 tests, lint, build/artifact checks and dependency audit pass. Final CI/Pages succeeded; live script/CSS hashes match the build, and the final audio-only repair passed live mute/resume checks. Physical-phone, exhaustive hardware and human-listening validation are not claimed.

The full four-puppy × six-outfit rendering matrix is visually checked, including shared-renderer resets between contrasting puppies. Stronger opening and later bends plus progressively denser lane-switching rows address the request for a less straight, less easy trail. These features passed their unit, long-run and published browser checks; the final comprehensive audit is recorded separately.

An integrated 60-second landscape browser run now verifies all three regions, the zipline and stable frame pacing. Its naturally completed run banked points, gifts and prizes; actual purchases and reload checks verified Pepper, an outfit, the crown and a jump upgrade. This pass found and repaired clipped dialog actions after long results: content now scrolls independently while Run/Back to camp remain visible. The verification record specifies the tested viewports and limits.

Sky Paws ziplines add a distinct aerial traversal mode: jump into the turquoise catch bar, swing between lanes for 18 airborne bones and a gift, and finish the 140-meter ride for 250 points. The first starts at 650 meters and repeats every 1,400 meters between difficulty gates. A missed catch leaves a safe ground route; landing has a clear recovery stretch. Airborne prizes require the ride, and magnets work at the correct height. The camera rises smoothly, the puppy holds a tethered bar, and decorative ruins are cleared from the cable route.

Wooden river crossings replace the stone trail from 180–280 meters of each 900-meter cycle. Planks and rope rails follow the same curved route; nearby scenery gives way to water, then returns on the far bank. They use the existing instanced batches and preserve obstacle physics. Bridges provide environmental variety; the zipline supplies the distinct traversal mechanic.

Authored full-width jump/duck sequences interrupt random rows after 600 meters, alternating log–gate–log and gate–log–gate with a gift finish. The 48-meter beat spacing supports top-speed base and upgraded movement; Scenic sections and decision-gate approaches are excluded. These supply authored obstacle rhythm alongside the separate zipline traversal.

The clubhouse, four puppies, six outfits, one-time prizes, and gift banking are published. Purchases, persistence and mobile-sized rendering were checked in browser; collection rules have regression tests.

Zoomies adds a tennis-ball pickup, six-second speed burst, obstacle-smash rewards, a visible speed trail, and protected deceleration. Automated tests cover speed ramps, every hazard, exactly-once rewards, shield preservation, expiry and power combinations. A local-only visual fixture exercises the real renderer with normal and reduced motion; it is excluded from the production build.

Three visual regions cycle every 450 meters: Whispering Jungle, Biscuit Canyon (rock stacks and cacti), and Moonpaw Glade (crystal clusters). Track sections show their destination region ahead; atmosphere blends over 65 meters. Region boundaries have unit tests, each region was visually inspected at phone size, and uninterrupted local and published browser runs visited all three.

Broken trail sections now require full-width jumps. Generation aligns them with actual removed paving tiles; striped edges and a dark opening identify the gap. Tests cover jump timing at 22 and 36 m/s, missed-jump damage, shield recovery, automatic Zoomies jumps and generation alignment. The real-renderer phone-sized fixture was visually checked and revised for clearer contrast.

The puppy models now have rounded heads, bodies, noses and paws, expressive eyes and tongues. Cosmetic pose logic adds blinking, idle breathing, ear bounce, cape flutter and distinct airborne/slide leg poses without changing physics. Pose bounds and reduced-motion behavior have regression tests; the updated face was inspected in the browser.

Trail-choice gates now offer Scenic (single-obstacle rows) and Challenge (more full-width action rows, 60-point clean clears) for 220 meters. The first gate is at 350 meters and repeats every 700 meters; center defaults to Scenic. Generation pauses at an obstacle-free approach and leaves 40 meters of reaction space after selection. These are route-difficulty gates along the winding trail, not a visually branching fork. Unit tests cover selection, generation and rewards; both choices passed the input-driven long-run renderer check, and gate models were checked at phone size.

Puppy-style synthesized greeting, jump/Zoomies sweeps, reward chimes and a finish cue now replace several generic beeps. Sound remains opt-in, overlapping voices are capped and mute stops pending notes. Browser offline rendering verified finite, non-clipping output for all five cues; physical-speaker listening is not yet verified.

Runner script and bundled stylesheet references now carry content hashes, verified during the build, so page reloads fetch matched assets after a release.

The aerial zipline supplies a traversal mechanic beyond running, jumping and sliding. Final-state gameplay/performance checks and the requirement-by-requirement completion audit are now recorded in the linked verification documents, with their device and evidence limits preserved.

Recovery now has a dedicated graphics-error screen, safe start guard, keyboard-accessible 2D fallback and reload path. Storage failures display persistent session-only warnings, and unreadable startup saves cannot be overwritten. Actual context loss, injected startup failure and blocked-storage flows were checked in isolated browser sessions; see the verification record.

Compact portrait and short landscape layouts were repaired after screenshot checks. Actual pointer drag, on-screen slide, pause stability and two real-time prompt-driven browser runs were checked. The reusable 1280×800 run reached 558 meters with Challenge selected and three hearts, averaging about 60 fps. See `RUNNER-VERIFICATION.md` for exact scope and remaining evidence gaps.

Sound and reduced-motion preferences persist, with safe old-save defaults. `RUNNER-VERIFICATION.md` records the accelerated 3 × 4,500-meter input-driven simulation and 54 real-renderer checkpoints: no damage, bounded resources and successful renderer reuse across restarts. Separate 60- and 120-second real-time browser checks provide frame-pacing evidence; none imply physical-phone performance.
