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

The clubhouse, four puppies, six outfits, one-time prizes, and gift banking are published. Purchases, persistence and mobile-sized rendering were checked in browser; collection rules have regression tests.

Zoomies adds a tennis-ball pickup, six-second speed burst, obstacle-smash rewards, a visible speed trail, and protected deceleration. Automated tests cover speed ramps, every hazard, exactly-once rewards, shield preservation, expiry and power combinations. A local-only visual fixture exercises the real renderer with normal and reduced motion; it is excluded from the production build.

Three visual regions now cycle every 450 meters: Whispering Jungle, Biscuit Canyon (rock stacks and cacti), and Moonpaw Glade (crystal clusters). Track sections show their destination region ahead; atmosphere blends over 65 meters. Region boundaries have unit tests and each region was inspected through the local real-renderer fixture at phone size. This does not yet prove a complete uninterrupted browser run through all regions.

Broken trail sections now require full-width jumps. Generation aligns them with actual removed paving tiles; striped edges and a dark opening identify the gap. Tests cover jump timing at 22 and 36 m/s, missed-jump damage, shield recovery, automatic Zoomies jumps and generation alignment. The real-renderer phone-sized fixture was visually checked and revised for clearer contrast.

The puppy models now have rounded heads, bodies, noses and paws, expressive eyes and tongues. Cosmetic pose logic adds blinking, idle breathing, ear bounce, cape flutter and distinct airborne/slide leg poses without changing physics. Pose bounds and reduced-motion behavior have regression tests; the updated face was inspected in the browser.

Still required: meaningful route decisions and more substantial traversal set pieces, richer puppy-themed audio, and comprehensive final-state gameplay and performance QA. Do not mark the overall goal complete from the existing narrower checks.
