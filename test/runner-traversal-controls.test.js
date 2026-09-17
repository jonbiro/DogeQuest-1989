import test from 'node:test';
import assert from 'node:assert/strict';
import {updateTraversalControls,updateActionCueControls,updateLaneCueControls,updateTurnControls,traversalDescription} from '../src/runner/traversal-controls.js';
import {createRun,act,step} from '../src/runner/world.js';
function button(action) {
  const label={textContent:action.toUpperCase()};
  return {dataset:{action},disabled:false,attributes:{},classList:{toggle(name,value){this[name]=value;}},querySelector:()=>label,
    setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];}};
}
function legacyTurnButton(action) {
  return {dataset:{action},attributes:{},classList:{toggle(){}},querySelector:()=>null,
    ownerDocument:{createElement(tag){assert.equal(tag,'small');return {textContent:''};}},
    append(node){this.repairedLabel=node;},
    setAttribute(key,value){this.attributes[key]=value;}};
}
function legacyTraversalButton(action) {
  return {dataset:{action,controlState:'ready'},disabled:false,
    ownerDocument:{createElement(tag){assert.equal(tag,'small');return {textContent:''};}},
    append(node){this.repairedLabel=node;}};
}
test('scene instructions match the available traversal actions',()=>{
  assert.match(traversalDescription({raft:{}}),/Jump and slide return at the shore/);
  assert.match(traversalDescription({zipline:{}}),/return after the cable/);
  assert.match(traversalDescription({minecart:{}}),/return after the cart/);
  assert.match(traversalDescription({minecart:{},minecartChoice:{kind:'gem-line'}}),/gem lane for \+250 points each/);
  assert.match(traversalDescription({}),/The buttons are easiest: tap LEFT or RIGHT for one lane/);
  assert.match(traversalDescription({}),/One swipe equals one move\. To keep your finger down, stop your thumb briefly, then drag again/);
  assert.match(traversalDescription({}),/tap a left or right edge to steer/);
  assert.match(traversalDescription({}),/center to jump/);
  assert.match(traversalDescription({}),/switch between steering and jump\/slide/);
});
test('raft controls explain shore availability and restore after real dismount',()=>{
  const run=createRun(1989),buttons=['left','right','fetch','jump','slide'].map(button);
  Object.assign(run,{raftPrototype:true,distance:1289.9,raft:{index:0,start:1150,end:1290},objects:[],nextRow:Infinity});
  updateTraversalControls(buttons,run);
  assert.deepEqual(buttons.map(b=>b.disabled),[false,false,false,true,true]);
  for(const b of buttons.slice(3))assert.match(b.attributes['aria-label'],/at the shore/);
  act(run,'jump');act(run,'slide');assert.equal(run.jumpBuffer,0);assert.equal(run.slide,0);
  step(run,1/30);assert.equal(run.raft,null);
  updateTraversalControls(buttons,run);assert.ok(buttons.every(b=>!b.disabled));
  act(run,'jump');assert.ok(run.vy>0);
  run.zipline={end:2000};updateTraversalControls(buttons,run);
  for(const b of buttons.slice(3))assert.match(b.attributes.title,/cable/);
});
test('buffered moves confirm acceptance without changing control availability',()=>{
  const buttons=['jump','slide'].map(button),run=createRun(1);
  act(run,'jump');act(run,'jump');
  updateTraversalControls(buttons,run);
  assert.equal(buttons[0].querySelector().textContent,'JUMP','an early buffer that expires before landing is not confirmed');
  run.y=.2;run.vy=-10;act(run,'jump');
  updateTraversalControls(buttons,run);
  assert.equal(buttons[0].querySelector().textContent,'QUEUED');
  assert.match(buttons[0].attributes['aria-label'],/queued after landing/);
  assert.equal(buttons[0].disabled,false);
  run.jumpBuffer=0;run.y=0;run.vy=0;
  act(run,'slide');run.slide=.1;act(run,'slide');
  updateTraversalControls(buttons,run);
  assert.equal(buttons[0].querySelector().textContent,'JUMP');
  assert.equal(buttons[1].querySelector().textContent,'QUEUED');
  act(run,'jump');updateTraversalControls(buttons,run);
  assert.equal(buttons[1].querySelector().textContent,'SLIDE');
  assert.equal(buttons[1].dataset.controlState,'ready');
  run.jumpBuffer=.1;run.zipline={end:790};updateTraversalControls(buttons,run);
  assert.equal(buttons[0].querySelector().textContent,'JUMP');
  assert.equal(buttons[0].disabled,true,'unavailable traversal takes precedence');
});
test('cable controls disable only jump and slide, with an explanation and no layout change',()=>{
  const buttons=['left','right','fetch','jump','slide'].map(button);
  updateTraversalControls(buttons,{zipline:{end:790}});
  assert.deepEqual(buttons.map(b=>b.disabled),[false,false,false,true,true]);
  for(const b of buttons.slice(3))assert.match(b.attributes['aria-label'],/available after the zipline/);
  updateTraversalControls(buttons,{zipline:{end:790}});
  updateTraversalControls(buttons,{zipline:null});
  assert.ok(buttons.every(b=>!b.disabled));
  assert.match(buttons[3].attributes['aria-label'],/^Jump$/);
  assert.match(buttons[4].attributes['aria-label'],/^Slide$/);
});
test('actual cable dismount restores the jump and slide controls for the next movement',()=>{
  const run=createRun(1989),buttons=['jump','slide'].map(button);
  Object.assign(run,{distance:789.9,zipline:{start:650,end:790},y:3.6,objects:[],nextRow:Infinity});
  updateTraversalControls(buttons,run);act(run,'jump');act(run,'slide');
  assert.equal(run.jumpBuffer,0);assert.equal(run.slide,0);
  step(run,1/30);assert.equal(run.zipline,null);
  updateTraversalControls(buttons,run);assert.ok(buttons.every(b=>!b.disabled));
  act(run,'slide');assert.equal(run.diving,true,'the restored slide control can dive after dismount');
});

test('turn labels repair the legacy bare-arrow markup without crashing the frame',()=>{
  const buttons=[legacyTurnButton('left'),legacyTurnButton('right')];
  assert.doesNotThrow(()=>updateTurnControls(buttons,{status:'ready',direction:'left'}));
  assert.equal(buttons[0].repairedLabel.textContent,'TURN');
  assert.equal(buttons[1].repairedLabel.textContent,'RIGHT');
  assert.equal(buttons[0].attributes['aria-label'],'Turn left');
  assert.equal(buttons[1].attributes['aria-label'],'Turn right');
});

test('traversal labels repair a stale shell even when its cached state is unchanged',()=>{
  const button=legacyTraversalButton('jump');
  assert.doesNotThrow(()=>updateTraversalControls([button],{jumpBuffer:0,slideNext:0,y:0,vy:0}));
  assert.equal(button.repairedLabel.textContent,'JUMP');
  assert.equal(button.disabled,false);
});

test('imminent action cues resolve to one matching thumb button',()=>{
  const buttons=['jump','slide'].map(button);
  updateActionCueControls(buttons,'↑ JUMP GAP');
  assert.equal(buttons[0].dataset.actionCue,'active');
  assert.equal(buttons[1].dataset.actionCue,undefined);
  assert.equal(buttons[0].classList['action-cue'],true);
  assert.equal(buttons[1].classList['action-cue'],false);
  updateActionCueControls(buttons,'↓ DIVE · SLIDE');
  assert.equal(buttons[0].dataset.actionCue,undefined);
  assert.equal(buttons[1].dataset.actionCue,'active');
  updateActionCueControls(buttons,'');
  assert.equal(buttons[0].classList['action-cue'],false);
  assert.equal(buttons[1].classList['action-cue'],false);
});

test('specific lane cues resolve to one horizontal thumb without stealing corner prompts',()=>{
  const buttons=['left','right'].map(button);
  updateLaneCueControls(buttons,'← BONES LEFT ×2');
  assert.equal(buttons[0].dataset.laneCue,'active');
  assert.equal(buttons[1].dataset.laneCue,undefined);
  assert.equal(buttons[0].classList['lane-cue'],true);
  assert.equal(buttons[1].classList['lane-cue'],false);
  updateLaneCueControls(buttons,'→ TURN RIGHT');
  assert.equal(buttons[0].classList['lane-cue'],false);
  assert.equal(buttons[1].classList['lane-cue'],false);
  updateLaneCueControls(buttons,'RAFT · STEER LEFT / RIGHT');
  assert.equal(buttons[0].classList['lane-cue'],false);
});
