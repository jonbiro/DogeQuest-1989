import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,fillTrack,step,act,LANES,HAZARDS} from '../src/runner/world.js';
import {courseAt,advanceCourse,courseProgress,courseCue} from '../src/runner/courses.js';
import {actionCue} from '../src/runner/guidance.js';

test('gentle regional sequences always offer two escape lanes and never award hard-course mastery',()=>{
  const patterns=new Set();
  for(const start of [200,475,1120]){
    const run=createRun(1989,{},3); // Pin the original three authored course locations.
    Object.assign(run,{distance:start-25,nextRow:start,row:12,objects:[],course:null,
      nextChoice:3000,nextZipline:4000,choicePending:null,route:{kind:'scenic',until:start+150}});
    fillTrack(run);
    const course=run.course;
    assert.equal(course.scenic,true);
    patterns.add(course.beats.map(b=>b.type).join(','));
    for(const beat of course.beats){
      const hazards=run.objects.filter(o=>o.at===beat.at&&HAZARDS.includes(o.type));
      assert.equal(hazards.length,1);
      assert.notEqual(hazards[0].lane,beat.safeLane);
      assert.notEqual(hazards[0].type,'gap','no compulsory full-width jump');
      assert.equal(hazards[0].courseRegion,undefined,'ordinary mistake advice, not forced weave');
    }
    run.distance=start;assert.match(courseProgress(run).label,/open lanes/);
    assert.equal(courseProgress(run).ariaLabel,'Scenic sequence distance');
    assert.equal(courseCue(run),'');
    run.distance=course.end;
    assert.equal(advanceCourse(run,LANES),0);
    assert.deepEqual(run.regionalCourses,[0,0,0]);assert.equal(run.bonusPoints,0);
    assert.equal(run.course,null);
  }
  assert.equal(patterns.size,3);
  for(const version of [1,2])assert.equal(courseAt(475,version,true).scenic,undefined);
});

test('default Scenic choices encounter every regional family over six kilometres with real cues',()=>{
  for(const seed of [1989,1990,1991])for(const version of [1,2,3]){
    const run=createRun(seed,{},version),regions=new Set();let previous='';
    while(!run.ended&&run.distance<6000){
      if(run.course)regions.add(run.course.region);
      // Remaining in the center at a gate is the actual default Scenic choice.
      if(run.choicePending!==null&&run.choicePending-run.distance<30&&run.lane!==1)
        act(run,run.lane<1?'right':'left');
      const cue=actionCue(run);
      if(cue!==previous){
        previous=cue;
        const action=cue.includes('LEFT')?'left':cue.includes('RIGHT')?'right':cue.includes('SLIDE')?'slide':cue.includes('JUMP')?'jump':null;
        if(action&&!cue.includes('SET'))act(run,action);
      }
      const before=run.events.length;step(run,1/120);
      assert.ok(!run.events.slice(before).some(e=>e==='hit'||e==='shield-break'),`${seed} at ${run.distance}`);
    }
    assert.ok(run.distance>=6000);assert.deepEqual([...regions].sort(),version>=3?[0,1,2]:[0]);
    assert.equal(run.regionalCourses[1],0);assert.equal(run.regionalCourses[2],0);
  }
});
