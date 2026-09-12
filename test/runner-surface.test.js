import test from 'node:test';
import assert from 'node:assert/strict';
import {RepeatWrapping,LinearMipmapLinearFilter} from 'three';
import {createSurfaceTexture} from '../src/runner/surface.js';
test('world grain is deterministic, subtle and mipmapped for distant surfaces',()=>{
  const a=createSurfaceTexture(),b=createSurfaceTexture();
  assert.deepEqual(a.image.data,b.image.data);
  assert.equal(a.image.width,128);
  assert.equal(a.wrapS,RepeatWrapping);
  assert.equal(a.minFilter,LinearMipmapLinearFilter);
  assert.equal(a.generateMipmaps,true);
  for(let i=0;i<a.image.data.length;i+=4){
    assert.ok(a.image.data[i]>=225&&a.image.data[i]<=253);
    assert.equal(a.image.data[i+3],255);
  }
  a.dispose();b.dispose();
});
