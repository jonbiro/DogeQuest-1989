import test from 'node:test';
import assert from 'node:assert/strict';
import {updateTraversalControls} from '../src/runner/traversal-controls.js';
import {createRun,act,step} from '../src/runner/world.js';
function button(action) {
  const label={textContent:action.toUpperCase()};
  return {dataset:{action},disabled:false,attributes:{},querySelector:()=>label,
    setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];}};
}
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
  assert.ok(buttons.every(b=>!b.disabled));assert.ok(buttons.every(b=>Object.keys(b.attributes).length===0));
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
