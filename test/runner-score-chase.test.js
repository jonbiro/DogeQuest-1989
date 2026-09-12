import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreChaseLabel} from '../src/runner/score-chase.js';
test('record chase is quiet until the record is within reach',()=>{
  assert.equal(scoreChaseLabel(100,1000),'100 pts');
  assert.equal(scoreChaseLabel(851,1000),'150 pts to best');
  assert.equal(scoreChaseLabel(100,0),'100 pts','first runs do not celebrate every point');
  assert.equal(scoreChaseLabel(9400,10000),'9,400 pts');
  assert.equal(scoreChaseLabel(9600,10000),'401 pts to best');
});
test('rematches chase a nearer session target while all-time records take priority',()=>{
  assert.equal(scoreChaseLabel(100,10000,1000),'100 pts');
  assert.equal(scoreChaseLabel(851,10000,1000),'150 pts to rematch best');
  assert.equal(scoreChaseLabel(1000,10000,1000),'1 pt to rematch best');
  assert.equal(scoreChaseLabel(1001,10000,1000),'1,001 pts · REMATCH BEST');
  assert.equal(scoreChaseLabel(9600,10000,1000),'401 pts to best');
  assert.equal(scoreChaseLabel(10001,10000,1000),'10,001 pts · BEST');
  assert.equal(scoreChaseLabel(100,10000,NaN),'100 pts');
});
test('a tied score still needs one point and a beaten score remains explicit',()=>{
  assert.equal(scoreChaseLabel(1000,1000),'1 pt to best');
  assert.equal(scoreChaseLabel(1001,1000),'1,001 pts · BEST');
  assert.equal(scoreChaseLabel(1500,1000),'1,500 pts · BEST');
});
test('invalid and fractional scores never produce misleading record claims',()=>{
  assert.equal(scoreChaseLabel(NaN,0),'0 pts');
  assert.equal(scoreChaseLabel(50,Infinity),'50 pts');
  assert.equal(scoreChaseLabel(-10,-1),'0 pts');
  assert.equal(scoreChaseLabel(1000.9,1000.9),'1 pt to best');
});
