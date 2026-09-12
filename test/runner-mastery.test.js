import test from 'node:test';
import assert from 'node:assert/strict';
import {masteryFrom,masteryCards,bankMastery} from '../src/runner/mastery.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';
import {missionFor} from '../src/runner/missions.js';

test('old and malformed saves get safe mastery without inventing historical achievements',()=>{
  for(const value of [undefined,null,{},42]) assert.deepEqual(masteryFrom(value),masteryFrom());
  const input={dogs:{mochi:12.8,biscuit:-2,luna:Infinity,unknown:999},regions:[3.7,-1,NaN]};
  const output=masteryFrom(input);
  assert.deepEqual(output,{dogs:{biscuit:0,mochi:12,pepper:0,luna:0},regions:[3,0,0]});
  assert.equal(input.dogs.mochi,12.8);
  assert.equal(masteryCards(output).length,7);
});

test('mastery follows the dog used on the run and each clean regional course',()=>{
  const profile={credits:0,mastery:masteryFrom(),collection:collectionFrom({puppy:'biscuit'})};
  const run={ended:true,puppy:'mochi',clears:8,turns:2,regionalCourses:[3,1,0]};
  const receipt=bankMastery(profile,run);
  assert.equal(profile.mastery.dogs.mochi,10);
  assert.equal(profile.mastery.dogs.biscuit,0);
  assert.deepEqual(profile.mastery.regions,[3,1,0]);
  assert.equal(receipt.earned.length,2);
  assert.equal(profile.credits,350);
  assert.equal(bankMastery(profile,run),receipt);
  assert.equal(profile.credits,350);
  const restored=JSON.parse(JSON.stringify(profile));
  bankMastery(restored,{ended:true,puppy:'mochi',clears:1,turns:0,regionalCourses:[1,0,0]});
  assert.equal(restored.credits,350,'reload cannot replay already-earned badges');
});

test('all tier crossings pay once; incomplete runs and invalid dog ids cannot earn dog rewards',()=>{
  const profile={credits:0};
  bankMastery(profile,{ended:false,puppy:'mochi',clears:100,regionalCourses:[25,25,25]});
  assert.deepEqual(profile,{credits:0});
  const result=bankMastery(profile,{ended:true,puppy:'mochi',clears:100,regionalCourses:[25,25,25]});
  assert.equal(result.earned.length,12);
  assert.equal(result.points,6300);
  bankMastery(profile,{ended:true,puppy:'not-a-dog',clears:999});
  assert.equal(profile.mastery.dogs.mochi,100);
});

test('mastery is part of the stable end-of-run banking transaction and survives save roundtrip',()=>{
  const profile={best:0,distance:0,bones:0,credits:0,challenges:0,collection:collectionFrom()};
  const run={ended:true,puppy:'mochi',score:10,distance:10,bones:0,gifts:0,clears:10,turns:0,regionalCourses:[0,0,0]};
  const receipt=bankRun(profile,run,missionFor(0));
  assert.equal(profile.credits,160);
  assert.equal(receipt.mastery.points,150);
  const before=JSON.stringify(profile);
  bankRun(profile,run,missionFor(0));
  assert.equal(JSON.stringify(profile),before);
  assert.deepEqual(masteryFrom(JSON.parse(before).mastery),profile.mastery);
});

test('course weaving advances only the selected dog and pays a crossed bond tier once',()=>{
  const profile={best:0,distance:0,bones:0,credits:0,challenges:0,collection:collectionFrom(),
    mastery:masteryFrom({dogs:{mochi:8}})};
  const run={ended:true,puppy:'mochi',score:100,distance:100,bones:0,gifts:0,
    clears:0,turns:0,weaves:3,regionalCourses:[0,0,0]};
  const receipt=bankRun(profile,run,[]);
  assert.equal(profile.mastery.dogs.mochi,11);
  assert.equal(profile.mastery.dogs.biscuit,0);
  assert.equal(receipt.mastery.points,150);
  assert.equal(receipt.totalPoints,250);
  bankRun(profile,run,[]);
  assert.equal(profile.credits,250);
  const restored=JSON.parse(JSON.stringify(profile));
  bankMastery(restored,{ended:true,puppy:'mochi',weaves:1});
  assert.equal(restored.mastery.dogs.mochi,12);
  assert.equal(restored.credits,250);
  const practiceProfile=JSON.stringify(profile);
  assert.equal(bankRun(profile,{...run,receipt:undefined,practice:{}},[]),null);
  assert.equal(JSON.stringify(profile),practiceProfile);
});
