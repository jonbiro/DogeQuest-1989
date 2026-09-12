import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,act} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';

for(const level of [0,3])test(`delayed cue responses clear eight 3km trails at upgrade level ${level}`,()=>{
  for(const delay of [.1,.15,.2])for(let seed=0;seed<8;seed++) {
    const run=createRun(seed,{leap:level,slide:level,magnet:level,value:level});
    let previous='';
    const pending=[];
    while(!run.ended&&run.distance<3000) {
      const cue=actionCue(run);
      if(cue!==previous) {
        previous=cue;
        const action=cue.includes('LEFT')?'left':cue.includes('RIGHT')?'right':
          cue.includes('SLIDE')?'slide':cue.includes('JUMP')?'jump':null;
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
