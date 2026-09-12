import test from 'node:test';
import assert from 'node:assert/strict';
import {createPalmFrondGeometry} from '../src/runner/palm-frond.js';

test('palm fronds taper and droop with bounded geometry and a correctly lit underside',()=>{
  const geometry=createPalmFrondGeometry(),p=geometry.attributes.position,n=geometry.attributes.normal;
  assert.equal(p.count,54);assert.equal(geometry.index.count,192);
  assert.equal(geometry.attributes.uv.count,p.count);
  assert.ok(Math.abs(p.getZ(0))<Math.abs(p.getZ(12))*.1);
  assert.ok(Math.abs(p.getZ(24))<Math.abs(p.getZ(12))*.1);
  assert.ok(p.getY(25)<p.getY(1)-.5,'tips droop below the attachment');
  for(let i=0;i<27;i++){
    assert.ok(n.getY(i)>0,'top faces catch overhead light');
    assert.ok(n.getY(i+27)<0,'undersides face down');
    for(const value of [p.getX(i),p.getY(i),p.getZ(i)])assert.ok(Number.isFinite(value));
  }
});
