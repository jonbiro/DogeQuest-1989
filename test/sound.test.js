import test from "node:test";
import assert from "node:assert/strict";
import {CUES,playNotes,stopSound} from "../src/runner/sound.js";
import {createRun,act,step} from "../src/runner/world.js";
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {fetchReady} from '../src/runner/ability.js';

test('HUD chimes once per usable Fetch transition, never on every frame',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('const ready = fetchReady(run);');
  const end=source.indexOf("fetchButton.classList.toggle",start);
  assert.ok(start>=0 && end>start);
  const run=createRun(1),fetchButton={disabled:true},notes=[];
  const update=()=>runInNewContext(`{${source.slice(start,end)}}`,{run,fetchButton,fetchReady,tone:cue=>notes.push(cue)});
  update();run.fetchCharge=100;update();update();update();
  assert.deepEqual(notes,['ready']);
  run.magnet=1;update();update();
  assert.deepEqual(notes,['ready'],'charge alone is not enough during a magnet');
  run.magnet=0;update();update();
  assert.deepEqual(notes,['ready','ready']);
  run.ended=true;update();
  assert.equal(fetchButton.disabled,true);
});

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
test('touchdown feedback occurs once per real landing, including dives and cable dismounts',()=>{
  for (const leap of [0,3]) for(const dt of [1/120,1/60,1/30]) for(const action of ['jump','dive','dismount']) {
    const run=createRun(1989,{leap});run.objects=[];run.nextRow=Infinity;
    if(action==='dismount') {
      run.y=3.6;run.zipline={start:0,end:1};
    } else {
      act(run,'jump');
      for(let i=0;i<Math.round(.2/dt);i++)step(run,dt);
      assert.equal(run.events.includes('land'),false,'no touchdown in midair');
      if(action==='dive')act(run,'slide');
    }
    for(let i=0;i<Math.round(1.5/dt);i++)step(run,dt);
    assert.equal(run.events.filter(event=>event==='land').length,1,`${action}, leap ${leap}, dt ${dt}`);
    assert.equal(run.y,0);
  }
  assert.ok(CUES.land[0].volume<.035,'touchdown is quieter than action/reward cues');
  assert.ok(CUES.land[0].duration<CUES.jump[0].duration);
});

test('per-cue volume supports quiet feedback without raising the established output ceiling',()=>{
  const peaks=[];
  const parameter={setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime:value=>peaks.push(value)};
  const context={currentTime:0,destination:{},
    createOscillator:()=>({frequency:parameter,connect(){},start(){},stop(){},disconnect(){}}),
    createGain:()=>({gain:parameter,connect(){},disconnect(){}})};
  playNotes(context,CUES.land);
  playNotes(context,[{from:180,duration:.1,volume:100},{from:180,duration:.1,volume:NaN}]);
  assert.deepEqual(peaks,[.016,.035,.035]);
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
