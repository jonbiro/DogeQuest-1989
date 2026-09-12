import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {resumeSound} from '../src/runner/sound.js';

test('audio wake handles suspended, interrupted and pending-suspend contexts safely',async()=>{
  for(const state of ['suspended','interrupted','running']) {
    let calls=0;
    resumeSound({state,resume:()=>{calls++;return Promise.resolve();}});
    assert.equal(calls,1);
  }
  resumeSound(null);
  resumeSound({state:'closed',resume:()=>{assert.fail('closed context must not reopen');}});
  resumeSound({state:'suspended',resume:()=>{throw Error('unavailable');}});
  resumeSound({state:'suspended',resume:()=>Promise.reject(Error('denied'))});
  await Promise.resolve();
});

test('the actual resume action wakes opted-in audio without creating sound for muted players',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const from=source.indexOf('function resume() {'),to=source.indexOf('function finish()',from);
  assert.ok(from>=0&&to>from);
  for(const sound of [false,true]) {
    const audio={},run={};let wake=0,state='',focused=false;
    const context={audio,run,sound,RESUME_DURATION:.9,
      resumeSound:value=>{assert.equal(value,audio);wake++;},
      setState:value=>{state=value;},$:()=>({focus:()=>{focused=true;}})};
    runInNewContext(source.slice(from,to),context);
    context.resume();
    assert.equal(wake,Number(sound));
    assert.equal(state,'playing');
    assert.equal(run.resumeRemaining,.9);
    assert.equal(focused,true);
  }
});
