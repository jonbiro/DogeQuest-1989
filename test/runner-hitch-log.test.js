import test from 'node:test';
import assert from 'node:assert/strict';
import {recordHitch} from '../scripts/runner-hitch-log.js';

test('hitch evidence includes first-frame CPU and preceding-frame context',()=>{
  const log={count:0,worst:[]};
  recordHitch(log,{interval:0,updateCPU:1,drawCPU:200,warmup:true,previousCPU:null});
  recordHitch(log,{interval:1100,updateCPU:2,drawCPU:3,warmup:false,previousCPU:{drawCPU:200,updateCPU:1}});
  assert.equal(log.count,2);
  assert.equal(log.worst[0].severity,1100);
  assert.equal(log.worst[0].previousCPU.drawCPU,200);
  assert.equal(log.worst[1].warmup,true);
});

test('hitch logs ignore normal frames and retain only the sixteen worst observations',()=>{
  const log={count:0,worst:[]};
  recordHitch(log,{interval:50,updateCPU:0,drawCPU:20});
  assert.equal(log.count,0);
  for(let interval=51;interval<=100;interval++)recordHitch(log,{interval,updateCPU:1,drawCPU:2});
  assert.equal(log.count,50);assert.equal(log.worst.length,16);
  assert.equal(log.worst[0].interval,100);assert.equal(log.worst.at(-1).interval,85);
});
