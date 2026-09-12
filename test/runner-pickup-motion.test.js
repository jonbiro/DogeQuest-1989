import test from 'node:test';
import assert from 'node:assert/strict';
import {PICKUPS} from '../src/runner/world.js';
import {pickupYaw} from '../src/runner/pickup-motion.js';

test('every collectible stops cosmetic sway in reduced-motion mode',()=>{
  for(const type of PICKUPS)for(const time of [0,.25,1,10,1000]){
    assert.equal(pickupYaw(type,time,true),0,type);
    assert.ok(Math.abs(pickupYaw(type,time,false))<=.25);
  }
});
test('full motion preserves the existing bone and power-up rhythms',()=>{
  assert.equal(pickupYaw('bone',1,false),Math.sin(1.8)*.25);
  for(const type of PICKUPS.filter(type=>type!=='bone'))
    assert.equal(pickupYaw(type,1,false),Math.sin(1.5)*.25);
});
