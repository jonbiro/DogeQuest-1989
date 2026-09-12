import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {dailyTrail} from '../src/runner/daily-trail.js';
import {readTrailSeed,readTrailVersion} from '../src/runner/trail-link.js';
import {createRun} from '../src/runner/world.js';

const href='https://example.com/runner/?trail=1-abc&target=1000#old';
test('daily trails share one UTC layout and change only at midnight',()=>{
  const first=dailyTrail(href,Date.parse('2026-09-12T00:00:00Z'));
  assert.deepEqual(dailyTrail(href,Date.parse('2026-09-12T16:59:59-07:00')),first);
  assert.notEqual(dailyTrail(href,Date.parse('2026-09-13T00:00:00Z')).seed,first.seed);
  assert.equal(first.day,'2026-09-12');
  const url=new URL(first.url);
  assert.equal(url.searchParams.has('target'),false);assert.equal(url.hash,'');
  assert.equal(readTrailSeed(url.search),first.seed);assert.equal(readTrailVersion(url.search),first.version);
  assert.deepEqual(createRun(first.seed,{},first.version).objects,createRun(readTrailSeed(url.search),{},readTrailVersion(url.search)).objects);
  const seeds=new Set(Array.from({length:366},(_,day)=>dailyTrail(href,Date.parse('2026-01-01T00:00:00Z')+day*86400000).seed));
  assert.equal(seeds.size,366);
});
test('daily selection rejects invalid dates or non-web destinations',()=>{
  for(const timestamp of [NaN,Infinity,-1,8.64e15+1])assert.equal(dailyTrail(href,timestamp),null);
  assert.equal(dailyTrail('file:///runner/',0),null);
});
test('the actual daily selector chooses a replayable trail without starting or banking a run',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const elements=new Map(),calls=[];
  const $=id=>{if(!elements.has(id))elements.set(id,{focus:()=>calls.push('focus')});return elements.get(id);};
  const daily=dailyTrail(href,Date.parse('2026-09-12T23:59:00Z'));
  const context={$,sharedSeed:1,sharedVersion:1,sharedTarget:1000,dailyTrail:()=>daily,
    window:{location:{href},history:{replaceState:(_a,_b,url)=>calls.push(url)}},
    setState:value=>calls.push(value),updateRecords:()=>calls.push('records')};
  const start=source.indexOf("$('daily-trail').onclick ="),end=source.indexOf("$('shared-random').onclick =",start);
  runInNewContext(source.slice(start,end),context);$('daily-trail').onclick();
  assert.equal(context.sharedSeed,daily.seed);assert.equal(context.sharedVersion,daily.version);assert.equal(context.sharedTarget,0);
  assert.match($('shared-description').textContent,/2026-09-12 UTC/);assert.equal($('shared-trail').hidden,false);
  assert.deepEqual(calls,[daily.url,'menu','records','focus']);
});
