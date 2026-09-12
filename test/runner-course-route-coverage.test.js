import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,act} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';

test('cue-driven Challenge routes reach and reward every regional course family',()=>{
  const generated=new Set(),finished=new Set(),completed=[0,0,0];
  let weaves=0;
  for(const seed of [1989,1990,1991]) {
    const run=createRun(seed);let previous='';
    while(!run.ended&&run.distance<6000) {
      if(run.course)generated.add(run.course.name);
      // Select the explicit harder gate; a center-lane pilot silently chooses Scenic.
      if(run.choicePending!==null&&run.choicePending-run.distance<30&&run.lane<2)act(run,'right');
      const cue=actionCue(run);
      if(cue!==previous) {
        previous=cue;
        const action=cue.includes('LEFT')?'left':cue.includes('RIGHT')?'right':
          cue.includes('SLIDE')?'slide':cue.includes('JUMP')?'jump':null;
        if(action&&!cue.includes('SET'))act(run,action);
      }
      const from=run.events.length;
      const course=run.course;
      step(run,1/120);
      const events=run.events.slice(from);
      if(events.includes('course-complete'))finished.add(course.name);
      assert.ok(!events.some(e=>e==='hit'||e==='shield-break'),`seed ${seed} at ${run.distance}`);
      weaves+=events.filter(e=>e==='weave').length;
    }
    assert.ok(run.distance>=6000);
    run.regionalCourses.forEach((count,i)=>{completed[i]+=count;});
  }
  assert.deepEqual([...generated].sort(),['Root scramble','Canopy shuffle','Root rhythm','Fern dash',
    'Canyon crossings','Ridge hop','Twin crossings','Ridge switch','Crystal slalom',
    'Moonpaw weave','Crystal switchback','Moonlit hurdles'].sort());
  assert.ok(completed.every(count=>count>0),JSON.stringify(completed));
  assert.deepEqual([...finished].sort(),[...generated].sort(),'every generated variant earns its completion bonus');
  assert.ok(weaves>=20,`only ${weaves} weave rewards`);
});
