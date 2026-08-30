import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ParticleSystem } from '../src/particles/ParticleSystem.js';
import { Vector } from '../src/utils/Vector.js';
import { withRandom } from '../scripts/level-fixtures.js';

test('ParticleSystem enforces its cap and compacts expired particles in place', () => {
  const particles = new ParticleSystem();
  particles.maxParticles = 3;

  withRandom([0.5], () => {
    particles.emit(new Vector(0, 0), {
      count: 8,
      speed: 2,
      lifetime: 0.1,
      spread: 0
    });
  });

  assert.equal(particles.particles.length, 3);
  const backingArray = particles.particles;
  particles.update(0.05);
  assert.equal(particles.particles, backingArray);
  assert.equal(particles.particles.length, 3);
  assert.ok(particles.particles.every((particle) => particle.pos.x > 0));

  particles.update(0.06);
  assert.equal(particles.particles, backingArray);
  assert.equal(particles.particles.length, 0);
});
