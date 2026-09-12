# Current-build portrait Safari spot check

Baseline: 77e5939. Dedicated iOS 27 simulator:
`A684C311-2581-42FF-8F83-9E38506B11B5` (Biscuit Dash QA — Sep 10).
No other simulator was selected, stopped or modified.

The simulator-browser skill's pinned serve-sim workflow produced live frames.
Device Hub automation timed out and hardware text forwarding did not work;
the helper reported no visible Device Hub simulator window and legacy HID fallback.
Safari's on-screen keyboard was usable through mirrored pointer taps.

The existing `127.0.0.1:3000/runner/` profile displayed 1,360 points and an older
loaded page. It was left untouched. Testing used `localhost:3012/runner/`, initially
showing zero points and the current six-landscape copy, button styling and models.
The local directory URL without its trailing slash loaded the HTML without its
relative assets; using `/runner/` loaded the current game correctly. This finding
is specific to the local preview; no production redirect claim is made here.

## Observed results

- Actual mirrored touch started the run; a fresh frame showed the current 3D
  trail, HUD, bone counter, hearts and all five controls above Safari's bottom bar.
- Pause opened the expected overlay. A resume touch returned to active gameplay
  at 171 m, with the puppy visibly airborne after the preceding swipe attempt.
- The run was not continuously piloted. It lost hearts during inspection and
  ended at approximately 200 m; camp then showed 200 test points on the isolated
  origin. This is not a successful survival or difficulty test.
- Slide input was attempted but no unambiguous slide frame was captured; do not
  count it as verified. No measured Safari FPS, long-run resource, later-landscape,
  power-combination or physical-touchscreen acceptance follows from this spot check.

Browser screenshots captured real simulator frames at camp, running, paused and
resumed states. The mirror was disconnected using the exact simulator UDID; its
terminal exited successfully and a process inventory showed no remaining
serve-sim helper. The dedicated simulator itself remains booted at camp.

## Remaining native-browser checks

Verify clear jump/slide
frames and the new regional sequences with a more reliable input/inspection path,
then measure a sustained run. Keep the old-origin save protected and distinguish
the new 200-point QA profile from user progress.

## Entry-path follow-up

The runner now canonicalizes a `/runner` pathname to `/runner/` before relative
assets load. The small inline redirect has an exact CSP hash, not an unrestricted
inline-script permission. Origin, shared-trail query parameters and fragments are
preserved; canonical paths do not redirect.

All 375 tests, build, distribution validation and lint passed. A fresh in-app
browser tab opened the slashless local URL with trail `3-1j9`, target `200` and
`#help`; it reached the slash-terminated URL, rendered the shared-trail start
button and 200-point target, and recorded no console errors. This follow-up is a
desktop browser check, not a repeated native Safari test.
