import test from 'node:test';
import assert from 'node:assert/strict';
import {contactShadow} from '../src/runner/contact-shadow.js';

test('contact shadows retain their height response on solid trail',()=>{
  for(const y of [0,1,2,3.6,6]) {
    const result=contactShadow(y,100,[]);
    assert.equal(result.scale,Math.max(.45,1-y*.12));
    assert.equal(result.opacity,.46/(1+y*.3));
  }
});
test('a shadow fades at both gap lips and never floats over the missing slab',()=>{
  const gaps=[{at:100}];
  for(const offset of [-2.5,-1,0,1,2.5])assert.equal(contactShadow(1,100+offset,gaps).opacity,0);
  let previous=0;
  for(let offset=2.5;offset<=4;offset+=.025) {
    const value=contactShadow(1,100+offset,gaps).opacity;
    assert.ok(value>=previous-1e-12);
    assert.ok(value-previous<.015,'no opacity step at either boundary');
    assert.equal(value,contactShadow(1,100-offset,gaps).opacity);
    previous=value;
  }
  assert.deepEqual(contactShadow(1,96,gaps),contactShadow(1,96,[]));
  assert.equal(contactShadow(1,200,[{at:100},{at:200}]).opacity,0);
});
