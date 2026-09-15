# Bone silhouette contrast

Bone vertex colors now transition from a dark bronze rim to the existing ivory
face. This replaces the washed-out side color without adding geometry, lights,
glow, draw calls or changing pickup behavior. Both faces use the same treatment.

The material-level rim contrast exceeds 3:1 against all six paving palettes and
their transitions (not a claim about every lit screen pixel). Regression coverage
also checks the ivory face, symmetric coloring and monotonic interpolation.
The nearest six approaching bones also receive a small warm glint from the
existing transient-effect batch. It is distance-faded, phase-shifted, disabled
for reduced motion, and does not add a texture or draw call; it is a wayfinding
cue rather than a permanent outline.
The full check suite, build, lint and distribution verification pass. Fresh 390 × 844
browser previews checked five approaching bones on Redrock and Mooncap trails;
the silhouettes remain distinct against warm and cool paving. No browser errors.
These checks do not substitute for physical-phone glare or motion testing.
