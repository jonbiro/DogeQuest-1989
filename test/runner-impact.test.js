import test from 'node:test';
import assert from 'node:assert/strict';
import {act,createRun,step} from '../src/runner/world.js';
import {effectColor} from '../src/runner/impact-color.js';

test('a real collision emits one local impact, distinguishes shields and expires',()=>{
  for(const shield of [0,1]){
    const run=createRun(1989);
    Object.assign(run,{objects:[{id:1,type:'rock',lane:1,at:0}],nextRow:Infinity,nextChoice:Infinity,nextZipline:Infinity,shield});
    for(let i=0;i<4;i++)step(run,1/120);
    const type=shield?'shield-break':'hit';
    assert.equal(run.hearts,shield?3:2);
    assert.equal(run.effects.length,1);
    assert.equal(run.effects[0].type,type);
    assert.equal(run.effects[0].x,run.x);
    assert.equal(run.effects[0].y,.75);
    run.objects.push({id:2,type:'rock',lane:1,at:run.distance});
    for(let i=0;i<4;i++)step(run,1/120);
    assert.equal(run.effects.length,1,'recovery cannot emit additional fake hits');
    for(let i=0;i<60;i++)step(run,1/120);
    assert.equal(run.effects.length,0);
  }
});

test('impact colors distinguish damage, shield rescue and ordinary bone rewards',()=>{
  assert.equal(new Set(['hit','shield-break','bone'].map(effectColor)).size,3);
  assert.equal(effectColor('shield-break'),effectColor('shield'));
  assert.equal(effectColor('magnet'),effectColor('fetch'));
  assert.equal(effectColor('unknown'),effectColor('bone'));
});

test('jump and landing emit timestamped local feedback without changing physics',()=>{
  const run=createRun(1989);
  run.objects=[];run.nextRow=Infinity;run.nextChoice=Infinity;run.nextZipline=Infinity;
  const startingY=run.y;
  run.events=[];
  act(run,'jump');
  assert.equal(run.y,startingY);
  assert.equal(run.effects.length,1);
  assert.equal(run.effects[0].type,'jump');
  for(let i=0;i<120&&!run.landing;i++)step(run,1/120);
  assert.ok(run.landing);
  assert.ok(run.effects.some(effect=>effect.type==='land'));
  assert.equal(run.landing.speed>0,true);
});
