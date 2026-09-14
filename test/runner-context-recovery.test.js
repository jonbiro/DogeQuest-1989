import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
const start=source.indexOf('function contextRestoreTimeout()');
const end=source.indexOf('function graphicsError(',start);
const contextSource=source.slice(start,end);

function fixture(initialState='playing') {
  const listeners=new Map();
  const nodes=new Map();
  const state={value:initialState,pauses:0,focuses:0,errors:0,prevented:false,shaderPasses:0};
  const scene={addEventListener:(name,callback)=>listeners.set(name,callback)};
  const node=id=>nodes.has(id)?nodes.get(id):nodes.set(id,{
    disabled:false,textContent:'',focus(){state.focuses++;},
  }).get(id);
  const context={
    contextRecovery:null,
    graphicsReady:true,
    run:{practice:false},
    CONTEXT_RESTORE_TIMEOUT:4200,
    window:{setTimeout,clearTimeout,addEventListener(){}},
    document:{hidden:false,activeElement:null,body:{}},
    $:id=>id==='scene'?scene:node(id),
    pauseReason:'manual',
    pause(reason){context.pauseReason=reason;state.value='paused';context.state='paused';state.pauses++;},
    graphicsError(){state.errors++;},
    focusOverlay(){state.focuses++;},
    playLabel:()=> 'Run with Mochi ↗︎',
    view:{prepareShaders(force){assert.equal(force,true);state.shaderPasses++;return Promise.resolve(true);}},
    prepareFirstFrame:async prepare=>prepare(),
  };
  Object.defineProperty(context,'state',{get:()=>state.value,set:value=>{state.value=value;}});
  runInNewContext(contextSource,context);
  return {context,state,listeners,nodes};
}

test('a lost mobile context pauses without banking and resumes the same renderer after restoration',async()=>{
  const f=fixture();
  f.listeners.get('webglcontextlost')({preventDefault(){f.state.prevented=true;}});
  assert.equal(f.state.prevented,true);
  assert.equal(f.state.pauses,1);
  assert.equal(f.state.value,'paused');
  assert.equal(f.context.graphicsReady,false);
  assert.equal(f.nodes.get('overlay-primary').disabled,true);
  assert.equal(f.state.errors,0,'restoration gets a chance before the full recovery screen');
  f.listeners.get('webglcontextlost')({preventDefault(){}});
  assert.equal(f.state.pauses,1,'duplicate loss events do not reopen the pause');
  f.listeners.get('webglcontextrestored')();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(f.context.graphicsReady,true);
  assert.equal(f.nodes.get('overlay-primary').disabled,false);
  assert.equal(f.nodes.get('overlay-primary').textContent,'Keep running →');
  assert.equal(f.state.shaderPasses,1);
});

test('a context loss in camp disables Play until the restored programs are ready',async()=>{
  const f=fixture('menu');
  f.listeners.get('webglcontextlost')({preventDefault(){}});
  assert.equal(f.context.graphicsReady,false);
  assert.equal(f.nodes.get('play').disabled,true);
  assert.equal(f.nodes.get('play').textContent,'Waking the trail…');
  f.listeners.get('webglcontextrestored')();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(f.context.graphicsReady,true);
  assert.equal(f.nodes.get('play').disabled,false);
  assert.equal(f.nodes.get('play').textContent,'Run with Mochi ↗︎');
});

test('a restore delivered during scene construction is replayed after the view exists',async()=>{
  const f=fixture('menu');
  f.context.view=null;
  f.listeners.get('webglcontextlost')({preventDefault(){}});
  f.listeners.get('webglcontextrestored')();
  assert.equal(f.context.contextRecovery.restoredPending,true);
  f.context.view={prepareShaders(force){assert.equal(force,true);return Promise.resolve(true);}};
  f.context.handleContextRestored();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(f.context.graphicsReady,true);
  assert.equal(f.context.contextRecovery,null);
  assert.equal(f.nodes.get('play').disabled,false);
});
