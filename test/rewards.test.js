import test from 'node:test';
import assert from 'node:assert/strict';
import { bankRun } from '../src/runner/rewards.js';
import { collectionFrom } from '../src/runner/collection.js';
import { missionFor, missionPackFor } from '../src/runner/missions.js';
const profile = () => ({best: 0, distance: 0, bones: 0, credits: 0,
  challenges: 0, collection: collectionFrom()});
const completed = () => ({ended: true, score: 2000, distance: 1100, bones: 50, gifts: 2});
test('three-challenge chains bank once and stop at the first unfinished goal',()=>{
  const p=profile(),run={...completed(),clears:6},pack=missionPackFor(0);
  const receipt=bankRun(p,run,pack);
  assert.equal(receipt.missionPoints,1100);
  assert.equal(receipt.missionCount,3);
  assert.equal(p.challenges,3);
  const credits=p.credits;
  assert.equal(bankRun(p,run,pack),receipt);
  assert.equal(p.credits,credits);
  const partial=profile(),short={...completed(),bones:29,clears:20};
  assert.equal(bankRun(partial,short,pack).missionCount,1);
  assert.equal(partial.challenges,1);
  assert.deepEqual(missionPackFor(partial.challenges).map(m=>m.id),[1,2,3]);
});
test('abandoned chains award nothing and a run cannot bank more than three goals',()=>{
  const p=profile(),run={...completed(),clears:100,ended:false};
  assert.equal(bankRun(p,run,missionPackFor(0)),null);
  assert.equal(p.challenges,0);
  run.ended=true;
  assert.equal(bankRun(p,run,[0,1,2,3,4,5].map(missionFor)).missionCount,3);
  assert.equal(p.challenges,3);
});
test('completion banks every reward and record once, with a stable receipt', () => {
  const p = profile(), run = completed(), mission = missionFor(0);
  const receipt = bankRun(p, run, mission);
  assert.equal(p.credits, 3050); // score + mission + ribbon + medal
  assert.equal(p.bestRunBones, 50);
  assert.equal(p.bones, 50);
  assert.equal(p.distance, 1100);
  assert.equal(p.collection.gifts, 2);
  assert.ok(p.collection.costumes.includes('royal'));
  assert.equal(receipt.personalBest, true);
  const before = globalThis.structuredClone(p);
  for (let i = 0; i < 10; i++) assert.equal(bankRun(p, run, mission), receipt);
  assert.deepEqual(p, before);
});
test('unfinished runs cannot bank; later runs update totals without lowering records', () => {
  const p = profile(), unfinished = {...completed(), ended: false};
  const before = globalThis.structuredClone(p);
  assert.equal(bankRun(p, unfinished, missionFor(0)), null);
  assert.deepEqual(p, before);
  bankRun(p, completed(), missionFor(0));
  const next = {...completed(), score: 500, distance: 400, bones: 30, gifts: 1};
  const receipt = bankRun(p, next, missionFor(1));
  assert.equal(p.credits, 3900);
  assert.equal(p.bones, 80);
  assert.equal(p.bestRunBones, 50);
  assert.equal(p.best, 2000);
  assert.equal(p.distance, 1100);
  assert.equal(receipt.personalBest, false);
  assert.ok(p.collection.costumes.includes('party'));
  assert.equal(p.collection.gifts, 3);
});
