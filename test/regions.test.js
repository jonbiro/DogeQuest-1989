import test from "node:test";
import assert from "node:assert/strict";
import {regionAt,regionBlend,REGIONS} from "../src/runner/regions.js";
test("regions advance every 450 meters and cycle without losing their identities",()=>{
  assert.equal(REGIONS.length,3);
  for(const [distance,index] of [[-1,0],[0,0],[449.9,0],[450,1],[899.9,1],[900,2],[1350,0],[1800,1]])assert.equal(regionAt(distance),index);
});
test("atmosphere starts at the previous region and eases to the new sky",()=>{
  for(const distance of [450,900,1350]){
    const start=regionBlend(distance),middle=regionBlend(distance+32.5),end=regionBlend(distance+65);
    assert.equal(start.blend,0);assert.equal(middle.blend,.5);assert.equal(end.blend,1);
    assert.equal(start.previous,regionAt(distance-1));
    assert.equal(end.index,regionAt(distance));
  }
  assert.equal(regionBlend(0).previous,0);
});
