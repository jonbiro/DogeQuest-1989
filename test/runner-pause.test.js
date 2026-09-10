import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

test('interruptions stop sound without restarting or replacing inactive screens',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function pause() {');
  const end=source.indexOf('function finish()',start);
  assert.ok(start>=0 && end>start);
  const audio={},screens=[],stopped=[];
  const context={audio,state:'playing',sound:true,
    stopSound:value=>stopped.push(value),
    showOverlay:value=>{screens.push(value);context.state=value;}};
  runInNewContext(source.slice(start,end),context);
  context.pause();
  assert.equal(context.state,'paused');
  context.pause();
  for(const state of ['menu','help','shop','kennel','ended','graphics-error']){
    context.state=state;context.pause();assert.equal(context.state,state);
  }
  assert.deepEqual(screens,['paused']);
  assert.equal(stopped.length,8);
  assert.ok(stopped.every(value=>value===audio));
  assert.equal(context.sound,true);
  context.audio=null;context.pause();
  assert.equal(stopped.length,8);
});
