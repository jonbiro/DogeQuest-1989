import test from 'node:test';
import assert from 'node:assert/strict';
import {CUES,traversalCue} from '../src/runner/sound.js';

test('river boarding and landing are distinct from boosts and cable rewards',()=>{
  assert.equal(traversalCue('raft-start'),'board');
  assert.equal(traversalCue('raft-end'),'shore');
  assert.equal(traversalCue('minecart-start'),'board');
  assert.equal(traversalCue('minecart-end'),'shore');
  assert.equal(traversalCue('zipline-start'),'zoomies');
  assert.equal(traversalCue('zipline-end'),'reward');
  for(const event of ['hit','bone','raft',null,undefined,'constructor'])assert.equal(traversalCue(event),null);
  assert.notDeepEqual(CUES.board,CUES.zoomies);
  assert.notDeepEqual(CUES.shore,CUES.reward);
});
test('river cues stay short, quiet and within the existing voice budget',()=>{
  for(const key of ['board','shore']){
    assert.equal(CUES[key].length,2);
    for(const note of CUES[key]){
      assert.equal(note.type,'sine');
      assert.ok(note.volume>0&&note.volume<=.022);
      assert.ok(note.at+note.duration<=.31);
      assert.ok(note.from>=90&&note.to>=90);
    }
  }
});
