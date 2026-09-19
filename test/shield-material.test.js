import test from 'node:test';
import assert from 'node:assert/strict';
import {createShieldMaterial} from '../src/runner/shield-material.js';

test('protective bubble preserves a transparent center without extra textures',()=>{
  const material=createShieldMaterial();
  assert.equal(material.transparent,true);
  assert.equal(material.depthWrite,false);
  assert.deepEqual(Object.keys(material.uniforms),['shieldColor']);
  assert.match(material.fragmentShader,/0\.012\+0\.32\*rim/);
  assert.match(material.vertexShader,/normalMatrix\*normal/);
  assert.match(material.fragmentShader,/colorspace_fragment/);
  material.dispose();
});
