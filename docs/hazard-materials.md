# Area-specific obstacle stone

Rock, arch and gate materials now follow the six visual destinations. Natural
timber, special crystal formations, mint clearance marks and dark clearance
bands retain their existing appearance. Geometry and collision dimensions are
unchanged. Pooled objects retain their original material keys and use cached
materials; their world station determines the palette rather than the camera.

Validation: 358 tests, build, distribution verification and lint passed.
390 × 844 browser previews checked Redrock and Mooncap approach readability.
The synthetic four-run, 24 km rendering regression reported no hits or missed
turns, stable repeat laps, and peaks of 238 draw calls, 32 geometries, eight
textures and 107 objects. No browser errors were reported. This is desktop
portrait emulation and resource regression evidence, not a phone FPS benchmark.

## Weathered boulder silhouette

The shared boulder mesh now has clipped, irregular faces rather than a spherical
outline. Deterministic deformation preserves the original local bounds and
vertex count; physics and scale are unchanged. A new geometry regression checks
bounds, determinism, finite unit normals, budget and non-spherical contours.
All 359 tests and the complete check passed. A 390 × 844 canyon preview and the
same 24 km rendering regression passed with unchanged resource peaks and no
browser errors.

The follow-up shading audit found that recomputing normals on the non-indexed
stone introduced hard triangle seams. Coincident normals are now averaged once
at model creation, leaving UV coordinates, positions and topology untouched.
360 tests and the full check passed; a fresh 390 × 844 canyon preview showed
continuous lighting with the chipped outline retained and no browser errors.
