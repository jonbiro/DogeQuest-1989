import test from 'node:test';
import assert from 'node:assert/strict';
import {CURRENT_TRAIL_VERSION,SUPPORTED_TRAIL_VERSIONS,supportsTrailVersion} from '../src/runner/trail-version.js';
import {trailLink,readTrailSeed,readTrailVersion} from '../src/runner/trail-link.js';
import {createRun} from '../src/runner/world.js';

test('every historical replay version survives sharing, parsing and run creation',()=>{
  assert.ok(supportsTrailVersion(CURRENT_TRAIL_VERSION));
  for(const version of [1,2,3])assert.ok(SUPPORTED_TRAIL_VERSIONS.includes(version),'historical layout support cannot disappear');
  for(const version of SUPPORTED_TRAIL_VERSIONS)for(const seed of [0,1989,0xffffffff]){
    const link=trailLink('https://example.com/runner/',seed,version);
    const search=link.slice(link.indexOf('?'));
    assert.equal(readTrailVersion(search),version);assert.equal(readTrailSeed(search),seed);
    const run=createRun(seed,{},readTrailVersion(search));
    assert.equal(run.generatorVersion,version);
    assert.equal(Boolean(run.raftPrototype),false,'no implicit prototype rollout');
  }
});
test('unknown and loosely typed versions cannot create valid shared links',()=>{
  for(const version of [0,9,-1,NaN,null,undefined,'3',3.1]){
    assert.equal(supportsTrailVersion(version),false);
    if(version!==undefined)assert.equal(trailLink('https://example.com/',1,version),'');
  }
  assert.equal(readTrailSeed('?trail=9-1'),null);
  assert.equal(readTrailSeed('?trail=03-1'),null);
  assert.equal(readTrailSeed('?trail=3-1&trail=3-1'),null);
});
