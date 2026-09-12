# Bone silhouette contrast

Bone vertex colors now transition from a dark bronze rim to the existing ivory
face. This replaces the washed-out side color without adding geometry, lights,
glow, draw calls or changing pickup behavior. Both faces use the same treatment.

The material-level rim contrast exceeds 3:1 against all six paving palettes and
their transitions (not a claim about every lit screen pixel). Regression coverage
also checks the ivory face, symmetric coloring and monotonic interpolation.
All 361 tests, build, lint and distribution verification passed. Fresh 390 × 844
browser previews checked five approaching bones on Redrock and Mooncap trails;
the silhouettes remain distinct against warm and cool paving. No browser errors.
These checks do not substitute for physical-phone glare or motion testing.
