import test from "node:test";
import assert from "node:assert/strict";
import {readStoredProfile,writeStoredProfile} from "../src/runner/storage.js";
test("blocked, absent and malformed progress have distinct write-safety states",()=>{
  assert.deepEqual(readStoredProfile({getItem(){throw new Error("blocked");}}),{available:false,readable:false,value:null});
  assert.deepEqual(readStoredProfile({getItem(){return null;}}),{available:true,readable:true,value:null});
  for(const raw of ['{bad JSON','null','[]','false','42','"old save"','']) {
    const storage={getItem(){return raw;},setItem(){assert.fail('Original save must be preserved');}};
    const result=readStoredProfile(storage);
    assert.deepEqual(result,{available:true,readable:false,value:null});
    assert.equal(writeStoredProfile(storage,{best:0},result.readable),false);
  }
});
test("unreadable startup progress cannot be overwritten and quota failures stay nonfatal",()=>{
  const calls=[];const storage={setItem(...args){calls.push(args);}};
  assert.equal(writeStoredProfile(storage,{best:0},false),false);assert.equal(calls.length,0);
  assert.equal(writeStoredProfile(storage,{best:400}),true);
  assert.deepEqual(calls,[["biscuit-dash-v1",'{"best":400}']]);
  assert.equal(writeStoredProfile({setItem(){throw new Error("quota");}},{best:400}),false);
});
test("valid progress is read without writing or changing it",()=>{
  const profile={best:300,credits:900,collection:{puppy:"mochi"}};
  const result=readStoredProfile({getItem(key){assert.equal(key,"biscuit-dash-v1");return JSON.stringify(profile);}});
  assert.deepEqual(result,{available:true,readable:true,value:profile});
});
