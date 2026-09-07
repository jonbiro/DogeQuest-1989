import test from 'node:test';
import assert from 'node:assert/strict';
import { PRIZES, collectionFrom, prizeProgress } from '../src/runner/collection.js';
const profile = () => ({distance: 450, bones: 900, bestRunBones: 23, collection: collectionFrom({gifts: 2})});
test('prize progress distinguishes records from lifetime totals and caps targets', () => {
  const p = profile();
  assert.deepEqual(PRIZES.map(prize => prizeProgress(p, prize).current), [300, 23, 450, 2]);
  assert.equal(prizeProgress(p, PRIZES[0]).earned, false, 'display never grants prizes');
});
test('old saves show unknown single-run records as zero, but claimed prizes stay complete', () => {
  const p = profile(); delete p.bestRunBones;
  assert.equal(prizeProgress(p, PRIZES[1]).current, 0);
  p.collection.prizes.push('snack-master');
  assert.deepEqual(prizeProgress(p, PRIZES[1]), {earned: true, current: 50, target: 50});
});
