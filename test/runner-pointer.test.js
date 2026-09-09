import test from 'node:test';
import assert from 'node:assert/strict';
import {canStartSwipe,ownsSwipe} from '../src/runner/gestures.js';

test('only a primary contact or left mouse button may begin a free swipe',()=>{
  assert.equal(canStartSwipe({button:0,isPrimary:true},null),true);
  assert.equal(canStartSwipe({button:2,isPrimary:true},null),false);
  assert.equal(canStartSwipe({button:1,isPrimary:true},null),false);
  assert.equal(canStartSwipe({button:0,isPrimary:false},null),false);
  assert.equal(canStartSwipe({button:0,isPrimary:true},{id:1}),false);
});

test('unrelated touch cancellation cannot clear the active swipe',()=>{
  const active={id:7,x:20,y:30};
  assert.equal(ownsSwipe({pointerId:8},active),false);
  assert.equal(ownsSwipe({pointerId:7},active),true);
  assert.equal(ownsSwipe({pointerId:7},null),false);
  assert.deepEqual(active,{id:7,x:20,y:30});
});
