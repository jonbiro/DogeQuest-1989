import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
function fixture(modern) {
  const listeners=new Map(),state={value:'playing',pauses:0,audioStops:0};
  const context={
    window:{addEventListener:(name,callback)=>listeners.set(name,callback),
      screen:modern?{orientation:{addEventListener:(name,callback)=>listeners.set(`screen:${name}`,callback)}}:{}},
    audio:{},stopSound:()=>state.audioStops++,showOverlay:next=>{state.value=next;state.pauses++;},
    document:{hidden:false,addEventListener:(name,callback)=>listeners.set(`document:${name}`,callback)},
    focusOverlay:()=>state.focuses=(state.focuses||0)+1,
  };
  Object.defineProperty(context,'state',{get:()=>state.value});
  const pause=source.slice(source.indexOf('function pause() {'),source.indexOf('function resume() {'));
  const bindings=source.slice(source.indexOf(`window.addEventListener("blur", () => pause('background'));`),source.indexOf('$("scene").addEventListener("webglcontextlost"'));
  context.pauseReason='manual';
  runInNewContext(pause+bindings,context);
  return {state,listeners,context};
}
test('device rotation pauses the active run once, without binding ordinary resize',()=>{
  for(const modern of [true,false]) {
    const f=fixture(modern),event=modern?'screen:change':'orientationchange';
    assert.equal(f.listeners.has('resize'),false);
    assert.equal(f.listeners.has(modern?'orientationchange':'screen:change'),false);
    f.listeners.get(event)();
    assert.equal(f.state.value,'paused');assert.equal(f.state.pauses,1);
    assert.equal(f.context.pauseReason,'rotation');
    assert.equal(f.state.audioStops,1);
    f.listeners.get(event)();assert.equal(f.state.pauses,1,'another rotation cannot resume or reopen the run');
  }
});
test('browser lifecycle interruptions record an actionable pause reason',()=>{
  const f=fixture(true);
  f.listeners.get('blur')();
  assert.equal(f.context.pauseReason,'background');
  f.state.value='playing';
  f.listeners.get('pagehide')();
  assert.equal(f.context.pauseReason,'background');
  f.state.value='playing';
  f.listeners.get('screen:change')();
  assert.equal(f.context.pauseReason,'rotation');
});
test('mobile page freeze pauses safely and refocuses the recovery action on return',()=>{
  const f=fixture(true);
  f.listeners.get('freeze')();
  assert.equal(f.state.value,'paused');
  assert.equal(f.context.pauseReason,'background');
  f.context.document.hidden=true;
  f.listeners.get('resume')();
  assert.equal(f.state.focuses||0,0,'a hidden page cannot steal focus');
  f.context.document.hidden=false;
  f.listeners.get('document:visibilitychange')();
  assert.equal(f.state.focuses,1,'returning to a paused run restores the action target');
  f.listeners.get('pageshow')({persisted:false});
  assert.equal(f.state.focuses,2,'bfcache restore also restores the action target');
});
test('a persisted page restore cannot resume an unpaused run behind the browser chrome',()=>{
  const f=fixture(true);
  f.listeners.get('pageshow')({persisted:true});
  assert.equal(f.state.value,'paused');
  assert.equal(f.context.pauseReason,'background');
  assert.equal(f.state.focuses,1);
});
test('rotating in camp, results, or another panel does not replace that screen',()=>{
  for(const value of ['menu','ended','help','shop','kennel','paused']) {
    const f=fixture(true);f.state.value=value;f.listeners.get('screen:change')();
    assert.equal(f.state.value,value);assert.equal(f.state.pauses,0);
  }
});
