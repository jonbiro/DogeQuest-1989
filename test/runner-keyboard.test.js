import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

function fixture() {
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('const keyActions = {');
  const end=source.indexOf('let pointer = null;',start);
  const actions=[],document={activeElement:{closest:()=>null}};
  let handler;
  const context={document,window:{addEventListener:(_,fn)=>{handler=fn;}},
    state:'playing',run:{},$:()=>({hidden:true}),act:(_,action)=>actions.push(action),
    pause:()=>actions.push('pause'),resume:()=>actions.push('resume')};
  runInNewContext(source.slice(start,end),context);
  return {actions,document,press(overrides={}){let prevented=false;handler({code:'Space',key:' ',preventDefault(){prevented=true;},...overrides});return prevented;}};
}
test('Space respects a focused action button instead of forcing a jump',()=>{
  const f=fixture();
  assert.equal(f.press(),true);assert.deepEqual(f.actions,['jump']);
  for(const action of ['slide','fetch','left','right','jump']) {
    f.document.activeElement={closest:()=>({dataset:{action}})};
    assert.equal(f.press(),false,'native button activation remains available');
  }
  assert.deepEqual(f.actions,['jump'],'the shortcut does not double-trigger a focused control');
});
test('browser shortcuts and composition do not trigger gameplay or pause',()=>{
  const f=fixture();
  for(const modifier of ['ctrlKey','metaKey','altKey','isComposing','defaultPrevented']) {
    for(const code of ['KeyW','ArrowLeft','Space','Escape']) assert.equal(f.press({code,[modifier]:true}),false);
  }
  assert.deepEqual(f.actions,[]);
  f.press({code:'ArrowLeft'});f.press({code:'Escape'});
  assert.deepEqual(f.actions,['left','pause']);
});
test('Space leaves focused pause, audio and other native controls to their own activation',()=>{
  const f=fixture();
  for(const tag of ['button','input','select','textarea','summary','a']) {
    f.document.activeElement={closest:selector=>selector.split(',').includes(tag)?{tagName:tag.toUpperCase()}:null};
    assert.equal(f.press(),false,`${tag}: preserve native Space handling`);
  }
  assert.deepEqual(f.actions,[],'focusing an ordinary control must not add a jump');
});

test('held native action-button keys cannot repeat lane changes or extend slides',()=>{
  const f=fixture();
  for(const action of ['left','right','jump','slide','fetch']) {
    f.document.activeElement={closest:selector=>selector.includes('button')?{dataset:{action}}:null};
    for(const code of ['Enter','Space']) {
      assert.equal(f.press({code,repeat:false}),false,'first press keeps native activation');
      for(let repeat=0;repeat<8;repeat++)assert.equal(f.press({code,repeat:true}),true,'suppress native repeat');
      assert.equal(f.press({code,repeat:false}),false,'a new physical press remains available');
    }
  }
  assert.deepEqual(f.actions,[],'native controls retain ownership of their first activation');
});

test('repeat protection is scoped to action buttons, leaving ordinary controls alone',()=>{
  const f=fixture();
  f.document.activeElement={closest:selector=>selector==='button[data-action]'?null:{tagName:'BUTTON'}};
  for(const code of ['Enter','Space'])assert.equal(f.press({code,repeat:true}),false);
  f.document.activeElement={closest:()=>null};
  for(const code of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyF']) {
    assert.equal(f.press({code,repeat:true}),true);
  }
  assert.deepEqual(f.actions,[]);
});
