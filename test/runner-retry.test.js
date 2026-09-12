import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {createRun, step} from '../src/runner/world.js';
import {missionPackFor} from '../src/runner/missions.js';

test('results retry repeats the seed with a fresh simulation; camp starts a new trail',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function start() {');
  const end=source.indexOf('function showOverlay(',start);
  assert.ok(start>=0 && end>start);
  const original=createRun(1989);
  original.hearts=0;original.ended=true;original.score=250;
  const context={run:original,state:'ended',graphicsReady:true,
    saved:{upgrades:{},collection:{puppy:'mochi'},challenges:0},
    createRun,Date:{now:()=>987654},missionPackFor,
    setText:()=>{},setState:value=>{context.state=value;},
    $:()=>({focus:()=>{}}),tone:()=>{}};
  runInNewContext(source.slice(start,end),context);
  context.start();
  assert.equal(context.run.seed,1989);
  assert.notEqual(context.run,original);
  assert.equal(context.run.hearts,3);
  assert.equal(context.run.score,0);
  assert.equal(context.run.ended,false);
  assert.equal(context.run.puppy,'mochi');
  assert.equal(context.state,'playing');
  const fresh=createRun(1989);
  assert.deepEqual(context.run.objects,fresh.objects);
  for(let frame=0;frame<600;frame++){
    step(context.run,1/120);step(fresh,1/120);
  }
  assert.deepEqual(context.run.objects,fresh.objects);
  for(const state of ['menu','help']){
    context.state=state;context.start();
    assert.equal(context.run.seed,987654);
  }
  context.run.practice={correct:3};
  context.state='ended';
  context.start();
  assert.equal(context.run.seed,987654,'practice completion starts a fresh adventure');
  assert.equal(context.run.practice,undefined);
});
