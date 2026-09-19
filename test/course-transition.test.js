import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,fillTrack} from '../src/runner/world.js';
import {cornerIntersecting} from '../src/runner/turns.js';
import {raftIntersecting} from '../src/runner/rafts.js';

test('prototype courses can bridge scenery transitions without crossing encounter reservations',()=>{
  let transitions=0;
  for(let start=200;start<18000;start+=5){
    const run=createRun(1989);
    Object.assign(run,{raftPrototype:true,distance:start-169,nextRow:start,objects:[],course:null,
      route:null,lastCourseVisit:-1,nextChoice:350+700*Math.ceil((start-350)/700),
      nextZipline:650+1400*Math.max(0,Math.ceil((start-650)/1400)),
      nextClimb:850+1800*Math.max(0,Math.ceil((start-850)/1800)),
      nextGlide:420+2000*Math.max(0,Math.ceil((start-420)/2000))});
    fillTrack(run);
    const course=run.course;
    if(!course)continue;
    assert.equal(cornerIntersecting(course.start,course.end),null);
    assert.equal(raftIntersecting(course.start,course.end),null);
    assert.ok(course.end<Math.min(run.nextChoice,run.nextZipline)-45);
    if(Math.floor(course.start/450)!==Math.floor(course.end/450))transitions++;
  }
  assert.ok(transitions>20,`Only ${transitions} transition opportunities`);
});
