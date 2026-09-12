import test from 'node:test';
import assert from 'node:assert/strict';
import {masteryFrom,bankMastery,masteryCards} from '../src/runner/mastery.js';

test('completed rides unlock permanent passport rewards exactly once',()=>{
  const profile={credits:0,mastery:masteryFrom()};
  const run={ended:true,rafts:1,ziplines:1};
  const receipt=bankMastery(profile,run);
  assert.equal(receipt.points,400);
  assert.equal(receipt.earned.length,2);
  assert.equal(bankMastery(profile,run),receipt);
  assert.equal(profile.credits,400);
  const reloaded={credits:profile.credits,mastery:masteryFrom(JSON.parse(JSON.stringify(profile.mastery)))};
  assert.equal(bankMastery(reloaded,{ended:true,rafts:1,ziplines:1}).points,0);
  assert.deepEqual(reloaded.mastery.rides,{rafts:2,ziplines:2});
  assert.equal(bankMastery(reloaded,{ended:true,rafts:8,ziplines:28}).points,2400);
  assert.equal(masteryCards(reloaded.mastery).find(card=>card.id==='ride-rafts').current,10);
});

test('practice, unfinished rides and malformed counters cannot earn ride progress',()=>{
  const profile={credits:50,mastery:masteryFrom()};
  const before=globalThis.structuredClone(profile);
  bankMastery(profile,{ended:true,practice:{kind:'raft'},rafts:30,ziplines:30});
  bankMastery(profile,{ended:false,rafts:30,ziplines:30});
  assert.deepEqual(profile,before);
  bankMastery(profile,{ended:true,raft:{},rafts:0,ziplines:0});
  assert.deepEqual(profile,before);
  assert.deepEqual(masteryFrom({rides:{rafts:NaN,ziplines:-1}}).rides,{rafts:0,ziplines:0});
  assert.deepEqual(masteryFrom({rides:{rafts:2.9,ziplines:Infinity}}).rides,{rafts:2,ziplines:0});
});
