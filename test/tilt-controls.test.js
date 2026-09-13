import test from 'node:test';
import assert from 'node:assert/strict';
import {installTiltControls} from '../src/runner/tilt-controls.js';
function setup(permission='granted'){
  const listeners=new Map(),actions=[];
  let now=0,allowed=true;
  const toggle={setAttribute(k,v){this[k]=v;}},recenter={},message={};
  const host={isSecureContext:true,DeviceOrientationEvent:{requestPermission:async()=>permission},
    performance:{now:()=>now},setTimeout:()=>1,clearTimeout:()=>{},
    addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)};
  const controller=installTiltControls(host,{toggle,recenter,message,onAction:a=>actions.push(a),canSteer:()=>allowed});
  return {toggle,recenter,message,controller,actions,listeners,block:()=>{allowed=false;},
    sample(gamma,n=1){for(let i=0;i<n;i++){now+=20;listeners.get('deviceorientation')?.({gamma});}}};
}
test('tilt UI enables, recalibrates, respects gameplay suppression and turns off',async()=>{
  const f=setup();assert.equal(f.recenter.disabled,true);
  await f.toggle.onclick();assert.equal(f.toggle['aria-pressed'],'true');
  f.sample(0);f.sample(25,30);assert.deepEqual(f.actions,['right']);
  f.recenter.onclick();f.sample(25);f.sample(25,30);assert.equal(f.actions.length,1);
  f.block();f.sample(0,30);assert.equal(f.actions.length,1);
  await f.toggle.onclick();assert.equal(f.toggle['aria-pressed'],'false');
  assert.equal(f.listeners.size,0);assert.equal(f.recenter.disabled,true);
});
test('denied permission keeps fallback instructions and permits retry',async()=>{
  const f=setup('denied');await f.toggle.onclick();
  assert.equal(f.toggle.disabled,false);assert.equal(f.toggle['aria-pressed'],'false');
  assert.match(f.message.textContent,/not granted/);assert.equal(f.listeners.size,0);
});
test('restored sensitivity configures the sensor without requesting motion access',async()=>{
  let requests=0;const changes=[],listeners=new Map();
  const host={isSecureContext:true,DeviceOrientationEvent:{requestPermission:async()=>{requests++;return 'granted';}},
    performance:{now:()=>0},setTimeout:()=>1,clearTimeout(){},
    addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k)};
  const sensitivity={},toggle={setAttribute(){}},recenter={},message={};
  installTiltControls(host,{toggle,recenter,message,sensitivity,initialSensitivity:'steady',
    onSensitivity:value=>changes.push(value),onAction(){},canSteer:()=>true});
  assert.equal(sensitivity.value,'steady');assert.equal(requests,0);assert.equal(listeners.size,0);
  sensitivity.value='gentle';sensitivity.onchange();
  assert.deepEqual(changes,['gentle']);assert.equal(requests,0);
  sensitivity.value='invalid';sensitivity.onchange();assert.deepEqual(changes,['gentle']);
  await toggle.onclick();assert.equal(requests,1);
});
