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
  };
  Object.defineProperty(context,'state',{get:()=>state.value});
  const pause=source.slice(source.indexOf('function pause() {'),source.indexOf('function resume() {'));
  const bindings=source.slice(source.indexOf('window.addEventListener("blur", pause);'),source.indexOf('document.addEventListener("visibilitychange"'));
  runInNewContext(pause+bindings,context);
  return {state,listeners};
}
test('device rotation pauses the active run once, without binding ordinary resize',()=>{
  for(const modern of [true,false]) {
    const f=fixture(modern),event=modern?'screen:change':'orientationchange';
    assert.equal(f.listeners.has('resize'),false);
    assert.equal(f.listeners.has(modern?'orientationchange':'screen:change'),false);
    f.listeners.get(event)();
    assert.equal(f.state.value,'paused');assert.equal(f.state.pauses,1);
    assert.equal(f.state.audioStops,1);
    f.listeners.get(event)();assert.equal(f.state.pauses,1,'another rotation cannot resume or reopen the run');
  }
});
test('rotating in camp, results, or another panel does not replace that screen',()=>{
  for(const value of ['menu','ended','help','shop','kennel','paused']) {
    const f=fixture(true);f.state.value=value;f.listeners.get('screen:change')();
    assert.equal(f.state.value,value);assert.equal(f.state.pauses,0);
  }
});
