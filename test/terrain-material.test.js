import test from 'node:test';
import assert from 'node:assert/strict';
import {createTerrainMaterial,terrainStation} from '../src/runner/terrain-material.js';

test('terrain patches stay attached to a station as the runner moves',()=>{
  for(const station of [0,175,1205,24000])for(const distance of [station-100,station-20,station+10])
    assert.equal(terrainStation(distance,distance-station),station);
});

test('terrain material preserves lighting and limits detail to broad color patches',()=>{
  const material=createTerrainMaterial(null);
  const shader={vertexShader:'#include <begin_vertex>',fragmentShader:'#include <color_fragment>'};
  material.onBeforeCompile(shader);
  assert.match(shader.vertexShader,/attribute float terrainStation/);
  assert.match(shader.vertexShader,/terrainStation-position.z\*5.4/);
  assert.match(shader.fragmentShader,/mix\(.78,1.12/);
  assert.match(shader.fragmentShader,/#include <color_fragment>/);
  assert.equal(material.roughness,.94);assert.equal(material.transparent,false);
  assert.equal(material.customProgramCacheKey(),'station-terrain-v1');
  material.dispose();
});
