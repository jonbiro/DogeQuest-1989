# Mooncap Grove silhouette pass

Replaced flattened sphere caps with a shared revolved profile: domed crown,
flared rolled rim and recessed underside. A pale underside remains visible above
the stems. Cap spots follow the raised crown. Placement, stem heights and all
collision geometry are unchanged.

The new geometry has 189 vertices, versus 315 in each former sphere cap. One
shared scenery batch is added, so the explicit geometry catalog budget increases
from 33 to 34; texture, draw-call and object limits remain unchanged.

Verification:

- 376 tests passed, including profile, underside normals and finite geometry.
- Portrait browser preview at 390 × 844 and 1205 m reviewed: caps are recognizable
  beside the trail, with no added scenery in the running lanes.
- Four 6 km automated runs rendered 96 checkpoints, 36 turns and 16 ziplines.
  Peak resources: 34 geometries, 8 textures, 242 draw calls and 105 objects;
  repeated laps remained stable. No hits, shield saves or missed turns.
- No browser console errors. Preview tab closed and viewport override reset.

This is browser-emulated portrait coverage, not a physical-phone performance
benchmark or proof that the full comparative product goal is achieved.
