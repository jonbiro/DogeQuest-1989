import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {createRun,step} from '../src/runner/world.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';
import {missionPackFor} from '../src/runner/missions.js';
import {runLesson} from '../src/runner/guidance.js';

function fixture(state='paused',practice=false) {
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('$("home").onclick =');
  const end=source.indexOf('$("overlay-primary").onclick',start);
  assert.ok(start>=0&&end>start);
  const nodes={home:{},play:{focus:()=>{}}};
  const profile={best:0,distance:0,bones:0,credits:0,challenges:0,collection:collectionFrom()};
  const run=createRun(1989);
  Object.assign(run,{score:700,distance:610,bones:12,gifts:1,clears:3,missions:missionPackFor(0)});
  if(practice)run.practice={correct:1};
  const context={state,run,$:id=>nodes[id],
    setState:value=>{context.state=value;},
    finish:()=>{bankRun(profile,run,run.missions);context.state='ended';}};
  runInNewContext(source.slice(start,end),context);
  return {context,profile,run,click:()=>nodes.home.onclick()};
}
test('finishing from pause banks earned rewards once without removing hearts or completing unfinished goals',()=>{
  const f=fixture();f.click();
  assert.equal(f.context.state,'ended');
  assert.equal(f.run.retired,true);assert.equal(f.run.ended,true);assert.equal(f.run.hearts,3);
  assert.equal(f.profile.best,700);assert.equal(f.profile.bones,12);assert.equal(f.profile.collection.gifts,1);
  assert.equal(f.profile.challenges,1);assert.equal(f.run.receipt.missionCount,1);
  assert.equal(f.run.ziplines,0);assert.deepEqual(f.run.regionalCourses,[0,0,0]);
  const snapshot=JSON.stringify(f.profile),distance=f.run.distance;
  step(f.run,1);assert.equal(f.run.distance,distance);
  f.click();assert.equal(f.context.state,'menu');assert.equal(JSON.stringify(f.profile),snapshot);
  bankRun(f.profile,f.run,f.run.missions);assert.equal(JSON.stringify(f.profile),snapshot);
});
test('practice and ordinary camp navigation never cash out a run',()=>{
  for(const [state,practice] of [['paused',true],['help',false],['shop',false],['kennel',false],['ended',false]]) {
    const f=fixture(state,practice);const before=JSON.stringify(f.profile);f.click();
    assert.equal(f.context.state,'menu');assert.equal(f.run.retired,undefined);
    assert.equal(JSON.stringify(f.profile),before);
  }
});
test('voluntary finish offers a break instead of blaming an earlier collision',()=>{
  assert.match(runLesson({retired:true,lastMistake:{type:'gap'}}),/deserve a break/);
  assert.match(runLesson({lastMistake:{type:'gap'}}),/Missed a broken/);
});
