import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {Group,Mesh,CylinderGeometry,Box3} from 'three';
import {BANK_SURFACE_Y} from '../src/runner/terrain.js';

test('actual scenery placement grounds roots at bank height and preserves the open corridor',()=>{
  const source=readFileSync(new URL('../src/runner/render.js',import.meta.url),'utf8');
  const begin=source.indexOf('// Keep a wider visual corridor');
  const placement=source.slice(begin,source.indexOf('scenery.updateMatrixWorld(true)',begin));
  for(const gateway of [false,true])for(const x of [-20,-6,6,20]){
    const group=new Group();group.position.x=x;group.userData.gateway=gateway;
    const trunk=new Mesh(new CylinderGeometry(.3,.4,4,10));trunk.position.y=2;group.add(trunk);
    runInNewContext(placement,{decorations:[group],BANK_SURFACE_Y});
    group.updateMatrixWorld(true);
    assert.ok(Math.abs(new Box3().setFromObject(group).min.y-BANK_SURFACE_Y)<.000001);
    assert.equal(group.position.x,gateway?x:x*1.4);
    assert.equal(group.scale.x,gateway?1:.82);
    trunk.geometry.dispose();trunk.material.dispose();
  }
});
