import test from 'node:test';
import assert from 'node:assert/strict';
import {startPerformanceCheck} from '../scripts/runner-performance-qa.js';

test('performance fixture bounds its recording duration before creating resources',()=>{
  for(const seconds of [NaN,Infinity,0,1,31])assert.throws(()=>startPerformanceCheck({seconds}),/2–30/);
  for(const warmup of [NaN,Infinity,-1,6])assert.throws(()=>startPerformanceCheck({warmup}),/warmup/);
});

test('performance fixture refuses the production app or overlapping fixtures',()=>{
  const original=globalThis.document;
  try {
    globalThis.document={querySelector:selector=>selector==='#game'?{}:null};
    assert.throws(()=>startPerformanceCheck(),/standalone/);
    globalThis.document={querySelector:selector=>selector.includes('data-performance-fixture')?{}:null};
    assert.throws(()=>startPerformanceCheck(),/Reload/);
  } finally {
    if(original===undefined)delete globalThis.document;
    else globalThis.document=original;
  }
});
