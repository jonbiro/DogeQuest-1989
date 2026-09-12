import test from 'node:test';
import assert from 'node:assert/strict';
import {createShaderPreparation} from '../src/runner/shader-preparation.js';

test('shader preparation compiles scene and detached templates once using the same lighting',async()=>{
  const calls=[],scene={},camera={},templates={};
  const renderer={extensions:{has:()=>true},compileAsync:async(...args)=>{calls.push(args);}};
  const preparation=createShaderPreparation(renderer,scene,camera,templates);
  const first=preparation.start();assert.equal(preparation.start(),first);
  assert.equal(await first,true);assert.equal(preparation.status,'ready');
  assert.deepEqual(calls,[[scene,camera],[templates,camera,scene]]);
  assert.equal(preparation.start(),first);assert.equal(calls.length,2);
});

test('unsupported compilation and failed drivers cannot reject or block play',async()=>{
  for(const supported of [false,true]) {
    let calls=0;
    const preparation=createShaderPreparation({extensions:{has:()=>supported},
      compileAsync(){calls++;throw Error('driver unavailable');}}, {}, {}, {});
    assert.equal(await preparation.start(),false);
    assert.equal(preparation.status,supported?'failed':'unsupported');
    assert.equal(calls,supported?1:0);
    await preparation.start();assert.equal(calls,supported?1:0);
  }
});
