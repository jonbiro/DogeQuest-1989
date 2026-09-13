import test from 'node:test';
import assert from 'node:assert/strict';
import {AREA_RELIC_REWARD,createRun,fillTrack,step} from '../src/runner/world.js';
import {COURSE_LENGTH} from '../src/runner/courses.js';
import {areaAt} from '../src/runner/areas.js';

test('version 4 authored courses end with one optional area relic',()=>{
  const run=createRun(17,{},4);
  Object.assign(run,{distance:175,nextRow:195,row:12,objects:[],nextChoice:2000,nextZipline:3000,
    choicePending:null,lastCourseVisit:-1,route:null});
  fillTrack(run);
  assert.ok(run.course,'expected an authored course');
  const relics=run.objects.filter(object=>object.type==='relic');
  assert.equal(relics.length,1);
  const relic=relics[0];
  const finalBeat=run.course.beats.at(-1);
  assert.equal(relic.at,run.course.start+COURSE_LENGTH-8);
  assert.equal(relic.lane,finalBeat.safeLane??1);
  assert.equal(relic.relicArea,areaAt(relic.at));
});

test('legacy trail versions stay deterministic and do not gain relic pickups',()=>{
  const run=createRun(17,{},3);
  Object.assign(run,{distance:175,nextRow:195,row:12,objects:[],nextChoice:2000,nextZipline:3000,
    choicePending:null,lastCourseVisit:-1,route:null});
  fillTrack(run);
  assert.equal(run.objects.filter(object=>object.type==='relic').length,0);
});

test('collecting a relic awards points once and records its area',()=>{
  const run=createRun(7);
  run.objects=[{id:1,type:'relic',lane:1,at:run.distance+1,used:false,relicArea:4}];
  run.nextRow=Infinity;
  step(run,1/120);
  assert.equal(run.relics,1);
  assert.equal(run.relicPoints,AREA_RELIC_REWARD);
  assert.equal(run.bonusPoints,AREA_RELIC_REWARD);
  assert.equal(run.pickupBonusPoints,AREA_RELIC_REWARD);
  assert.equal(run.relicsByArea[4],1);
  assert.ok(run.events.includes('relic'));
  run.events=[];
  step(run,1/120);
  assert.equal(run.relics,1);
  assert.deepEqual(run.events,[]);
});
