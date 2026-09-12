import test from 'node:test';
import assert from 'node:assert/strict';
import {Color} from 'three';
import {boneSurfaceColor} from '../src/runner/bone-model.js';
import {trailColors,sampleTrailColor} from '../src/runner/trail-palette.js';

test('bone rim separates from all six paving palettes without changing its ivory face',()=>{
  const rim=boneSurfaceColor(0),face=boneSurfaceColor(1);
  assert.equal(face.getHexString(),'fff2ca');
  assert.equal(rim.getHexString(),'70451e');
  const lum=c=>c.r*.2126+c.g*.7152+c.b*.0722;
  const palettes=trailColors(new Color('#c1ba88'));
  for(let distance=0;distance<2700;distance++){
    const pavement=sampleTrailColor(palettes,distance,new Color());
    assert.ok((lum(pavement)+.05)/(lum(rim)+.05)>3,'material-level silhouette contrast');
  }
  for(let n=0;n<=1;n+=.01){
    assert.deepEqual(boneSurfaceColor(n),boneSurfaceColor(-n));
    if(n>0)assert.ok(lum(boneSurfaceColor(n))>=lum(boneSurfaceColor(n-.01)));
  }
});
