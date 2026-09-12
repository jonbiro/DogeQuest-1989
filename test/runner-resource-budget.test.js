import test from 'node:test';
import assert from 'node:assert/strict';
import {checkRendererResources,RENDERER_BUDGET} from '../scripts/runner-resource-budget.js';
const sample={geometries:31,textures:8,drawCalls:236,activeObjects:40,pooledObjects:67};
test('renderer budgets allow the bounded graphics catalog and reject excess or invalid counts',()=>{
  assert.doesNotThrow(()=>checkRendererResources(sample));
  for(const key of ['geometries','textures','drawCalls'])for(const value of [RENDERER_BUDGET[key]+1,NaN,-1])
    assert.throws(()=>checkRendererResources({...sample,[key]:value}));
  assert.throws(()=>checkRendererResources({...sample,pooledObjects:161}));
});
test('repeat-lap GPU growth fails even when it is within the absolute budget',()=>{
  assert.doesNotThrow(()=>checkRendererResources(sample,{geometries:31,textures:8}));
  assert.throws(()=>checkRendererResources({...sample,geometries:32},{geometries:31,textures:8}),/grew on the repeat lap/);
  assert.throws(()=>checkRendererResources(sample,{geometries:31,textures:7}),/grew on the repeat lap/);
});
