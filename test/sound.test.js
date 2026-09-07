import test from "node:test";
import assert from "node:assert/strict";
import {CUES,playNotes,stopSound} from "../src/runner/sound.js";
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
  const context={currentTime:0,destination:{},createOscillator(){const node={frequency:param,stops:[],connect(){},start(){},stop(time){this.stops.push(time);},disconnect(){this.disconnected=true;}};nodes.push(node);return node;},createGain(){const gain={gain:param,connect(){},disconnect(){this.disconnected=true;}};gains.push(gain);return gain;}};
  for(let i=0;i<20;i++)playNotes(context,CUES.reward);
  assert.equal(nodes.length,12);
  assert.ok(nodes.every(n=>n.stops.length===1&&n.stops[0]>0));
  stopSound(context);assert.ok(nodes.every(n=>n.stops.length===2&&n.stops[1]===undefined));
  for(const node of nodes)node.onended();
  assert.ok(nodes.every(n=>n.disconnected));assert.ok(gains.every(g=>g.disconnected));
  playNotes(context,CUES.yip);assert.equal(nodes.length,14);
});
