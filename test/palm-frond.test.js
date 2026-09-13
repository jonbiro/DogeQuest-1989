import test from 'node:test';
import assert from 'node:assert/strict';
import {createPalmFrondGeometry,createFeatheredPalmGeometry} from '../src/runner/palm-frond.js';

test('feathered palm crowns use bounded opaque geometry with opposed leaflets',()=>{
  const geometry=createFeatheredPalmGeometry(),p=geometry.attributes.position,n=geometry.attributes.normal;
  assert.equal(p.count,438);
  assert.equal(geometry.index.count,1344);
  assert.equal(geometry.attributes.uv.count,p.count);
  for(let i=0;i<p.count;i++){
    for(const value of [p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)])assert.ok(Number.isFinite(value));
    assert.ok(Math.abs(n.getY(i))>.2,'both sides have a usable surface normal');
  }
  assert.ok(geometry.boundingBox.min.z<-.45&&geometry.boundingBox.max.z>.45);
  assert.ok(geometry.boundingBox.min.x>=-1&&geometry.boundingBox.max.x<=1);
  assert.ok(p.getY(25)<p.getY(1)-.5);
  geometry.dispose();
});

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
