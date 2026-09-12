import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {createRun} from '../src/runner/world.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';
import {missionPackFor} from '../src/runner/missions.js';

function fixture(state,practice=false,storageAvailable=true) {
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function graphicsError()'),end=source.indexOf('let view;',start);
  const nodes={};
  const run=createRun(1989);
  Object.assign(run,{score:700,distance:610,bones:12,gifts:1,missions:missionPackFor(0)});
  if(practice)run.practice={};
  const profile={best:0,distance:0,bones:0,credits:0,challenges:0,collection:collectionFrom()};
  let finishes=0;
  const context={run,state,storageAvailable,audio:null,graphicsReady:true,
    $:id=>nodes[id]??(nodes[id]={}),window:{location:{reload:()=>{}}},
    showOverlay:value=>{context.state=value;},
    finish:()=>{finishes++;bankRun(profile,run,run.missions);context.state='ended';}};
  runInNewContext(source.slice(start,end),context);
  return {context,run,profile,nodes,finishes:()=>finishes};
}
test('graphics interruption banks active and paused adventures exactly once',()=>{
  for(const state of ['playing','paused']) {
    const f=fixture(state);f.context.graphicsError();
    assert.equal(f.run.ended,true);assert.equal(f.run.graphicsRescued,true);
    assert.equal(f.profile.best,700);assert.equal(f.profile.bones,12);
    assert.equal(f.profile.collection.gifts,1);assert.equal(f.profile.challenges,1);
    assert.match(f.nodes['overlay-copy'].textContent,/were saved/);
    const saved=JSON.stringify(f.profile);
    f.context.graphicsError();
    assert.equal(JSON.stringify(f.profile),saved);assert.equal(f.finishes(),1);
    assert.equal(f.context.state,'graphics-error');assert.equal(f.nodes.play.disabled,true);
  }
});
test('graphics failures do not bank practice or inactive runs and never promise unavailable storage',()=>{
  for(const [state,practice] of [['playing',true],['paused',true],['menu',false],['ended',false],['help',false]]) {
    const f=fixture(state,practice);const before=JSON.stringify(f.profile);
    f.context.graphicsError();assert.equal(JSON.stringify(f.profile),before);assert.equal(f.finishes(),0);
  }
  const f=fixture('playing',false,false);f.context.graphicsError();
  assert.match(f.nodes['overlay-copy'].textContent,/saving is unavailable/);
  assert.doesNotMatch(f.nodes['overlay-copy'].textContent,/were saved/);
});
