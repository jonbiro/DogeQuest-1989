import test from 'node:test';
import assert from 'node:assert/strict';
import {assertTrustedRun} from '../scripts/runner-trusted-qa.mjs';

const complete={distance:'1,105 m',turns:2,missedTurns:0,fetchUses:2,proof:{trusted:48,untrusted:0},issues:[],ziplineCaught:true,ziplineLanded:true,regions:['forest','river','canyon'],hearts:'3 hearts remaining'};

test('trusted run must actually activate Fetch, not merely press its key',()=>{
  for(const fetchUses of [0,undefined,NaN,-1,.5])
    assert.throws(()=>assertTrustedRun({...complete,fetchUses}),/acceptance failed/);
});

test('trusted run requires distance and both turns, not just zero missed turns',()=>{
  assert.doesNotThrow(()=>assertTrustedRun(complete));
  for(const patch of [{distance:'999 m'},{distance:''},{turns:0},{turns:1},{turns:undefined},{missedTurns:1},{regions:['forest','forest','river']}])
    assert.throws(()=>assertTrustedRun({...complete,...patch}),/acceptance failed/);
});

test('trusted run rejects missing interaction, damaged runs and incomplete zipline evidence',()=>{
  for(const patch of [{proof:{trusted:0,untrusted:0}},{proof:{trusted:48,untrusted:1}},{hearts:'2 hearts remaining'},{ziplineCaught:false},{ziplineLanded:false},{issues:['HUD overlap']}])
    assert.throws(()=>assertTrustedRun({...complete,...patch}),/acceptance failed/);
});
