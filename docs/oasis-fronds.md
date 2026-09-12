# Oasis palm silhouettes

Palm crowns now use eight tapered, curved fronds instead of flattened foliage
spheres. A raised central rib and separate underside give them shape and correct
lighting from either side. Crown positions follow the tilted trunk endpoints.
The nearby playable corridor and landscape placement remain unchanged.

All palms share one 54-vertex, 64-triangle geometry in the existing scenery
instancing pipeline. This intentionally expands the fixed geometry catalog from
32 to 33; texture, draw-call and object limits are unchanged. The frond geometry
test checks taper, droop, UV count, vertex/index budget and opposite-side normals.

All 372 tests, build, lint and distribution checks passed. A 390 × 844 Oasis
preview showed the new silhouettes and clear bone trail. The four-run, 24 km
renderer check completed 36 turns and 16 ziplines with no hits or misses and
stable repeat-lap resources. Peaks: 33 geometries, eight textures, 240 draw calls,
105 objects. No browser errors. This does not establish physical-phone FPS.
