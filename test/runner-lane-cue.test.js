import test from 'node:test';
import assert from 'node:assert/strict';
import {laneCue} from '../src/runner/lane-cue.js';
import {createRun,act,step} from '../src/runner/world.js';
import {courseAt} from '../src/runner/courses.js';
import {actionCue} from '../src/runner/guidance.js';

test('crossing two lanes says so, then acknowledges each accepted swipe',()=>{
  for(const [from,to,direction,arrow] of [[0,2,'RIGHT','→'],[2,0,'LEFT','←']]) {
    for(const label of ['WEAVE','BONES','GIFT']) {
      assert.equal(laneCue(from,to,label),`${arrow} ${label} ${direction} ×2`);
      assert.equal(laneCue(1,to,label),`${arrow} ${label} ${direction}`);
      assert.equal(laneCue(to,to,label),'');
    }
  }
});
test('two-swipe course guidance can be followed with a reaction delay at top and boosted speed',()=>{
  for(const speed of [36,46.8])for(const from of [0,2]) {
    const run=createRun(1989);run.distance=3600;run.speed=speed;run.lane=from;run.x=[-2.4,0,2.4][from];
    const target=2-from;
    run.course={...courseAt(3630),beats:[{at:3630,type:'rock',safeLane:target}],end:3660};
    run.nextRow=Infinity;run.nextChoice=Infinity;run.nextZipline=Infinity;run.nextCorner=5;
    run.objects=[0,1,2].filter(lane=>lane!==target).map(lane=>({id:lane,type:'rock',lane,at:3630}));
    let previous='',pending=[],inputs=0;
    while(run.distance<3632&&!run.ended) {
      const cue=actionCue(run);
      if(cue!==previous){previous=cue;if(cue.includes('WEAVE'))pending.push({at:run.time+.15,action:cue.includes('←')?'left':'right'});}
      while(pending.length&&pending[0].at<=run.time){act(run,pending.shift().action);inputs++;}
      // Isolate guidance at the stated speed from the normal acceleration curve.
      if(speed>36)run.zoomies=1;
      step(run,1/120);
    }
    assert.equal(inputs,2);assert.equal(run.lane,target);assert.equal(run.hearts,3);
    assert.equal(run.course.clean,1);
  }
});
