import test from 'node:test';
import assert from 'node:assert/strict';
import {createAreaSoundscape,AREA_MOTIFS} from '../src/runner/soundscape.js';
import {AREAS} from '../src/runner/areas.js';

test('each landscape has a distinct quiet phrase with bounded voices and duration',()=>{
  assert.equal(AREA_MOTIFS.length,AREAS.length);
  assert.equal(new Set(AREA_MOTIFS.map(JSON.stringify)).size,AREAS.length);
  for(const notes of AREA_MOTIFS){
    assert.equal(notes.length,5);
    for(const note of notes){
      assert.ok(note.from>=100&&note.from<2000);assert.ok(['sine','triangle'].includes(note.type));
      assert.ok(note.volume>0&&note.volume<=.006);
      assert.ok(note.duration>0&&note.at+note.duration<1.7);
    }
  }
});
test('phrases wait for calm play, never catch up missed time, and cancel on pause or area changes',()=>{
  const played=[],stopped=[];
  const soundscape=createAreaSoundscape((_audio,notes)=>{played.push(notes);return ()=>stopped.push(notes);});
  const audio={};
  const update=(time,overrides={})=>soundscape.update(audio,{enabled:true,time,distance:0,...overrides});
  update(0);update(1);assert.equal(played.length,0);
  update(1.3);assert.equal(played.length,1);
  update(2);assert.equal(played.length,1);
  update(10,{quiet:false});update(10.5);assert.equal(played.length,1);
  update(10.9);assert.equal(played.length,2,'only one phrase after a long interruption');
  update(11,{distance:225});assert.equal(stopped.length,2);
  update(12.3,{distance:225});assert.equal(played.at(-1),AREA_MOTIFS[1]);
  update(12.4,{enabled:false});assert.equal(stopped.length,3);
  update(100);assert.equal(played.length,3,'resume starts with a quiet lead-in');
  update(101.3);assert.equal(played.length,4);
  update(0);assert.equal(stopped.length,4,'a new run cancels the old phrase');
  update(.5);assert.equal(played.length,4);
  soundscape.stop();soundscape.stop();assert.equal(stopped.length,4);
});
test('disabled audio and invalid frames cannot allocate sound',()=>{
  const soundscape=createAreaSoundscape(()=>{throw Error('must not allocate');});
  for(const audio of [null,undefined])soundscape.update(audio,{enabled:true,time:10,distance:0});
  for(const time of [NaN,Infinity])soundscape.update({},{enabled:true,time,distance:0});
  soundscape.update({},{enabled:false,time:10,distance:0});
});
