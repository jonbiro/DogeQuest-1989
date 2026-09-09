import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {URL} from 'node:url';
import {canStartSwipe,ownsSwipe,isJumpTap,swipeAction} from '../src/runner/gestures.js';

test('track listeners ignore holds but keep taps and deliberate swipes responsive',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  assert.ok(start>=0 && end>start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction});
  const contact={pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(contact);
  handlers.pointerup({...contact,timeStamp:2000});
  assert.deepEqual(actions,[]);
  handlers.pointerdown(contact);
  handlers.pointerup({...contact,timeStamp:200});
  assert.deepEqual(actions,['jump']);
  handlers.pointerdown(contact);
  handlers.pointermove({...contact,clientX:90,timeStamp:2000});
  handlers.pointerup({...contact,clientX:90,timeStamp:2100});
  assert.deepEqual(actions,['jump','right'],'long contact can still make a deliberate swipe, exactly once');
  handlers.pointerdown(contact);
  handlers.pointermove({...contact,clientX:80,clientY:80,timeStamp:150});
  handlers.pointerup({...contact,timeStamp:200});
  assert.equal(actions.length,2,'ambiguous out-and-back motion does not become a tap');
});

test('tap jumps require quick contact without a wandering drag',()=>{
  const pointer={x:50,y:50,started:100,travel:0};
  const release={clientX:52,clientY:48,timeStamp:250};
  assert.equal(isJumpTap(pointer,release),true);
  assert.equal(isJumpTap(pointer,{...release,timeStamp:450}),true);
  assert.equal(isJumpTap(pointer,{...release,timeStamp:451}),false);
  assert.equal(isJumpTap(pointer,{...release,timeStamp:99}),false);
  assert.equal(isJumpTap(pointer,{...release,clientX:74}),false);
  assert.equal(isJumpTap({...pointer,travel:30},release),false,'returning a diagonal drag to its origin is not a tap');
});

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
