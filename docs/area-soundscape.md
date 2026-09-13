# Area musical accents

Each of the six landscapes now has an original five-note call-and-response
phrase with a distinct register and contour. A quiet triangle reply gives the
melody a little more identity while effects remain much louder. These are still
light synthesized accents, not a full soundtrack or recorded nature ambience.
Gain peaks at 0.006 versus the existing 0.035 effects ceiling; ordinary voice
limits reserve capacity for action sounds.

The scheduler waits 1.25 seconds after entry/resume and at least 4.8 seconds
between phrases. Visible action and route decisions defer new phrases. Practice
does not introduce music. Leaving active play, muting, changing areas or turning
off ambience cancels its scheduled voices without cancelling independent action
sounds. No new audio context is created by the scheduler.

Sound remains opt-in through the existing music-note button. Help's Sound
atmosphere disclosure offers effects-only playback. The ambience preference is
saved locally and preserved by backups; old saves default to accents available
when sound is enabled. The controls add nothing to the active running HUD.

Tests cover six distinct bounded phrases, quiet lead-in, deferred decisions,
pause/resume/new-run/area lifecycle, no catch-up bursts, disabled audio, isolated
voice cancellation, and an effects-only backup round trip. A 320 × 568 browser
preview verified the switch and instructions using an isolated unsaved profile.
Physical-phone speaker balance and subjective musical quality remain unverified.

A browser audition using the production soundscape and Web Audio scheduler
completed six areas/six phrases over 18 seconds and closed its audio context.
The corrected audition page produced no console warnings or errors. This is
browser audio lifecycle evidence, not a claim of phone-speaker listening quality.
