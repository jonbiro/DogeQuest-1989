import test from 'node:test';
import assert from 'node:assert/strict';
import {Color} from 'three';
import {trailColors,sampleTrailColor,TRAIL_STONES} from '../src/runner/trail-palette.js';

test('six trails remain distinct with dark readable borders',()=>{
  assert.equal(new Set(TRAIL_STONES).size,6);
  const paving=trailColors(new Color('#c1ba88'));
  const edges=trailColors(new Color('#526453'),true);
  const lum=c=>c.r*.2126+c.g*.7152+c.b*.0722;
  for(let distance=0;distance<2700;distance++){
    const p=sampleTrailColor(paving,distance,new Color());
    const e=sampleTrailColor(edges,distance,new Color());
    assert.ok((lum(p)+.05)/(lum(e)+.05)>2.5);
    if(distance){
      const before=sampleTrailColor(paving,distance-.01,new Color());
      assert.ok(Math.abs(p.r-before.r)+Math.abs(p.g-before.g)+Math.abs(p.b-before.b)<.001);
    }
  }
});
