import test from 'node:test';
import {setImmediate} from 'node:timers';
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
    unblock:()=>{allowed=true;},
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
test('a partial lean during a corner cannot become a delayed lane change',async()=>{
  const f=setup();await f.toggle.onclick();f.sample(0);
  f.block();f.sample(25,2); // Smoothed angle is still below the activation threshold.
  f.unblock();f.sample(25,30);
  assert.deepEqual(f.actions,[],'holding the corner lean must not steer after the corner');
  f.sample(0,30);f.sample(25,30);
  assert.deepEqual(f.actions,['right'],'a fresh deliberate lean still works');
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

test('mobile Play requests tilt once; pending permission is observable and denial is not nagged',async()=>{
  let resolve,requests=0;
  const host={isSecureContext:true,matchMedia:()=>({matches:true}),
    DeviceOrientationEvent:{requestPermission:()=>{requests++;return new Promise(r=>{resolve=r;});}},
    performance:{now:()=>0},setTimeout:()=>1,clearTimeout(){},addEventListener(){},removeEventListener(){}};
  const toggle={setAttribute(){}},message={};
  const controls=installTiltControls(host,{toggle,recenter:{},message,onAction(){},canSteer:()=>true});
  assert.match(message.textContent,/Tilt starts when you play/);
  assert.equal(requests,0,'loading the page never opens a permission prompt');
  controls.enableDefault();assert.equal(requests,1);assert.equal(controls.isRequesting(),true);
  controls.enableDefault();assert.equal(requests,1);
  resolve('denied');await new Promise(r=>setImmediate(r));
  assert.equal(controls.isRequesting(),false);assert.match(message.textContent,/not granted/);
  controls.enableDefault();assert.equal(requests,1,'retries do not nag after denial');
  const manual=toggle.onclick();assert.equal(requests,2,'explicit Enable remains available');
  resolve('granted');await manual;
  await toggle.onclick();controls.enableDefault();assert.equal(requests,2,'manual Off lasts for the visit');
  assert.match(message.textContent,/Tilt is off/,'manual off is not advertised as pending automatic activation');
});

test('desktop Play does not request tilt by default',()=>{
  const f=setup();f.controller.enableDefault();
  assert.equal(f.listeners.size,0);assert.equal(f.controller.isRequesting(),false);
});
