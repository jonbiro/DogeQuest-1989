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

## Bamboo foliage follow-up

Bamboo now reuses the leaf mesh as two opposed, three-leaf fans per stem.
The narrow silhouettes differ from the broad Oasis crowns. Attachment transforms
are tested against the stem, and six 54-vertex leaves use fewer vertices than
the previous two 315-vertex foliage spheres. No resource budget was increased.
All 373 tests and the complete check passed. The 390 × 844 Bamboo preview keeps
the play corridor clear. The 24 km renderer regression retained exactly the
same resource peaks, stable repeat laps, no hits/missed turns and no browser errors.
