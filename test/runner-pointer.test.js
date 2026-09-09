import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {URL} from 'node:url';
import {canStartSwipe,ownsSwipe} from '../src/runner/gestures.js';

test('only a primary contact or left mouse button may begin a free swipe',()=>{
  assert.equal(canStartSwipe({button:0,isPrimary:true},null),true);
  assert.equal(canStartSwipe({button:2,isPrimary:true},null),false);
  assert.equal(canStartSwipe({button:1,isPrimary:true},null),false);
  assert.equal(canStartSwipe({button:0,isPrimary:false},null),false);
  assert.equal(canStartSwipe({button:0,isPrimary:true},{id:1}),false);
});

test('unrelated touch cancellation cannot clear the active swipe',()=>{
  const active={id:7,x:20,y:30};
  assert.equal(ownsSwipe({pointerId:8},active),false);
  assert.equal(ownsSwipe({pointerId:7},active),true);
  assert.equal(ownsSwipe({pointerId:7},null),false);
  assert.deepEqual(active,{id:7,x:20,y:30});
});

test('action buttons reject secondary pointers and preserve keyboard activation',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))');
  const end=source.indexOf('window.addEventListener("blur", pause);',start);
  assert.ok(start>=0 && end>start,'actual action-button listener block exists');
  const button={dataset:{action:'jump'}};
  const actions=[];
  const context={document:{querySelectorAll:()=>[button]},state:'playing',pointer:null,
    canStartSwipe,run:{},act:(_,action)=>actions.push(action)};
  runInNewContext(source.slice(start,end),context);
  const press=overrides=>button.onpointerdown({button:0,isPrimary:true,preventDefault(){},...overrides});
  press({button:2});
  press({button:1});
  press({isPrimary:false});
  context.pointer={id:7};
  press({});
  assert.deepEqual(actions,[]);
  context.pointer=null;
  press({});
  button.onclick({detail:1});
  assert.deepEqual(actions,['jump'],'pointer click does not double-trigger');
  button.onclick({detail:0});
  assert.deepEqual(actions,['jump','jump'],'keyboard click still works');
  context.state='paused';
  press({});
  button.onclick({detail:0});
  assert.equal(actions.length,2,'paused buttons cannot move the dog');
});
