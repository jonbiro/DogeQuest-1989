import test from 'node:test';
import assert from 'node:assert/strict';
import {createMushroomCapGeometry} from '../src/runner/mushroom-cap.js';

test('mooncap has a closed domed profile, flared rim and recessed underside',()=>{
  const g=createMushroomCapGeometry(),p=g.attributes.position,n=g.attributes.normal;
  assert.equal(p.count,189);
  assert.equal(g.attributes.uv.count,p.count);
  assert.ok(g.boundingBox.max.y>.58);
  assert.ok(g.boundingBox.min.y<-.21);
  assert.equal(p.getX(0),0);assert.equal(p.getZ(0),0);
  assert.equal(p.getX(8),0);assert.equal(p.getZ(8),0);
  assert.ok(n.getY(1)<0,'underside faces down');
  assert.ok(n.getY(6)>0,'dome catches overhead light');
  for(let i=0;i<p.count;i++)for(const a of [p,n])
    for(const value of [a.getX(i),a.getY(i),a.getZ(i)])assert.ok(Number.isFinite(value));
});
