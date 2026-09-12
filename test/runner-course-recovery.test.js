import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,step,act,LANES} from '../src/runner/world.js';
import {advanceCourse,courseAt} from '../src/runner/courses.js';
import {eventNotice} from '../src/runner/guidance.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';

test('partial course recovery rewards completion once, without a regional mastery credit',()=>{
  for(const clean of [0,1,2,3]) {
    const run=createRun(1989);
    run.course={...courseAt(200),checked:3,clean};run.distance=299;
    advanceCourse(run,LANES);assert.equal(run.bonusPoints,0);
    run.distance=300;advanceCourse(run,LANES);
    assert.equal(run.bonusPoints,clean===3?180:clean===2?60:0);
    assert.equal(run.regionalCourses[0],clean===3?1:0);
    assert.equal(run.course,null);
    const points=run.bonusPoints;advanceCourse(run,LANES);assert.equal(run.bonusPoints,points);
    if(clean===2)assert.deepEqual(run.events,['course-recovery']);
  }
});

test('a real missed weave can recover, finish and bank the smaller reward once',()=>{
  for(const fps of [60,120,240]){
    const run=createRun(1989);
    Object.assign(run,{objects:[],nextRow:Infinity,nextChoice:Infinity,nextZipline:Infinity});
    const beats=[{at:10,type:'rock',safeLane:0},{at:45,type:'rock',safeLane:2},{at:80,type:'rock',safeLane:1}];
    run.course={start:10,end:100,checked:0,clean:0,region:2,beats};
    run.objects=beats.flatMap(beat=>[0,1,2].filter(lane=>lane!==beat.safeLane)
      .map(lane=>({id:run.id++,type:'rock',lane,at:beat.at,courseRegion:2})));
    act(run,'left');let returned=false;
    while(run.distance<101&&!run.ended){
      if(run.distance>60&&!returned){act(run,'right');returned=true;}
      step(run,1/fps);
    }
    assert.equal(run.hearts,2);assert.equal(run.weaves,2);
    assert.equal(run.bonusPoints,60);assert.equal(run.regionalCourses[2],0);
    assert.equal(run.events.filter(event=>event==='course-recovery').length,1);
    const profile={best:0,distance:0,bones:0,credits:0,challenges:0,collection:collectionFrom()};
    run.ended=true;
    bankRun(profile,run,[]);assert.equal(profile.credits,run.score);
    const credits=profile.credits;bankRun(profile,run,[]);assert.equal(profile.credits,credits);
  }
});

test('recovery bonus enters the ordinary score total and uses the existing quiet notice',()=>{
  const run=createRun(1989);
  Object.assign(run,{distance:299.9,objects:[],nextRow:Infinity,nextChoice:Infinity,nextZipline:Infinity});
  run.course={...courseAt(200),checked:3,clean:2};
  step(run,1/120);
  assert.equal(run.bonusPoints,60);
  assert.equal(run.score,Math.floor(run.distance)+60);
  assert.deepEqual(eventNotice('course-recovery',run),{text:'Strong finish · 2/3 clean · +60',priority:1});
});
