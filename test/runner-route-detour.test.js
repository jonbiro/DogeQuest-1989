import test from 'node:test';
import assert from 'node:assert/strict';
import {routeDetour,detourReveal,detourCameraWeight} from '../src/runner/route-detour.js';
import {routeFrame} from '../src/runner/route.js';

test('selected routes leave and rejoin smoothly in opposite directions',()=>{
  for(const kind of ['scenic','challenge']) {
    const route={kind,until:570};
    for(const station of [350,394,395,555,570,650])assert.deepEqual(routeDetour(station,route),{offset:0,slope:0,second:0});
    assert.equal(routeDetour(475,route).offset,kind==='scenic'?-8:12);
    for(const station of [395.001,555-.001]) {
      const result=routeDetour(station,route);
      assert.ok(Math.abs(result.offset)<1e-8&&Math.abs(result.slope)<1e-7&&Math.abs(result.second)<1e-5);
    }
    for(let station=396;station<555;station+=3) {
      const a=routeDetour(station-.001,route),b=routeDetour(station+.001,route),r=routeDetour(station,route);
      assert.ok(Math.abs((b.offset-a.offset)/.002-r.slope)<1e-7);
      assert.ok(Math.abs((b.slope-a.slope)/.002-r.second)<1e-7);
    }
    assert.equal(detourReveal(350,route),0);assert.equal(detourReveal(390,route),1);
    assert.equal(detourCameraWeight(350,route),.3);assert.equal(detourCameraWeight(570,route),.3);
    assert.equal(detourCameraWeight(430,route),2);
    for(const edge of [350,570])assert.ok(Math.abs(detourCameraWeight(edge+.001,route)-detourCameraWeight(edge-.001,route))<1e-8);
  }
});
test('gate selection does not snap the visible road and detours preserve the player origin',()=>{
  for(const kind of ['scenic','challenge']) {
    const route={kind,until:570};
    for(const z of [-150,-80,-40,0,15])assert.deepEqual(routeFrame(350,z,{route}),routeFrame(350,z));
    for(let distance=350;distance<=650;distance+=1) {
      const origin=routeFrame(distance,0,{route});
      assert.equal(origin.x,0);assert.equal(origin.y,0);assert.equal(origin.z,0);assert.equal(origin.yaw,0);
      const look=routeFrame(distance,-35,{route});
      assert.ok(Object.values(look).every(Number.isFinite));assert.ok(Math.abs(look.curvature)<.06);
      const a=routeFrame(distance,-35.001,{route}),b=routeFrame(distance,-34.999,{route});
      const measured=Math.hypot(a.x-b.x,a.z-b.z)/.002;
      assert.ok(Math.abs(measured-(look.stretch||1))<.002,'slab stretch follows actual centerline spacing');
    }
    for(const distance of [570,650,790,950])for(const z of [-50,-10,0])
      assert.deepEqual(routeFrame(distance,z,{route}),routeFrame(distance,z),'rejoined before later traversal');
  }
});
