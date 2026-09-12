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
