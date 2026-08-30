import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Vector } from '../src/utils/Vector.js';

test('Vector.plus returns the component-wise sum without mutating inputs', () => {
  const first = new Vector(2.5, -4);
  const second = new Vector(-1.5, 9);

  assert.deepStrictEqual(first.plus(second), new Vector(1, 5));
  assert.deepStrictEqual(first, new Vector(2.5, -4));
  assert.deepStrictEqual(second, new Vector(-1.5, 9));
});

test('Vector.times scales both components', () => {
  const vector = new Vector(-3, 4);

  assert.deepStrictEqual(vector.times(2.5), new Vector(-7.5, 10));
  const zero = vector.times(0);
  assert.ok(zero.x === 0);
  assert.ok(zero.y === 0);
  assert.deepStrictEqual(vector, new Vector(-3, 4));
});
