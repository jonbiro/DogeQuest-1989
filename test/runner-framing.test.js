import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {createPuppyFramer} from '../src/runner/framing.js';

test('puppy envelope stays inside both edges through lane lag, curves and zipline height',()=>{
  const frame=createPuppyFramer();
  for(const aspect of [320/568,390/844,844/390,1440/900])
    for(const x of [-2.4,0,2.4])for(const cameraX of [-2.4,0,2.4])
      for(const y of [0,2,3.6])for(const curve of [-8,0,8]){
        const camera=new PerspectiveCamera(52,aspect,.1,190),center=new Vector3(x,y,0);
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

test('already framed puppy leaves the camera untouched and reuses its result',()=>{
  const camera=new PerspectiveCamera(52,1.6,.1,190),center=new Vector3();
  camera.position.set(0,4.5,9);camera.lookAt(0,.75,-13);
  const before=camera.position.clone(),frame=createPuppyFramer(),first=frame(camera,center);
  assert.equal(first.shift,0);assert.deepEqual(camera.position.toArray(),before.toArray());
  assert.equal(frame(camera,center),first);
});
