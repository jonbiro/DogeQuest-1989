import test from 'node:test';
import assert from 'node:assert/strict';
import {Color} from 'three';
import {trailColors,sampleTrailColor,sampleTrailMarkColor,TRAIL_STONES,TRAIL_EDGE_ACCENTS,TRAIL_MARK_COLORS} from '../src/runner/trail-palette.js';

test('six trails remain distinct with dark readable borders',()=>{
  assert.equal(new Set(TRAIL_STONES).size,6);
  assert.equal(new Set(TRAIL_EDGE_ACCENTS).size,6);
  assert.equal(new Set(TRAIL_MARK_COLORS).size,6);
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

test('destination shoulder inlays keep a shared hue while changing at area handoffs',()=>{
  const first=sampleTrailMarkColor(12,new Color(),0);
  const next=sampleTrailMarkColor(225+12,new Color(),0);
  const lifted=sampleTrailMarkColor(12,new Color(),1);
  assert.notDeepEqual(first.toArray(),next.toArray());
  assert.ok(lifted.r>=first.r&&lifted.g>=first.g&&lifted.b>=first.b);
  for(let distance=1;distance<2700;distance++){
    const before=sampleTrailMarkColor(distance-.01,new Color(),0);
    const current=sampleTrailMarkColor(distance,new Color(),0);
    assert.ok(Math.abs(current.r-before.r)+Math.abs(current.g-before.g)+Math.abs(current.b-before.b)<.002);
  }
});

test('destination edge accents stay darker than paving while changing smoothly',()=>{
  const paving=trailColors(new Color('#c1ba88'));
  const edges=trailColors(new Color('#526453'),true);
  const lum=c=>c.r*.2126+c.g*.7152+c.b*.0722;
  for(let distance=0;distance<2700;distance++){
    const p=sampleTrailColor(paving,distance,new Color());
    const e=sampleTrailColor(edges,distance,new Color(),true);
    assert.ok(lum(e)<lum(p),`edge must remain darker at ${distance}m`);
    if(distance){
      const before=sampleTrailColor(edges,distance-.01,new Color(),true);
      assert.ok(Math.abs(e.r-before.r)+Math.abs(e.g-before.g)+Math.abs(e.b-before.b)<.002);
    }
  }
});
