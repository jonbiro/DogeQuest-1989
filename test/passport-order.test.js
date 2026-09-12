import test from 'node:test';
import assert from 'node:assert/strict';
import {orderedMasteryCards,nextMasteryHint} from '../src/runner/mastery.js';

test('passport features the closest unfinished reward without hiding other cards',()=>{
  const saved={dogs:{biscuit:2},rides:{rafts:9,ziplines:3}};
  const before=globalThis.structuredClone(saved);
  const cards=orderedMasteryCards(saved,'biscuit');
  assert.equal(cards[0].id,'ride-rafts');
  assert.equal(cards.length,9);
  assert.equal(new Set(cards.map(card=>card.id)).size,9);
  assert.deepEqual(saved,before);
  assert.equal(orderedMasteryCards({dogs:{biscuit:100},rides:{rafts:1}},'biscuit')[0].id,'ride-rafts');
});

test('post-run hint names the remaining activity and its actual next reward',()=>{
  assert.equal(nextMasteryHint({rides:{rafts:9}},'biscuit'),
    'Next: River explorer · 1 more river crossing for +600 pts');
  assert.equal(nextMasteryHint({rides:{ziplines:8}},'biscuit'),
    'Next: Sky explorer · 2 more cable rides for +600 pts');
  assert.match(nextMasteryHint({dogs:{mochi:9}},'mochi'),/1 more clear, weave or turn for \+150 pts/);
  assert.match(nextMasteryHint({regions:[2,0,0]},'biscuit'),/1 more clean course for \+200 pts/);
  assert.equal(nextMasteryHint({dogs:{biscuit:100,mochi:100,pepper:100,luna:100},regions:[25,25,25],rides:{rafts:30,ziplines:30}},'biscuit'),
    'Passport complete · every stamp collected');
});
test('ties prefer the selected puppy and completed collections remain available',()=>{
  assert.equal(orderedMasteryCards({},'mochi')[0].id,'dog-mochi');
  const all={dogs:{biscuit:100,mochi:100,pepper:100,luna:100},regions:[25,25,25],rides:{rafts:30,ziplines:30}};
  const cards=orderedMasteryCards(all,'luna');
  assert.equal(cards[0].id,'dog-luna');assert.equal(cards.length,9);
});
