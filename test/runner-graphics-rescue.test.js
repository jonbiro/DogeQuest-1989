import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {createRun} from '../src/runner/world.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';
import {missionPackFor} from '../src/runner/missions.js';
import {graphicsFailureKind,graphicsFailureCopy,graphicsDiagnostic} from '../src/runner/graphics-failure.js';

function fixture(state,practice=false,storageAvailable=true,mobile=false) {
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  // Anchor on the declaration, not one exact arity, so adding a parameter to
  // the recovery entry point does not silently slice the wrong region.
  const start=source.indexOf('function graphicsError('),end=source.indexOf('let view;',start);
  assert.ok(start>=0&&end>start,'the graphics recovery region is still extractable');
  const nodes={};
  const run=createRun(1989);
  Object.assign(run,{score:700,distance:610,bones:12,gifts:1,missions:missionPackFor(0)});
  if(practice)run.practice={};
  const profile={best:0,distance:0,bones:0,credits:0,challenges:0,collection:collectionFrom()};
  let finishes=0;
  const context={run,state,storageAvailable,audio:null,graphicsReady:true,
    graphicsFailureKind,graphicsFailureCopy,graphicsDiagnostic,
    $:id=>nodes[id]??(nodes[id]={}),window:{location:{reload:()=>{}},matchMedia:()=>({matches:mobile})},
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
test('mobile graphics recovery gives device-safe restart guidance',()=>{
  const f=fixture('menu',false,true,true);
  f.context.graphicsError('no-context',new Error('WebGL2 unavailable'));
  assert.equal(f.nodes['graphics-desktop-help'].hidden,true);
  assert.equal(f.nodes['graphics-mobile-help'].hidden,false);
  assert.equal(f.nodes['graphics-restart-help'].hidden,true);
  assert.equal(f.nodes['graphics-context-help'].hidden,true);
  assert.match(f.nodes['overlay-title'].textContent,/3D could not start/);
  assert.match(f.nodes['overlay-copy'].textContent,/Close other games or 3D-heavy tabs/);
  assert.match(f.nodes['graphics-diagnostic'].textContent,/no-context.*WebGL2 unavailable/);
});

test('the rescue screen reports a browser context loss without guessing about RAM',()=>{
  const f=fixture('menu',false,true,true);
  f.context.graphicsError('context-lost',{
    statusMessage:'WebGL context lost',
    lastInput:{action:'jump',source:'touch'},
  });
  assert.equal(f.nodes['graphics-desktop-help'].hidden,true);
  assert.equal(f.nodes['graphics-mobile-help'].hidden,true);
  assert.equal(f.nodes['graphics-restart-help'].hidden,true);
  assert.equal(f.nodes['graphics-context-help'].hidden,false);
  assert.match(f.nodes['overlay-title'].textContent,/lost 3D context/);
  assert.match(f.nodes['overlay-copy'].textContent,/does not prove the phone ran out of RAM/);
  assert.match(f.nodes['graphics-diagnostic'].textContent,/Cause: context-lost after jump.*WebGL context lost/);
  assert.equal(f.nodes['overlay-primary'].textContent,'Restart trail');
});

test('failure categories and diagnostics preserve the originating subsystem',()=>{
  assert.equal(graphicsFailureKind('no-context'),'startup');
  assert.equal(graphicsFailureKind('context-lost'),'context');
  assert.equal(graphicsFailureKind('render-error'),'runtime');
  assert.equal(graphicsFailureKind('input-error'),'input');
  assert.equal(graphicsFailureKind('not-a-real-reason'),'unknown');
  const error=Object.assign(new Error('swipe pose failed'),{stack:'at game.js:424:9'});
  assert.match(graphicsDiagnostic('input-error',Object.assign(error,{lastInput:{action:'slide'}})),/input-error after slide · Error: swipe pose failed \(game.js:424\)/);
  assert.equal(graphicsFailureCopy('context-lost').help,'context');
  assert.match(graphicsFailureCopy('context-lost').lead,/does not prove/);
});

test('a swipe failure identifies the action that opened recovery',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function invokeAction(');
  const end=source.indexOf('function performTouchAction',start);
  assert.ok(start>=0&&end>start,'the guarded action dispatcher is still extractable');
  let reason=null;
  let thrown=null;
  const context={
    run:{},
    lastInput:null,
    act(){throw new Error('turn pose failed');},
    graphicsError(nextReason,error){reason=nextReason;thrown=error;},
  };
  runInNewContext(`${source.slice(start,end)};invokeAction('right','touch');`,context);
  assert.equal(reason,'input-error');
  assert.equal(thrown.lastInput.action,'right');
  assert.equal(thrown.lastInput.source,'touch');
  assert.match(graphicsDiagnostic(reason,thrown),/input-error after right.*turn pose failed/);
});

test('a runtime failure uses restart guidance and exposes its diagnostic',()=>{
  const f=fixture('playing');
  f.context.graphicsError('render-error',Object.assign(new Error('draw exploded'),{stack:'at game.js:88:2'}));
  assert.equal(f.nodes['graphics-restart-help'].hidden,false);
  assert.equal(f.nodes['graphics-context-help'].hidden,true);
  assert.match(f.nodes['overlay-title'].textContent,/unexpected snag/);
  assert.match(f.nodes['overlay-copy'].textContent,/not evidence that your phone ran out of RAM/);
  assert.match(f.nodes['graphics-diagnostic'].textContent,/render-error · Error: draw exploded \(game.js:88\)/);
  assert.equal(f.nodes['overlay-primary'].textContent,'Start again');
});

test('recovery still exposes a retry when banking the interrupted run throws',()=>{
  const f=fixture('playing');
  f.context.finish=()=>{throw new Error('storage path interrupted');};
  assert.doesNotThrow(()=>f.context.graphicsError());
  assert.equal(f.run.graphicsRescued,false);
  assert.equal(f.context.state,'graphics-error');
  assert.equal(f.nodes.play.disabled,true);
});
