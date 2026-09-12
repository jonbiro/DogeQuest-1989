# Bank surface variation

The large terrain banks now have broad procedural tonal patches instead of only
uniform color and shared grain. Patches use each tile's absolute trail station,
so a tile keeps its pattern while approaching the camera and recycling. The
pattern affects terrain banks only, not paving, pickups, hazards or scenery.
Existing area colors, lighting, fog, river cutouts and bank placement remain.

A dedicated terrain batch isolates the material. It adds one geometry and one
draw call, with no additional textures or decorative objects. The explicit
geometry budget is 35; texture, draw-call and object limits remain 9/260/200.

Verification:

- Tests cover station invariance and shader/material construction.
- Actual browser compilation caught GLSL's reserved `patch` identifier; the
  variable was renamed before final validation. A fresh browser tab recorded
  no shader or console errors afterward.
- 390 × 844 portrait previews reviewed at 80, 530, 805 and 1205 m. Variation is
  intentionally quiet; the trail remains the highest-priority surface.
- Four 6 km renderer runs completed 96 checkpoints, 36 turns and 16 ziplines.
  Peak resources: 35 geometries, nine textures, 243 draw calls, 105 objects.
  Repeat laps stable, zero hits, missed turns or shield saves.
- Temporary preview tabs closed and viewport reset. Final build removes the
  development preview files. This does not measure physical-phone frame rate.
