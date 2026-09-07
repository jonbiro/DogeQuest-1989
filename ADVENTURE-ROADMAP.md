# Puppy adventure goal

Build an original, polished Temple Run 2-style puppy runner. Keep Puppy Quest available, preserve saved progress, and publish verified playable increments. This is a continuing goal, not a claim that the current game is complete.

## Required product areas and completion evidence

- Expressive, selectable puppy characters: distinct 3D appearance, selection and persistence verified in browser.
- Costumes: visible equipped accessories, earn/unlock/equip flow, ownership and reload tests.
- Puppy-themed powers: distinct models and useful mechanics, durations and interactions verified in simulation and browser.
- Prizes and progression: earned rewards, achievements, collection goals, understandable economy, exactly-once grants and migration tests.
- Varied adventure: multiple environments, meaningful route decisions and traversal set pieces beyond a winding corridor; fair challenge verified at speed.
- Full play loop: onboarding, responsive touch/keyboard controls, pause/resume, retry, results, records, settings, and recovery from unavailable graphics/storage.
- Polish and reliability: consistent art/audio/feedback, mobile and desktop QA, frame pacing, bounded runtime resources, accessible menus and reduced decorative motion.
- Release: CI, artifact checks, GitHub Pages deployment, and live gameplay verification. Do not claim physical-phone validation from a resized desktop browser.

## Current iteration

An integrated 60-second landscape browser run now verifies all three regions, the zipline and stable frame pacing. Its naturally completed run banked points, gifts and prizes; actual purchases and reload checks verified Pepper, an outfit, the crown and a jump upgrade. This pass found and repaired clipped dialog actions after long results: content now scrolls independently while Run/Back to camp remain visible. The verification record specifies the tested viewports and limits.

Sky Paws ziplines add a distinct aerial traversal mode: jump into the turquoise catch bar, swing between lanes for 18 airborne bones and a gift, and finish the 140-meter ride for 250 points. The first starts at 650 meters and repeats every 1,400 meters between difficulty gates. A missed catch leaves a safe ground route; landing has a clear recovery stretch. Airborne prizes require the ride, and magnets work at the correct height. The camera rises smoothly, the puppy holds a tethered bar, and decorative ruins are cleared from the cable route.

Wooden river crossings now replace the stone trail from 180–280 meters of each 900-meter cycle. Planks and rope rails follow the same curved route; nearby scenery gives way to water, then returns on the far bank. They use the existing instanced batches and preserve obstacle physics. This is environmental variety, not a new traversal mechanic or completion of the remaining set-piece requirement.

Authored full-width jump/duck sequences now interrupt random rows after 600 meters, alternating log–gate–log and gate–log–gate with a gift finish. The 48-meter beat spacing supports top-speed base and upgraded movement; Scenic sections and decision-gate approaches are excluded. These improve obstacle rhythm, but do not yet fulfill the larger traversal-set-piece requirement.

The clubhouse, four puppies, six outfits, one-time prizes, and gift banking are published. Purchases, persistence and mobile-sized rendering were checked in browser; collection rules have regression tests.

Zoomies adds a tennis-ball pickup, six-second speed burst, obstacle-smash rewards, a visible speed trail, and protected deceleration. Automated tests cover speed ramps, every hazard, exactly-once rewards, shield preservation, expiry and power combinations. A local-only visual fixture exercises the real renderer with normal and reduced motion; it is excluded from the production build.

Three visual regions now cycle every 450 meters: Whispering Jungle, Biscuit Canyon (rock stacks and cacti), and Moonpaw Glade (crystal clusters). Track sections show their destination region ahead; atmosphere blends over 65 meters. Region boundaries have unit tests and each region was inspected through the local real-renderer fixture at phone size. This does not yet prove a complete uninterrupted browser run through all regions.

Broken trail sections now require full-width jumps. Generation aligns them with actual removed paving tiles; striped edges and a dark opening identify the gap. Tests cover jump timing at 22 and 36 m/s, missed-jump damage, shield recovery, automatic Zoomies jumps and generation alignment. The real-renderer phone-sized fixture was visually checked and revised for clearer contrast.

The puppy models now have rounded heads, bodies, noses and paws, expressive eyes and tongues. Cosmetic pose logic adds blinking, idle breathing, ear bounce, cape flutter and distinct airborne/slide leg poses without changing physics. Pose bounds and reduced-motion behavior have regression tests; the updated face was inspected in the browser.

Trail-choice gates now offer Scenic (single-obstacle rows) and Challenge (more full-width action rows, 60-point clean clears) for 220 meters. The first gate is at 350 meters and repeats every 700 meters; center defaults to Scenic. Generation pauses at an obstacle-free approach and leaves 40 meters of reaction space after selection. These are route-difficulty gates along the winding trail, not a visually branching fork. Unit tests cover selection, generation and rewards; both choices passed the input-driven long-run renderer check, and gate models were checked at phone size.

Puppy-style synthesized greeting, jump/Zoomies sweeps, reward chimes and a finish cue now replace several generic beeps. Sound remains opt-in, overlapping voices are capped and mute stops pending notes. Browser offline rendering verified finite, non-clipping output for all five cues; physical-speaker listening is not yet verified.

Runner script and bundled stylesheet references now carry content hashes, verified during the build, so page reloads fetch matched assets after a release.

The aerial zipline now supplies a traversal mechanic beyond running, jumping and sliding. Still required: comprehensive final-state gameplay and performance QA and a requirement-by-requirement completion audit. Do not mark the overall goal complete from the existing narrower checks.

Recovery now has a dedicated graphics-error screen, safe start guard, keyboard-accessible 2D fallback and reload path. Storage failures display persistent session-only warnings, and unreadable startup saves cannot be overwritten. Actual context loss, injected startup failure and blocked-storage flows were checked in isolated browser sessions; see the verification record.

Compact portrait and short landscape layouts were repaired after screenshot checks. Actual pointer drag, on-screen slide, pause stability and two real-time prompt-driven browser runs were checked. The reusable 1280×800 run reached 558 meters with Challenge selected and three hearts, averaging about 60 fps. See `RUNNER-VERIFICATION.md` for exact scope and remaining evidence gaps.

Sound and reduced-motion preferences now persist, with safe old-save defaults. `RUNNER-VERIFICATION.md` records the accelerated 3 × 4,500-meter input-driven simulation and 54 real-renderer checkpoints: no damage, bounded resources and successful renderer reuse across restarts. Physical-phone performance and uninterrupted real-time gameplay are not implied by this result.
