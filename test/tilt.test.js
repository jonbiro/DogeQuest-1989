import test from 'node:test';
import assert from 'node:assert/strict';
import {createTiltSteering} from '../src/runner/tilt.js';
function fixture(permission){
  const listeners=new Map(),timers=new Map(),actions=[],statuses=[];
  let time=0,id=0;
  const host={isSecureContext:true,DeviceOrientationEvent:permission?{requestPermission:permission}:{},
    screen:{orientation:{angle:0}},performance:{now:()=>time},
    addEventListener:(key,fn)=>listeners.set(key,fn),removeEventListener:key=>listeners.delete(key),
    setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:key=>timers.delete(key)};
  const tilt=createTiltSteering(host,{onAction:a=>actions.push(a),onStatus:s=>statuses.push(s)});
  return {host,tilt,actions,statuses,listeners,timers,
    sample(gamma,n=1){for(let i=0;i<n;i++){time+=20;listeners.get('deviceorientation')?.({gamma});}}};
}
test('calibrates natural hold, ignores jitter and emits one action per deliberate lean',async()=>{
  const f=fixture();await f.tilt.enable();f.sample(8);
  for(const v of [9,6,11,7,8])f.sample(v,10);
  assert.deepEqual(f.actions,[]);
  f.sample(35,50);assert.deepEqual(f.actions,['right']);
  f.sample(8,20);f.sample(-15,30);assert.deepEqual(f.actions,['right','left']);
  f.tilt.stop();f.sample(40,20);assert.equal(f.listeners.size,0);assert.equal(f.timers.size,0);
});
test('permission is requested once and denial attaches no sensor listeners',async()=>{
  let calls=0;const f=fixture(async()=>{calls++;return 'denied';});
  assert.equal(await f.tilt.enable(),false);assert.equal(calls,1);
  assert.equal(f.listeners.size,0);assert.equal(f.statuses.at(-1),'denied');
});
test('stopping while permission is pending cannot reactivate tilt',async()=>{
  let resolve;const f=fixture(()=>new Promise(r=>{resolve=r;}));
  const result=f.tilt.enable();f.tilt.stop();resolve('granted');
  assert.equal(await result,false);assert.equal(f.listeners.size,0);
});
test('unsupported devices, invalid data and landscape do not steer',async()=>{
  const f=fixture();f.host.isSecureContext=false;assert.equal(await f.tilt.enable(),false);
  f.host.isSecureContext=true;await f.tilt.enable();
  f.sample(null);f.sample(NaN);assert.equal(f.statuses.at(-1),'hold-steady');
  f.host.screen.orientation.angle=90;f.sample(30,20);assert.deepEqual(f.actions,[]);
  f.host.screen.orientation.angle=0;f.sample(30);f.sample(30,30);assert.deepEqual(f.actions,[]);
  f.tilt.recalibrate();f.sample(-20);f.sample(-20,30);assert.deepEqual(f.actions,[]);
});
test('absence of sensor readings times out and cleans up',async()=>{
  const f=fixture();await f.tilt.enable();[...f.timers.values()][0]();
  assert.equal(f.listeners.size,0);assert.equal(f.statuses.at(-1),'unavailable');
});
