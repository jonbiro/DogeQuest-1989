import test from "node:test";
import assert from "node:assert/strict";
import {CUES,playNotes,stopSound} from "../src/runner/sound.js";
import {createRun,act,step} from "../src/runner/world.js";

test('slide feedback plays on a new move, not repeated presses or suspended movement',()=>{
  const run=createRun(1989);
  act(run,'slide');act(run,'slide');
  assert.equal(run.events.filter(event=>event==='slide').length,1);
  for(let i=0;i<90;i++)step(run,1/120);
  act(run,'slide');
  assert.equal(run.events.filter(event=>event==='slide').length,2);
  run.zipline={start:0,end:140};run.slide=0;
  act(run,'slide');
  assert.equal(run.events.filter(event=>event==='slide').length,2);
  run.zipline=null;run.ended=true;
  act(run,'slide');
  assert.equal(run.events.filter(event=>event==='slide').length,2);
  assert.ok(CUES.slide[0].from>CUES.slide[0].to,'descending cue contrasts with rising jump');
});
test("sound cues use finite, bounded pitches, durations and supported voices",()=>{
  for(const notes of Object.values(CUES))for(const note of notes){
    assert.ok(note.from>=100&&note.from<=2000);assert.ok(note.to>=100&&note.to<=2000);
    assert.ok(note.duration>.008&&note.duration<.5);assert.ok(note.at>=0&&note.at<.5);
    assert.ok(["sine","triangle"].includes(note.type));
  }
});
test("sound bursts are voice-limited, muted voices stop and finished nodes disconnect",()=>{
  const nodes=[],gains=[];
  const param={setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}};
  const context={currentTime:0,state:"running",suspends:0,destination:{},suspend(){this.state="suspended";this.suspends++;return Promise.resolve();},createOscillator(){const node={frequency:param,stops:[],connect(){},start(){},stop(time){this.stops.push(time);},disconnect(){this.disconnects=(this.disconnects||0)+1;}};nodes.push(node);return node;},createGain(){const gain={gain:param,connect(){},disconnect(){this.disconnects=(this.disconnects||0)+1;}};gains.push(gain);return gain;}};
  for(let i=0;i<20;i++)playNotes(context,CUES.reward);
  assert.equal(nodes.length,12);
  assert.ok(nodes.every(n=>n.stops.length===1&&n.stops[0]>0));
  stopSound(context);assert.ok(nodes.every(n=>n.stops.length===2&&n.stops[1]===undefined));
  assert.equal(context.suspends,1);
  assert.ok(nodes.every(n=>n.disconnects===1));assert.ok(gains.every(g=>g.disconnects===1));
  for(const node of nodes)node.onended();
  assert.ok(nodes.every(n=>n.disconnects===1));assert.ok(gains.every(g=>g.disconnects===1));
  playNotes(context,CUES.yip);assert.equal(nodes.length,14);
});
