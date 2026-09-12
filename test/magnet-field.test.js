import test from 'node:test';
import assert from 'node:assert/strict';
import {magnetPulse} from '../src/runner/magnet-field.js';

test('magnet pulses draw inward with invisible wraparound',()=>{
  assert.ok(magnetPulse(.2,0).scale>magnetPulse(.8,0).scale);
  assert.equal(magnetPulse(0,0).opacity,0);
  assert.ok(magnetPulse(1/.7-1e-6,0).opacity<.00001);
  for(let t=0;t<10;t+=.01)for(let i=0;i<3;i++){
    const pulse=magnetPulse(t,i);
    assert.ok(pulse.scale>=1&&pulse.scale<=2.8);
    assert.ok(pulse.opacity>=0&&pulse.opacity<=.65);
  }
});
test('reduced motion holds all three rings still and visible',()=>{
  for(let i=0;i<3;i++){
    assert.deepEqual(magnetPulse(0,i,true),magnetPulse(50,i,true));
    assert.equal(magnetPulse(0,i,true).opacity,.32);
  }
});
