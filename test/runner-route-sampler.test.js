import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRouteSampler,routeFrame} from '../src/runner/route.js';

test('shared player transforms preserve pre-optimization geometry to sub-micrometer precision',()=>{
  // Captured from the previous implementation, not derived from the new sampler.
  // Raw transcendental-function results vary in their last bits across runtimes.
  const precision=(_key,value)=>typeof value==='number'?Math.round(value*1e7)/1e7:value;
  const hash=createHash('sha256');
  for(const kind of [null,'scenic','challenge'])for(let d=300;d<=3200;d+=7) {
    const route=kind?{kind,until:570+700*Math.floor((d-350)/700)}:null;
    const samples=[createRouteSampler(d,{route}),createRouteSampler(d,{route,flat:true})];
    for(const z of [-150,-60,-13,0,15])for(const sample of samples)hash.update(JSON.stringify(sample(z),precision));
  }
  assert.equal(hash.digest('hex'),'b754fdbdde7060a8bb4806b3f4d2aaba1c5eb2980059236605c46916794cd0c9');
});

test('route samplers isolate route changes and return independent finite frames',()=>{
  const route={kind:'challenge',until:570};
  const sample=createRouteSampler(435,{route});
  const original=sample(-35);
  route.kind='scenic';route.until=1270;
  assert.deepEqual(sample(-35),original);
  assert.notDeepEqual(createRouteSampler(435,{route})(-35),original);
  const mutated=sample(-35);mutated.x=10000;
  assert.deepEqual(sample(-35),original);
  for(const distance of [NaN,Infinity,-Infinity,435])for(const z of [NaN,Infinity,-Infinity]) {
    const frame=createRouteSampler(distance)(z);
    assert.ok(Object.values(frame).every(value=>value===0));
    assert.deepEqual(frame,routeFrame(distance,z));
  }
});
