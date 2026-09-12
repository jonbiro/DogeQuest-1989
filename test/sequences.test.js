import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,fillTrack,step,act,HAZARDS,LANES} from '../src/runner/world.js';
import {courseAt,courseCue,COURSE_BONUS,COURSE_LENGTH} from '../src/runner/courses.js';

function sequence(start=200,route=null) {
  const run=createRun(17);
  Object.assign(run,{distance:start-25,nextRow:start,row:12,objects:[],route,
    nextChoice:2000,nextZipline:3000,choicePending:null});
  fillTrack(run);
  return run;
}
test('later laps rotate nine distinct courses without changing spacing or recovery',()=>{
  const names=new Set();
  for(const start of [200,475,1120]) {
    const patterns=new Set();
    for(let lap=0;lap<3;lap++) {
      const course=courseAt(start+1350*lap);
      names.add(course.name);
      patterns.add(JSON.stringify(course.beats.map(b=>[b.type,b.safeLane])));
      assert.equal(course.variant,lap);
      assert.deepEqual(course.beats.map(b=>b.at-course.start),[0,35,70]);
      assert.equal(course.end-course.start,COURSE_LENGTH);
      assert.equal(courseAt(start+1350*(lap+3)).name,course.name);
    }
    assert.equal(patterns.size,3);
  }
  assert.equal(names.size,9);
});

test('regions author distinct jungle timing, canyon gaps and crystal slalom courses',()=>{
  for(const [start,region,types] of [[200,0,['log','branch','log']],[475,1,['gap','log','gap']],[1120,2,['rock','rock','rock']]]) {
    const run=sequence(start);
    assert.equal(run.course.region,region);
    assert.deepEqual(run.course.beats.map(beat=>beat.type),types);
    for(const beat of run.course.beats) {
      const row=run.objects.filter(o=>o.at===beat.at&&HAZARDS.includes(o.type));
      assert.equal(row.length,region===2?2:3);
      if(region===2)assert.ok(row.every(o=>o.lane!==beat.safeLane));
      if(beat.type==='gap')assert.equal(beat.at%5,0);
    }
    assert.ok(run.objects.some(o=>o.type==='gift'&&o.at===start+88));
    assert.ok(run.objects.filter(o=>HAZARDS.includes(o.type)).every(o=>o.at<=start+70||o.at>=start+100));
  }
});

test('courses respect Scenic, corner reservations and region boundaries',()=>{
  assert.equal(sequence(200,{kind:'scenic',until:1000}).course,null);
  assert.equal(sequence(480,{kind:'challenge',until:570}).course?.start,480,
    'a clear recovery may extend beyond Challenge, while all hazard beats stay inside it');
  assert.notEqual(sequence(100).course?.start,100);
  assert.notEqual(sequence(420).course?.start,420);
  const run=sequence();
  const first=run.course;
  fillTrack(run);
  assert.equal(run.course,first);
  assert.equal(run.objects.filter(o=>o.type==='gift'&&o.at===288).length,1);
});

test('all nine regional courses clear with base and upgraded moves at top and boosted speeds',()=>{
  for(const start of [200,475,1120])for(const lap of [0,1,2])for(const leap of [0,3])for(const speed of [36,46.8]) {
    const run=sequence(start), course=run.course;
    const variant=courseAt(start+lap*1350);
    course.name=variant.name;
    course.beats=variant.beats.map((beat,i)=>({...beat,at:start+i*35}));
    run.objects=[];
    for(const beat of course.beats)for(let lane=0;lane<3;lane++) {
      if(lane!==beat.safeLane)run.objects.push({id:run.id++,type:beat.type,lane,at:beat.at});
    }
    run.objects=run.objects.filter(o=>o.at<course.end).map(o=>({...o,at:o.at+10000}));
    for(const beat of course.beats)beat.at+=10000;
    course.start+=10000;course.end+=10000;
    run.distance+=10000;run.previous.distance=run.distance;
    run.nextRow=Infinity;run.nextChoice=Infinity;run.nextZipline=Infinity;
    run.upgrades.leap=leap;run.speed=speed;
    if(speed>36)run.zoomies=10;
    const acted=new Set();
    while(run.distance<course.end+2&&!run.ended) {
      const beat=course.beats.find(b=>b.at>run.distance);
      if(beat&&beat.safeLane!==undefined&&beat.at-run.distance<run.speed*.8) {
        if(run.lane!==beat.safeLane)act(run,beat.safeLane<run.lane?'left':'right');
      } else if(beat&&beat.at-run.distance<run.speed*.4&&!acted.has(beat.at)) {
        act(run,beat.type==='branch'?'slide':'jump');acted.add(beat.at);
      }
      step(run,1/120);
    }
    assert.equal(run.hearts,3,`${start}/${leap}/${speed}`);
    assert.equal(run.regionalCourses[course.region],1,`${course.name} scored`);
    assert.equal(run.events.filter(e=>e==='course-complete').length,1);
    const bonus=run.bonusPoints;
    for(let i=0;i<30;i++)step(run,1/120);
    assert.equal(run.bonusPoints,bonus,'course bonus is granted once');
    assert.ok(bonus>=COURSE_BONUS);
  }
});

test('slalom guidance stops when the requested lane is selected and misses cannot earn course bonuses',()=>{
  const run=sequence(1120),course=run.course;
  run.distance=1105;
  assert.equal(courseCue(run),'← WEAVE LEFT');
  act(run,'left');
  assert.equal(courseCue(run),'');
  assert.equal(run.x,LANES[1],'guidance does not teleport the puppy');
  run.nextRow=Infinity;run.invulnerable=100;
  while(run.distance<course.end+1)step(run,1/120);
  assert.equal(run.regionalCourses[2],0,'missing lane targets fails even when damage is protected');
});
