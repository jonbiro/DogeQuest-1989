import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {createRun,step,act} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';

test('urgent hints update before the score-display throttle',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const cue=source.indexOf("setText('cue', run.practice ? practiceCue(run) : actionCue(run));");
  const throttle=source.indexOf('if (Math.floor(run.time * 10) !== lastHud || run.ended)');
  assert.ok(cue>=0&&throttle>cue,'action hints must not wait for the 10Hz statistics refresh');
});

for(const fps of [24,30,50,60])for(const level of [0,3])test(`delayed cues clear eight 3km trails at ${fps}fps and upgrade level ${level}`,()=>{
  for(const delay of [.1,.15,.2,.25])for(let seed=0;seed<8;seed++) {
    const run=createRun(seed,{leap:level,slide:level,magnet:level,value:level});
    let previous='';
    let nextFrame=0;
    const pending=[];
    while(!run.ended&&run.distance<3000) {
      const displayFrame=run.time+1e-9>=nextFrame;
      const cue=displayFrame?actionCue(run):previous;
      if(displayFrame)nextFrame+=1/fps;
      if(cue!==previous) {
        previous=cue;
        const action=cue.includes('LEFT')?'left':cue.includes('RIGHT')?'right':
          cue.includes('SLIDE')?'slide':(cue.includes('JUMP')||cue.includes('HOP'))?'jump':null;
        if(action&&!cue.includes('SET'))pending.push({at:run.time+delay,action});
      }
      while(pending[0]?.at<=run.time)act(run,pending.shift().action);
      const from=run.events.length;
      step(run,1/120);
      assert.ok(!run.events.slice(from).some(event=>['hit','shield-break'].includes(event)),
        `seed ${seed}, delay ${delay}, distance ${run.distance}: ${JSON.stringify(run.lastMistakeDetail)}`);
    }
    assert.ok(run.distance>=3000);
  }
});
