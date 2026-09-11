import test from 'node:test';
import assert from 'node:assert/strict';
import {createSky} from '../src/runner/sky.js';
test('sky uses a bounded texture-free gradient with a lighter horizon',()=>{
  const sky=createSky(),colors=sky.geometry.getAttribute('color');
  const positions=sky.geometry.getAttribute('position');
  assert.ok(positions.count<500);
  assert.equal(sky.material.map,null);
  assert.equal(sky.material.depthWrite,false);
  assert.equal(sky.material.fog,false);
  for(let i=0;i<colors.count;i++){
    const shade=colors.getX(i);
    assert.ok(Number.isFinite(shade)&&shade>=.51&&shade<=1);
    if(positions.getY(i)<=0)assert.equal(shade,1);
    if(positions.getY(i)>.99)assert.ok(shade<.53);
  }
  sky.geometry.dispose();sky.material.dispose();
});
