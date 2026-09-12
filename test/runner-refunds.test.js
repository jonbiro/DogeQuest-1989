import test from 'node:test';
import assert from 'node:assert/strict';
import {levels,price,purchase,refundUpgrade,UPGRADES} from '../src/runner/progression.js';
import {createRun,act,BASE_SLIDE_DURATION,SLIDE_UPGRADE_DURATION} from '../src/runner/world.js';
const {structuredClone}=globalThis;
test('every upgrade level refunds exactly its price without changing other progress',()=>{
  for(const key of Object.keys(UPGRADES)) {
    const profile={credits:3300,upgrades:levels(),best:900,bones:50,collection:{puppy:'mochi'}};
    const before=structuredClone(profile);
    for(let i=0;i<3;i++)assert.equal(purchase(profile,key),true);
    assert.equal(profile.credits,0);
    for(let level=3;level>0;level--)assert.equal(refundUpgrade(profile,key),price(level-1));
    assert.deepEqual(profile,before);
    assert.equal(refundUpgrade(profile,key),0);
  }
});
test('invalid or unowned refunds cannot create points or negative levels',()=>{
  for(const level of [0,-1,4,1.5,'1',null]) {
    const p={credits:20,upgrades:{slide:level}};
    const before=structuredClone(p);
    assert.equal(refundUpgrade(p,'slide'),0);assert.deepEqual(p,before);
  }
  const p={credits:20,upgrades:levels()};
  assert.equal(refundUpgrade(p,'__proto__'),0);
  assert.equal(refundUpgrade(p,'unknown'),0);
});
test('refunding slides restores the preferred timing on the next run only',()=>{
  const profile={credits:0,upgrades:levels({slide:3})};
  const existing=createRun(1,profile.upgrades);act(existing,'slide');
  assert.equal(existing.slide,BASE_SLIDE_DURATION+3*SLIDE_UPGRADE_DURATION);
  for(let i=0;i<3;i++)refundUpgrade(profile,'slide');
  const next=createRun(1,profile.upgrades);act(next,'slide');
  assert.equal(next.slide,BASE_SLIDE_DURATION);
  assert.equal(existing.upgrades.slide,3);
  assert.equal(profile.credits,3300);
});
