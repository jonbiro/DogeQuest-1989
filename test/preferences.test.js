import test from "node:test";
import assert from "node:assert/strict";
import {preferencesFrom} from "../src/runner/preferences.js";
test("new and old saves honor system motion preference and keep sound opt-in",()=>{
  for(const value of [undefined,null,5,"bad",{}]) {
    assert.deepEqual(preferencesFrom(value,true),{sound:false,reducedMotion:true});
    assert.deepEqual(preferencesFrom(value,false),{sound:false,reducedMotion:false});
  }
});
test("explicit player preferences survive serialization and override system defaults",()=>{
  const value=JSON.parse(JSON.stringify({sound:true,reducedMotion:false}));
  assert.deepEqual(preferencesFrom(value,true),value);
  assert.deepEqual(preferencesFrom({sound:"true",reducedMotion:0},true),{sound:false,reducedMotion:true});
});
