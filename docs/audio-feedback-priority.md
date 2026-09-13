# Busy-moment sound feedback

Pickup/reward sounds previously could occupy every one of the twelve available
voices, causing a following jump, slide or damage sound to be dropped. Ordinary
cues now stop scheduling at eight occupied voices. Jump, slide, hit and Fetch
ready can use the remaining capacity, without exceeding twelve total voices or
raising the existing gain ceiling. Existing voices are not abruptly cut off.

The hit event uses a named cue with the same pitch, duration and waveform as its
previous numeric tone; naming it allows priority classification without treating
unrelated numeric pickup tones as urgent. Sound remains optional and mute/pause
still stop and disconnect every voice.

The sound regression saturates rewards, then schedules jump, slide and hit,
checks the twelve-voice ceiling under further urgent/ordinary bursts, and checks
cleanup and reuse. This proves scheduling and resource bounds, not perceived
clarity on phone speakers. Simultaneous urgent sounds can still exhaust the hard
ceiling; this is reserved capacity, not a guarantee that every sound always plays.
