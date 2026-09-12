# Six destination horizons

Previously all six areas used the same ridge mesh, with three regional scale
profiles. The shared mountain geometry now includes six absolute morph targets:
the original Sunleaf ridges, smooth Bamboo hills, flat Redrock mesas, broad Oasis
dunes, sharp Crystal peaks and rounded Mooncap hills. Normals blend alongside
positions using the existing 45 m area-color transition. The grounded perimeter
is identical across all profiles; no gameplay placement or collision changed.

All eight distant meshes share the same 273-vertex geometry and morph data. The
renderer uses one additional fixed morph-data texture, so the texture budget is
explicitly nine instead of eight. Geometry, draw-call and object limits are
unchanged. No per-frame geometry allocation is added.

Verification:

- Tests check six distinct finite profiles, upward normals, unchanged perimeter,
  weights summing to one, and continuity at area boundaries through two cycles.
- All six destinations were visually reviewed in a 390 × 844 browser viewport.
  The first Oasis preview exposed dunes below the ground; their profile was
  raised and rechecked before release.
- The 24 km renderer regression completed 96 checkpoints, 36 turns and 16
  ziplines, with no hits, shield saves or missed turns. Peak resources were
  34 geometries, nine textures, 242 draw calls and 105 objects. Repeat laps
  stayed stable; browser console errors were empty.
- Temporary browser tab closed; viewport override reset; final build removes
  the development preview files.

These are browser-emulated portrait and automated regression checks, not a
physical-phone frame-rate benchmark or proof of the overall comparative goal.
