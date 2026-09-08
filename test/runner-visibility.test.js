import test from 'node:test';
import assert from 'node:assert/strict';
import {objectVisible} from '../src/runner/visibility.js';

test('overhead structures leave the chase-camera corridor only after their collision plane', () => {
  for (const type of ['arch','branch','gate','choice-left','choice-right','zipline-start','zipline-end']) {
    const object = {type,at:100};
    assert.equal(objectVisible(object,99), true);
    assert.equal(objectVisible(object,100.4), true, 'collision remains visible');
    assert.equal(objectVisible(object,101.19), true);
    assert.equal(objectVisible(object,101.21), false, 'passed structure does not cover the camera');
  }
});

test('visibility does not interrupt attracted bones or mutate gameplay objects', () => {
  const bone = {type:'bone',at:90,pull:{elapsed:.1,duration:.4}};
  const before = {...bone,pull:{...bone.pull}};
  assert.equal(objectVisible(bone,100), true);
  assert.deepEqual(bone,before);
  assert.equal(objectVisible({...bone,used:true},100), false);
  assert.equal(objectVisible({type:'gap',at:99},100), true);
});
