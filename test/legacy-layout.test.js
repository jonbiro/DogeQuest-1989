import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRun,fillTrack} from '../src/runner/world.js';

// Freeze pre-river layouts before adding a new generator version. Updating these
// digests to accommodate new content would break existing shared-trail promises.
function layoutDigest(version,seed){
  const run=createRun(seed,{},version),seen=new Set(),hash=createHash('sha256');
  let choices=0,objects=0;
  for(let distance=0;distance<=18000;distance+=10){
    run.distance=distance;
    if(run.course&&distance>run.course.start+140)run.course=null;
    if(run.choicePending!==null&&distance>=run.choicePending){
      run.route={kind:choices++%2?'scenic':'challenge',until:run.choicePending+220};
      run.nextChoice=run.choicePending+700;run.choicePending=null;
    }
    fillTrack(run);
    for(const object of run.objects)if(!seen.has(object.id)){
      seen.add(object.id);objects++;hash.update(JSON.stringify(object)+'\n');
      assert.equal(Boolean(object.raftHazard||object.raftPickup),false);
    }
    run.objects=run.objects.filter(object=>object.at>=distance-10);
  }
  assert.ok(choices>=25);assert.ok(objects>2000);
  return hash.digest('hex');
}

test('historical trail layouts retain obstacles and rewards across 18 km of alternating routes',()=>{
  const actual=[];
  for(const version of [1,2,3])for(const seed of [0,1989,0xffffffff])
    actual.push(layoutDigest(version,seed));
  assert.deepEqual(actual,[
    'fa85bb8774626a9523fcc3765cd8ab9d318a05f1f825f06c4fd8138a393e2743',
    '938aa9fc633e6ef318754615d072291e948a135bdba260633cb9461a2ad21bcc',
    'd89ee5d0ba463f18821e7808ca4ec4cf1871ba8c4b9a4b9914a1b6adb37c5e8f',
    'a23585985323377f08fd922d6ef37915af985f2cf69011f2d58677a00f3dfb5f',
    'a42b36da5fa10e94b2d248cd3b6adb1239d5bd4bb3d1617a2eeb4242de4f34e8',
    '2872043c5641c20d3dbdfff3f63ccd94ef1efa765416ce5ac6b65a4c1f8c5af6',
    '0b81942d4b0232ddbb00bac6c8c42a37e0e42728532ced0edc2a78e0ea35ecdc',
    '3c94a5e1848accf68f381a54ebc6f8fe14d36065b4b99dd2eaeb7d54442d57d8',
    '4d04f56c26d9c31d3a88070bbd3e4e5e6663e46fb5ea70f0c7f989159c4cda3e',
  ]);
});
