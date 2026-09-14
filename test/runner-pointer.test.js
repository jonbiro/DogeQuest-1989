import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {URL} from 'node:url';
import {canStartSwipe,canPressAction,ownsSwipe,isJumpTap,swipeAction,tapAction} from '../src/runner/gestures.js';

test('track listeners ignore holds but keep taps and deliberate swipes responsive',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  assert.ok(start>=0 && end>start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
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
  handlers.pointerdown(contact);
  handlers.pointermove({...contact,clientX:88,clientY:84,timeStamp:150});
  assert.equal(actions.length,2,'a thumb arc waits for more direction while moving');
  handlers.pointerup({...contact,clientX:88,clientY:84,timeStamp:180});
  assert.deepEqual(actions,['jump','right','right'],'release resolves the dominant axis exactly once');
  handlers.pointerup({...contact,clientX:88,clientY:84,timeStamp:190});
  assert.equal(actions.length,3);
});

test('ambiguous touch releases leave a dock recovery cue and clear on retry',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[],run={};
  const scene={clientWidth:390,addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run,
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:80,clientY:80,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:112,clientY:112,timeStamp:140});
  handlers.pointerup({...touch,clientX:112,clientY:112,timeStamp:200});
  assert.deepEqual(actions,[],'a near-equal diagonal remains intentionally uncommitted');
  assert.equal(run.touchFeedback,'ONE DIRECTION AT A TIME · TRY AGAIN',
    'an ambiguous release explains the next move beside the controls');
  handlers.pointerdown({...touch,pointerId:2,timeStamp:300});
  assert.equal(run.touchFeedback,'','a fresh touch clears stale recovery copy');
  handlers.pointerup({...touch,pointerId:2,timeStamp:700});
  assert.equal(run.touchFeedback,'TAP QUICKLY · OR USE THE BIG BUTTONS',
    'a held tap explains the faster tap or button fallback');
});

test('a held horizontal drag can cross lanes one paused segment at a time without lifting',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  const handlers={},actions=[],run={};
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run,
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  // A held drag moves again after the thumb stops for a beat; the player does
  // not need to lift between lane moves.
  handlers.pointermove({...touch,clientX:120,timeStamp:180});
  handlers.pointermove({...touch,clientX:150,timeStamp:360});
  assert.deepEqual(actions,['right','right'],'continuous drag accepts the next lane snap');
  handlers.pointermove({...touch,clientX:180,timeStamp:420});
  handlers.pointermove({...touch,clientX:198,timeStamp:540});
  assert.deepEqual(actions,['right','right','right'],'a third snap is accepted after a brief pause');
  handlers.pointermove({...touch,clientX:150,timeStamp:660});
  assert.deepEqual(actions,['right','right','right','left'],'continued drag changes direction naturally');
});

test('a continuous held drag stays bounded until the thumb pauses',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[],run={};
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run,
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  // Keep samples frequent enough that the thumb crosses several segments.
  // Each threshold can produce only one action, so a long path cannot skip
  // multiple lanes in one browser event.
  for (const [clientX,timeStamp] of [[110,180],[140,240],[170,300],[200,360],[230,420]])
    handlers.pointermove({...touch,clientX,timeStamp});
  assert.deepEqual(actions,['right'],'continuous movement cannot repeat a lane move');
  handlers.pointermove({...touch,clientX:260,timeStamp:500});
  assert.deepEqual(actions,['right'],'a continuous over-swipe remains bounded');
  handlers.pointermove({...touch,clientX:310,timeStamp:620});
  assert.deepEqual(actions,['right','right'],'one paused follow-up segment is accepted');
  handlers.pointerup({...touch,clientX:310,timeStamp:820});
  assert.equal(run.touchOverdrag,false,'the accepted segment clears over-drag guidance');
});

test('a held drag resumes after a silent interval without a lift',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  assert.deepEqual(actions,['right']);
  // There is no pointermove while the thumb rests. The next sample still
  // starts another same-direction segment from the last accepted snap.
  handlers.pointermove({...touch,clientX:140,timeStamp:500});
  assert.deepEqual(actions,['right','right']);
  handlers.pointerup({...touch,clientX:140,timeStamp:520});
});

test('resting-thumb jitter does not erase the quiet gap for a held drag',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  // A resting thumb can wobble by a few CSS pixels. Those samples should not
  // make the player lift and re-touch just to re-arm the next lane move.
  for (const [clientX,timeStamp] of [[84,150],[87,180],[89,220],[90,250]])
    handlers.pointermove({...touch,clientX,timeStamp});
  handlers.pointermove({...touch,clientX:140,timeStamp:320});
  assert.deepEqual(actions,['right','right'],'meaningful movement after a jittery pause re-arms the held drag');
});

test('a coalesced giant first swipe remains one bounded snap',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[],run={};
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run,
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:260,timeStamp:140});
  handlers.pointerup({...touch,clientX:260,timeStamp:180});
  assert.deepEqual(actions,['right'],'one coalesced sample cannot throw the puppy across lanes');
  assert.equal(run.touchOverdrag,true,'a giant first sample receives held-drag guidance');
});

test('a clear reverse segment re-arms a held swipe without requiring a lift',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  handlers.pointermove({...touch,clientX:130,timeStamp:160});
  // The thumb reverses by a short, distinct segment. It is accepted without
  // lifting, while the timing guard filters a near-instant wobble.
  handlers.pointermove({...touch,clientX:98,timeStamp:240});
  assert.deepEqual(actions,['right','left']);
});

test('a gradual reverse accumulates across sampled touch moves',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  // A normal phone samples the return path in small increments. The total
  // opposite travel is deliberate even though no individual step is 28px.
  handlers.pointermove({...touch,clientX:76,timeStamp:150});
  handlers.pointermove({...touch,clientX:68,timeStamp:190});
  handlers.pointermove({...touch,clientX:58,timeStamp:230});
  handlers.pointermove({...touch,clientX:50,timeStamp:270});
  assert.deepEqual(actions,['right','left'],'a sampled no-lift reversal is one clear move');
});

test('a large reverse recovers immediately after an overdrag',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  // The browser may coalesce a thumb's return into one large reverse sample.
  // It should still feel like one deliberate opposite swipe, not a stuck drag.
  handlers.pointermove({...touch,clientX:300,timeStamp:140});
  handlers.pointermove({...touch,clientX:90,timeStamp:150});
  assert.deepEqual(actions,['right','left']);
});

test('a quick post-snap wobble does not reverse a held swipe',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  handlers.pointermove({...touch,clientX:50,timeStamp:140});
  assert.deepEqual(actions,['right'],'a fast wobble remains the original one-lane move');
});

test('a fast overlong thumb drag waits briefly before a second snap',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  handlers.pointermove({...touch,clientX:180,timeStamp:150});
  handlers.pointerup({...touch,clientX:180,timeStamp:160});
  assert.deepEqual(actions,['right'],'a quick overlong drag still commits just one lane');
});

test('rapid sampled over-swipes do not auto-walk across lanes',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[],run={};
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run,
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  // Frequent browser samples represent one fast thumb stroke. The first
  // lane is accepted; later samples are either inside the pause guard or are
  // rebased as an over-drag, so the stroke cannot walk across the trail.
  for (const [clientX,timeStamp] of [[130,136],[178,152],[226,168],[274,184]])
    handlers.pointermove({...touch,clientX,timeStamp});
  handlers.pointerup({...touch,clientX:274,timeStamp:220});
  assert.deepEqual(actions,['right'],'a quick long stroke remains one lane');
  assert.equal(run.touchOverdrag,true,'the player receives the held-drag recovery hint');
});

test('a sparse release can finish one trailing held-drag segment',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  // No intermediate pointermove arrives for the rest of the thumb path.
  handlers.pointerup({...touch,clientX:150,timeStamp:220});
  assert.deepEqual(actions,['right','right'],'pointerup consumes one trailing same-direction segment');
});

test('an oversized second touch segment is bounded but can continue after rebasing',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[],run={};
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run,
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  // A coalesced second sample is much larger than a thumb-width. Rebase it
  // instead of turning one over-drag into two lane changes.
  handlers.pointermove({...touch,clientX:180,timeStamp:180});
  assert.deepEqual(actions,['right']);
  assert.equal(run.touchOverdrag,true,'the touch coach calls out the oversized segment');
  // A normal follow-up segment continues the held drag without a lift.
  handlers.pointermove({...touch,clientX:230,timeStamp:300});
  assert.deepEqual(actions,['right','right']);
  handlers.pointerup({...touch,clientX:230,timeStamp:320});
});

test('an overshot horizontal drag can switch to a jump from its resting point',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerId:1,button:0,isPrimary:true,clientX:50,clientY:120,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:82,timeStamp:120});
  handlers.pointermove({...touch,clientX:180,timeStamp:160});
  handlers.pointermove({...touch,clientX:180,timeStamp:300});
  handlers.pointermove({...touch,clientX:180,clientY:60,timeStamp:360});
  handlers.pointerup({...touch,clientX:180,clientY:60,timeStamp:380});
  assert.deepEqual(actions,['right','jump'],'vertical intent wins after a horizontal overshoot and pause');
});

test('a held vertical drag remains a single jump or slide action',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerId:1,button:0,isPrimary:true,clientX:80,clientY:120,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientY:82,timeStamp:120});
  handlers.pointermove({...touch,clientY:20,timeStamp:140});
  handlers.pointerup({...touch,clientY:20,timeStamp:160});
  assert.deepEqual(actions,['jump'],'a long held vertical gesture cannot repeat jump');
});

test('a held gesture can deliberately switch axes without lifting',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerId:1,button:0,isPrimary:true,clientX:80,clientY:120,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientY:82,timeStamp:120});
  // A clear horizontal segment after the jump is a new move, not a second
  // jump, even though the same finger is still down.
  handlers.pointermove({...touch,clientX:120,clientY:82,timeStamp:130});
  handlers.pointermove({...touch,clientX:124,clientY:82,timeStamp:220});
  handlers.pointermove({...touch,clientX:124,clientY:82,timeStamp:340});
  handlers.pointermove({...touch,clientX:180,clientY:82,timeStamp:500});
  handlers.pointerup({...touch,clientX:180,clientY:82,timeStamp:520});
  assert.deepEqual(actions,['jump','right','right']);

  actions.length=0;
  handlers.pointerdown({...touch,pointerId:2,clientX:50,clientY:50,timeStamp:500});
  handlers.pointermove({...touch,pointerId:2,clientX:90,clientY:50,timeStamp:520});
  // The reverse transition works too: a deliberate vertical segment after a
  // lane move can slide/jump without requiring a release and re-touch.
  handlers.pointermove({...touch,pointerId:2,clientX:90,clientY:10,timeStamp:530});
  assert.deepEqual(actions,['right','jump']);
});

test('released thumb arcs resolve all four directions but not near-equal diagonals or tiny gestures',()=>{
  for (const [dx,dy,action] of [[40,34,'right'],[-40,34,'left'],[34,40,'slide'],[34,-40,'jump']]) {
    assert.equal(swipeAction(dx,dy),action);
    assert.equal(swipeAction(dx,dy,true),action);
  }
  for (const [dx,dy] of [[40,40],[40,38],[-40,38],[38,-40],[23,0],[0,-23]])
    assert.equal(swipeAction(dx,dy,true),null);
  assert.equal(swipeAction(40,10),'right','clear swipes still trigger immediately');
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

test('touch taps offer forgiving edge steering while center taps still jump',()=>{
  const left={x:40,y:400,started:100,travel:0};
  const right={x:350,y:400,started:100,travel:0};
  const centre={x:195,y:400,started:100,travel:0};
  assert.equal(tapAction(left,{clientX:40,clientY:400,timeStamp:200},390,true),'left');
  assert.equal(tapAction(right,{clientX:350,clientY:400,timeStamp:200},390,true),'right');
  assert.equal(tapAction(centre,{clientX:195,clientY:400,timeStamp:200},390,true),'jump');
  assert.equal(tapAction(left,{clientX:40,clientY:400,timeStamp:200},390,false),'jump');
  assert.equal(tapAction({...left,travel:28},{clientX:40,clientY:400,timeStamp:200},390,true),null);
  assert.equal(tapAction({x:77,y:400,started:100,travel:0},{clientX:80,clientY:400,timeStamp:200},390,true),'left','small release drift keeps the edge intent');
  assert.equal(tapAction({x:313,y:400,started:100,travel:0},{clientX:310,clientY:400,timeStamp:200},390,true),'right','small release drift keeps the opposite edge intent');
});

test('the live pointer listener maps a touch edge tap without changing desktop taps',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  const handlers={},actions=[];
  const scene={clientWidth:390,addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,tapAction,swipeAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:36,clientY:500,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointerup({...touch,timeStamp:200});
  assert.deepEqual(actions,['left']);
  handlers.pointerdown({...touch,pointerId:2,pointerType:'mouse'});
  handlers.pointerup({...touch,pointerId:2,pointerType:'mouse',timeStamp:200});
  assert.deepEqual(actions,['left','jump']);
});

test('a touch attempt at the lane edge leaves a localized recovery cue',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[],run={lane:0,turnAttempt:null};
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run,
    act:(_,action)=>{actions.push(action);if(action==='left')run.lane=Math.max(0,run.lane-1);if(action==='right')run.lane=Math.min(2,run.lane+1);},
    canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:110,clientY:120,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:76,timeStamp:140});
  assert.deepEqual(actions,['left']);
  assert.equal(run.touchFeedback,'AT THE EDGE · TRY THE OTHER WAY');
});

test('the touch coach learns swipe vocabulary only after a touch swipe',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]")',start);
  const handlers={},actions=[],run={};
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run,
    act:(_,action)=>actions.push(action),canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const touch={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:84,timeStamp:140});
  assert.equal(run.touchSwipeSeen,true);
  assert.deepEqual(actions,['right']);
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

test('action buttons support a second thumb while rejecting alternate mouse buttons and duplicate clicks',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))');
  const end=source.indexOf('window.addEventListener("blur", pause);',start);
  assert.ok(start>=0 && end>start,'actual action-button listener block exists');
  const button={dataset:{action:'jump'}};
  const actions=[];
  const context={document:{querySelectorAll:()=>[button]},state:'playing',pointer:null,
    canPressAction,run:{},act:(_,action)=>actions.push(action)};
  context.performTouchAction=action=>context.act(context.run,action);
  runInNewContext(source.slice(start,end),context);
  const press=overrides=>button.onpointerdown({button:0,isPrimary:true,preventDefault(){},...overrides});
  press({button:2});
  press({button:1});
  press({isPrimary:false});
  assert.deepEqual(actions,[]);
  context.pointer={id:7};
  press({isPrimary:false,pointerType:'touch'});
  assert.equal(context.pointer,null,'explicit controls cancel an unfinished trail tap');
  button.onclick({detail:1});
  assert.deepEqual(actions,['jump'],'pointer click does not double-trigger');
  button.onclick({detail:0});
  assert.deepEqual(actions,['jump','jump'],'keyboard click still works');
  context.state='paused';
  press({});
  button.onclick({detail:0});
  assert.equal(actions.length,2,'paused buttons cannot move the dog');
});

test('two-thumb buttons combine steering and jumping without a phantom trail release',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('window.addEventListener("blur", pause);',start);
  const buttons=['left','jump','slide'].map(action=>({dataset:{action}}));
  const handlers={},actions=[];
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  runInNewContext(source.slice(start,end),{$:()=>scene,state:'playing',run:{},
    document:{querySelectorAll:()=>buttons},act:(_,action)=>actions.push(action),
    canStartSwipe,canPressAction,ownsSwipe,isJumpTap,swipeAction,tapAction});
  const first={pointerType:'touch',pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100,preventDefault(){}};
  const second={...first,pointerId:2,isPrimary:false};
  buttons[0].onpointerdown(first);
  buttons[1].onpointerdown(second);
  buttons[1].onclick({detail:1});
  assert.deepEqual(actions,['left','jump']);
  handlers.pointerdown(first);
  buttons[2].onpointerdown(second);
  handlers.pointermove({...first,clientX:100,timeStamp:150});
  handlers.pointerup({...first,timeStamp:200});
  assert.deepEqual(actions,['left','jump','slide'],'the old trail finger cannot add a swipe or tap after a button');
  handlers.pointerdown(second);
  handlers.pointerup({...second,timeStamp:200});
  assert.equal(actions.length,3,'secondary fingers still cannot initiate trail gestures');
  handlers.pointerdown(first);
  handlers.pointerup({...first,timeStamp:200});
  assert.deepEqual(actions,['left','jump','slide','jump'],'the next deliberate trail tap still works');
});

test('browser cancellation pauses only the owned gesture and cannot replay it after resume',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('let pointer = null;');
  const end=source.indexOf('for (const button of document.querySelectorAll("[data-action]"))',start);
  const handlers={},actions=[];let pauses=0;
  const scene={addEventListener:(name,fn)=>{handlers[name]=fn;},setPointerCapture(){}};
  const context={$:()=>scene,state:'playing',run:{},act:(_,a)=>actions.push(a),
    canStartSwipe,ownsSwipe,isJumpTap,swipeAction,tapAction,pause(){pauses++;context.state='paused';}};
  runInNewContext(source.slice(start,end),context);
  const touch={pointerId:1,button:0,isPrimary:true,clientX:50,clientY:50,timeStamp:100};
  handlers.pointerdown(touch);
  handlers.pointercancel({...touch,pointerId:2});
  assert.equal(pauses,0,'a second finger must not interrupt the owner');
  handlers.pointercancel(touch);
  assert.equal(pauses,1);
  context.state='playing';
  handlers.pointermove({...touch,clientX:100});
  handlers.pointerup({...touch,timeStamp:200});
  assert.deepEqual(actions,[],'cancelled touch cannot act after resume');
  handlers.pointerdown(touch);
  handlers.pointerup({...touch,timeStamp:200});
  handlers.lostpointercapture(touch);
  assert.deepEqual(actions,['jump']);
  assert.equal(pauses,1,'ordinary release does not pause');
  handlers.pointerdown(touch);
  handlers.pointermove({...touch,clientX:100});
  handlers.pointercancel(touch);
  assert.deepEqual(actions,['jump','right'],'already accepted swipe stays single');
  assert.equal(pauses,2,'interruption also pauses an already committed gesture');
  context.state='playing';
  handlers.pointerdown(touch);
  handlers.lostpointercapture({...touch,pointerId:2});
  assert.equal(pauses,2,'unrelated capture loss is ignored');
  handlers.lostpointercapture(touch);
  assert.equal(pauses,3,'unexpected capture loss pauses the owned touch');
  context.state='playing';
  handlers.pointerup({...touch,timeStamp:200});
  assert.deepEqual(actions,['jump','right'],'lost capture cannot create a delayed tap');
  scene.setPointerCapture=()=>{throw Error('pointer no longer active');};
  handlers.pointerdown(touch);
  assert.equal(pauses,4,'capture failure pauses without throwing or retaining a finger');
  context.state='playing';scene.setPointerCapture=()=>{};
  handlers.pointerdown(touch);handlers.pointerup({...touch,timeStamp:200});
  assert.deepEqual(actions,['jump','right','jump'],'a fresh gesture still works after capture failure');
});
