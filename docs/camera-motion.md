# Route-aware camera motion

The chase camera now uses a small, eased roll to make bends and lane changes
feel connected to the trail. The roll combines the upcoming route tangent with
the puppy's current lateral velocity, then clamps to a narrow range so the
player keeps a stable horizon and the HUD never moves.

The effect is presentation-only: collision coordinates, lane targets and
obstacle timing are unchanged. It is disabled for reduced-motion preferences,
and it eases back to level while paused or on a result sheet. Menu, help and
clubhouse thumbnails explicitly reset the camera roll before rendering.
