import test from 'node:test';
import assert from 'node:assert/strict';
import {courseAt,courseProgress} from '../src/runner/courses.js';
test('course progress reports clean moves and honest bonus eligibility only during a course',()=>{
  const run={distance:200,course:courseAt(200)};
  assert.deepEqual(courseProgress(run),{label:'Root scramble · 0/3 clean · +180 possible',value:0,max:3});
  run.course.checked=2;run.course.clean=2;
  assert.match(courseProgress(run).label,/2\/3 clean.*180 possible/);
  run.course.clean=1;
  assert.match(courseProgress(run).label,/1\/3 clean.*bonus missed/);
  for(const distance of [199,300]){run.distance=distance;assert.equal(courseProgress(run),null);}
  run.distance=210;run.practice={};assert.equal(courseProgress(run),null);
  delete run.practice;run.course=null;assert.equal(courseProgress(run),null);
});
