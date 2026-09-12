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
