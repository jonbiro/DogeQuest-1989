import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {createPuppyFramer,gameplayFov} from '../src/runner/framing.js';
import {routeFrame} from '../src/runner/route.js';
import {cornerIntersecting} from '../src/runner/turns.js';

test('puppy envelope stays inside both edges through lane lag, curves and zipline height',()=>{
  const frame=createPuppyFramer();
  for(const aspect of [320/568,390/844,844/390,1440/900])
    for(const x of [-2.4,0,2.4])for(const cameraX of [-2.4,0,2.4])
      for(const y of [0,2,3.6])for(const curve of [-8,0,8]){
        const camera=new PerspectiveCamera(gameplayFov(aspect),aspect,.1,190),center=new Vector3(x,y,0);
        const mobile=aspect<.85,lift=y*.7;
        camera.position.set(cameraX*(mobile?.45:.13),4.5+lift,mobile?10.8:9);
        camera.lookAt(cameraX*(mobile?.4:.12)+curve*.3,.75+lift,-13);
        const orientation=camera.quaternion.clone(),position=center.clone();
        const bounds=frame(camera,center);
        assert.ok(bounds.minX>=-.840001&&bounds.maxX<=.840001,JSON.stringify({aspect,x,cameraX,y,curve,bounds}));
        assert.ok(Number.isFinite(bounds.shift)&&Math.abs(bounds.shift)<8);
        assert.deepEqual(camera.quaternion.toArray(),orientation.toArray());
        assert.deepEqual(center.toArray(),position.toArray());
      }
});

test('portrait field of view widens only when needed and stays bounded for tiny or invalid layouts',()=>{
  for(const aspect of [320/568,1,844/390,1440/900])assert.equal(gameplayFov(aspect),52);
  const tall=gameplayFov(390/844);
  assert.ok(tall>52&&tall<61);
  for(const aspect of [.35,390/844,320/568]) {
    const horizontal=2*Math.atan(Math.tan(gameplayFov(aspect)*Math.PI/360)*aspect)*180/Math.PI;
    assert.ok(horizontal>=30-1e-10);
  }
  assert.ok(gameplayFov(.01)<75);
  for(const aspect of [0,-1,NaN,Infinity])assert.equal(gameplayFov(aspect),52);
});

test('side-lane bone envelopes stay visible through the decision window on winding portrait trails',()=>{
  const frame=createPuppyFramer(),point=new Vector3();
  for(const aspect of [.35,390/844,320/568])for(const seconds of [.45,.6,.8])
    for(let distance=50;distance<4500;distance+=5) {
      const speed=Math.min(36,22+distance/90);
      // Corners reserve object-free approaches; test the actual winding-play envelope.
      if(cornerIntersecting(distance,distance+speed*seconds))continue;
      const look=routeFrame(distance,-13),target=routeFrame(distance,-speed*seconds);
      for(const x of [-2.4,0,2.4])for(const cameraX of [x-1,x,x+1]) {
        const camera=new PerspectiveCamera(gameplayFov(aspect),aspect,.1,190);
        camera.position.set(cameraX*.45,4.5,10.8);
        camera.lookAt(cameraX*.4+look.x*.3,.75+look.y*.65,-13);
        frame(camera,new Vector3(x,0,0));
        for(const lane of [-2.4,0,2.4])for(const dx of [-.62,.62])for(const dy of [-.3,.3])for(const dz of [-.3,.3]) {
          point.set(target.x+lane*Math.cos(target.yaw)+dx,target.y+1.1+dy,target.z-lane*Math.sin(target.yaw)+dz).project(camera);
          assert.ok(Math.abs(point.x)<1,JSON.stringify({aspect,seconds,distance,x,cameraX,lane,projectedX:point.x}));
        }
      }
    }
});

test('already framed puppy leaves the camera untouched and reuses its result',()=>{
  const camera=new PerspectiveCamera(52,1.6,.1,190),center=new Vector3();
  camera.position.set(0,4.5,9);camera.lookAt(0,.75,-13);
  const before=camera.position.clone(),frame=createPuppyFramer(),first=frame(camera,center);
  assert.equal(first.shift,0);assert.deepEqual(camera.position.toArray(),before.toArray());
  assert.equal(frame(camera,center),first);
});
