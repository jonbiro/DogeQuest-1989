import test from 'node:test';
import assert from 'node:assert/strict';
import {createMountainGeometry} from '../src/runner/mountain.js';
test('shared mountain ridges are deterministic, finite and small',()=>{
  const a=createMountainGeometry(),b=createMountainGeometry();
  const positions=a.getAttribute('position');
  assert.ok(positions.count<300);
  assert.deepEqual(positions.array,b.getAttribute('position').array);
  for(const value of positions.array)assert.ok(Number.isFinite(value)&&Math.abs(value)<1.5);
  for(const value of a.getAttribute('normal').array)assert.ok(Number.isFinite(value));
  assert.ok(a.boundingSphere.radius<1.5);
  a.dispose();b.dispose();
});
