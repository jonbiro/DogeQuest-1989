import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LevelGenerator } from '../src/LevelGenerator.js';
import { withRandom } from '../scripts/level-fixtures.js';

const allowedTiles = new Set([' ', '@', 'o', 'x', '!', '=', '|', 'v', '^', 'S', 'P', '+', '*', 'B', '?']);

function assertValidPlan(plan, expectedWidth) {
  assert.equal(plan.length, 20);
  assert.ok(plan.every((row) => row.length === expectedWidth), 'generated rows must be rectangular');
  assert.ok(plan.every((row) => [...row].every((tile) => allowedTiles.has(tile))), 'generated tiles must be known');
  assert.equal(plan[0][0], 'x');
  assert.equal(plan[0][expectedWidth - 1], 'x');
  assert.equal(plan.at(-1)[0], 'x');
  assert.equal(plan.at(-1)[expectedWidth - 1], 'x');
  assert.equal(plan.join('').split('@').length - 1, 1, 'generated plan must have one player start');
}

test('LevelGenerator caps difficulty and emits a valid rectangular plan', () => {
  withRandom([0.125], () => {
    const generator = new LevelGenerator(99);
    assert.equal(generator.difficulty, 10);
    assert.equal(generator.width, 100);
    assert.equal(generator.height, 20);
    assertValidPlan(generator.generate(), generator.width);
  });
});

test('LevelGenerator clamps invalid low difficulty and accepts an injected random source', () => {
  const values = [0.25, 0.5, 0.75];
  let index = 0;
  const generator = new LevelGenerator(Number.NaN, () => values[index++ % values.length]);

  assert.equal(generator.difficulty, 1);
  assertValidPlan(generator.generate(), generator.width);
});

test('LevelGenerator sanitizes non-finite and out-of-range random values', () => {
  const values = [Number.NaN, Number.POSITIVE_INFINITY, -4, 8];
  let index = 0;
  const generator = new LevelGenerator(10, () => values[index++ % values.length]);

  assertValidPlan(generator.generate(), generator.width);
});

test('LevelGenerator output is reproducible for a deterministic random source', () => {
  const first = withRandom([0.02, 0.41, 0.73, 0.91], () => new LevelGenerator(4).generate());
  const second = withRandom([0.02, 0.41, 0.73, 0.91], () => new LevelGenerator(4).generate());

  assert.deepStrictEqual(first, second);
});

test('all documented segment types produce feature descriptors', () => {
  withRandom([0.25], () => {
    const generator = new LevelGenerator(10);
    for (let type = 0; type <= 13; type += 1) {
      const features = generator.createSegment(type);
      assert.ok(features.length > 0, `segment ${type} should contain features`);
      assert.ok(features.every((feature) => {
        return Number.isInteger(feature.x) && Number.isInteger(feature.y) && typeof feature.ch === 'string';
      }));
    }
  });
});
