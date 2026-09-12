import test from 'node:test';
import assert from 'node:assert/strict';
import {URL} from 'node:url';
import {readTrailSeed,readTrailVersion,trailLink} from '../src/runner/trail-link.js';
import {createRun,step} from '../src/runner/world.js';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('trail links round-trip generated seeds without sharing unrelated URL data',()=>{
  for(const seed of [0,1989,0xffffffff,Date.UTC(2026,8,12),-1]) {
    const link=trailLink('https://example.com/game/runner/?private=value#other',seed);
    const url=new URL(link);
    assert.equal(url.pathname,'/game/runner/');
    assert.equal(url.hash,'');assert.equal(url.searchParams.size,1);
    assert.equal(readTrailSeed(url.search),seed>>>0);
    const a=createRun(seed),b=createRun(readTrailSeed(url.search));
    a.invulnerable=b.invulnerable=1000;
    for(let i=0;i<3000;i++){step(a,1/120);step(b,1/120);}
    assert.deepEqual(a.objects,b.objects);assert.equal(a.distance,b.distance);
  }
});
test('malformed, ambiguous and incompatible trail codes fall back to random play',()=>{
  for(const search of ['', '?trail=', '?trail=3-1','?trail=1--1','?trail=1-01','?trail=1-Z','?trail=1-zzzzzzz','?trail=1-0&trail=1-1','?trail=1-%3Cscript%3E'])
    assert.equal(readTrailSeed(search),null,search);
  assert.equal(readTrailSeed('?trail=1-0'),0);
  for(const version of [1,2])assert.equal(readTrailVersion(new URL(trailLink('https://example.com/',0,version)).search),version);
  assert.equal(trailLink('javascript:alert(1)',42),'');
  assert.equal(trailLink('https://example.com/',NaN),'');
});
test('copy failure selects the replay link and restores the button for another attempt',async()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf("$('trail-copy').onclick"),end=source.indexOf('function startPractice',start);
  assert.ok(start>=0&&end>start);
  let focused=false,selected=false;
  const nodes={'trail-copy':{},'trail-copy-status':{},'trail-link':{value:'https://example.com/?trail=1-0',focus:()=>{focused=true;},select:()=>{selected=true;}}};
  runInNewContext(source.slice(start,end),{$:id=>nodes[id],navigator:{clipboard:{writeText:async()=>{throw Error('not allowed');}}}});
  await nodes['trail-copy'].onclick();
  assert.equal(focused,true);assert.equal(selected,true);assert.equal(nodes['trail-copy'].disabled,false);
  assert.match(nodes['trail-copy-status'].textContent,/Copy the selected link/);
});
