import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

test('an early start request does not misreport shader preparation as a graphics failure',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function start() {');
  const guard=source.slice(start,source.indexOf('// A results-screen retry',start))+'}';
  runInNewContext(guard+';start();',{graphicsReady:false,graphicsError:()=>{throw Error('false failure');}});
});

test('startup keeps Play disabled during preparation and never overrides a graphics interruption',async()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const block=source.slice(source.indexOf('let view;'),source.indexOf('let currentMission ='));
  for(const interrupted of [false,true]) {
    let done,focus=0;
    const play={disabled:true,focus(){focus++;}};
    const context={graphicsReady:false,state:'menu',$:()=>play,
      createView:()=>({prepareShaders:()=>Promise.resolve(true)}),
      prepareFirstFrame:()=>new Promise(resolve=>{done=resolve;}),
      playLabel:()=> 'Run',graphicsError:()=>{throw Error('unexpected');}};
    runInNewContext(block,context);
    assert.equal(play.disabled,true);
    assert.equal(play.textContent,'Preparing the trail…');
    if(interrupted)context.state='graphics-error';
    done(false);await Promise.resolve();
    assert.equal(context.graphicsReady,!interrupted);
    assert.equal(play.disabled,interrupted);
    assert.equal(focus,interrupted?0:1);
  }
});
