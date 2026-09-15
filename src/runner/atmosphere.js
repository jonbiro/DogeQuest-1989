// Small deterministic samples keep the scene lively without allocating a
// particle object for every frame. The renderer reuses one output record for
// the whole instanced batch, which is important on Safari's compact heaps.
export const ATMOSPHERE_PARTICLE_COUNT = 24;

export function sampleAtmosphereParticle(index, distance, time, profile, reducedMotion = false, output = {}) {
  const phase = index * 2.399963 + (profile.phase || 0);
  const side = index % 2 === 0 ? -1 : 1;
  const spread = 5.8 + ((index * 17) % 11) * .34;
  const depth = 8 + ((index * 29) % 48);
  const drift = profile.speed * (.5 + (index % 5) * .12);
  const travel = reducedMotion ? 0 : time * drift;
  const z = -(((depth + distance * .16 + travel) % 56) + 8);
  const sway = reducedMotion ? 0 : Math.sin(time * (.65 + (index % 4) * .08) + phase) * profile.lift;
  const bob = reducedMotion ? 0 : Math.cos(time * (.8 + (index % 3) * .07) + phase) * profile.lift * .7;
  output.x = side * (spread + Math.sin(phase) * .34) + sway;
  output.y = 1.2 + ((index * 13) % 18) * .19 + bob;
  output.z = z;
  output.scale = profile.size * (.72 + ((index * 7) % 6) * .1);
  output.rotation = phase * .4 + (reducedMotion ? 0 : time * (.35 + (index % 3) * .08));
  return output;
}
