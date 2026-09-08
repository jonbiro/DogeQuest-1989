import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,fillTrack,act,step,LANES,HAZARDS} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';

function fixture(route=null) {
  const run=createRun(11);
  Object.assign(run,{distance:1225,nextRow:1250,row:14,objects:[],route,
    lastCourseVisit:2,nextChoice:3000,nextZipline:4000,choicePending:null});
  fillTrack(run);
  return run;
}

test('late split rows offer both jump and slide with full action-row recovery, never on Scenic',()=>{
  for(const route of [null,{kind:'challenge',until:1450}]) {
    const run=fixture(route), row=run.objects.filter(o=>o.at===1250&&HAZARDS.includes(o.type));
    assert.equal(row.filter(o=>o.type==='gate').length,1);
    assert.equal(row.filter(o=>o.type==='log').length,2);
    assert.ok(row.every(o=>o.splitChoice));
    assert.ok(run.objects.filter(o=>o.at>1250&&HAZARDS.includes(o.type)).every(o=>o.at>=1292));
    assert.ok(row.every(o=>o.skillReward===(route?60:20)));
  }
  assert.ok(fixture({kind:'scenic',until:1450}).objects.every(o=>!o.splitChoice));
  assert.ok(createRun(11).objects.every(o=>!o.splitChoice),'opening remains introductory');
});

test('each lane in a split row is clearable with its own cue at normal and boosted speed',()=>{
  for(const lane of [0,1,2]) for(const speed of [22,36,46.8]) {
    const run=fixture();
    run.objects=run.objects.filter(o=>o.at===1250&&HAZARDS.includes(o.type));
    run.nextRow=run.nextChoice=run.nextZipline=Infinity;
    run.distance=1250-speed*.44;run.previous.distance=run.distance;
    run.speed=speed;run.lane=lane;run.x=LANES[lane];
    const own=run.objects.find(o=>o.lane===lane);
    const action=own.type==='gate'?'slide':'jump';
    assert.equal(actionCue(run),action==='slide'?'↓ SLIDE':'↑ JUMP');
    act(run,action);
    for(let i=0;i<120;i++) step(run,1/120);
    assert.equal(run.hearts,3,`${lane}/${speed}/${action}`);
    assert.equal(run.clears,1);
  }
});

test('wrong actions in split rows still collide instead of awarding a free clear',()=>{
  for(const type of ['gate','log']) {
    const run=fixture();
    const own=run.objects.find(o=>o.at===1250&&o.type===type);
    run.objects=run.objects.filter(o=>o.at===1250&&HAZARDS.includes(o.type));
    run.nextRow=run.nextChoice=run.nextZipline=Infinity;
    run.distance=1244;run.lane=own.lane;run.x=LANES[own.lane];
    act(run,type==='gate'?'jump':'slide');
    for(let i=0;i<120;i++)step(run,1/120);
    assert.equal(run.hearts,2);
    assert.equal(run.clears,0);
  }
});
