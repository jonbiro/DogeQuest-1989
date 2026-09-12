import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {URL} from 'node:url';
import {startPerformanceCheck} from '../scripts/runner-performance-qa.js';

test('performance fixture bounds its recording duration before creating resources',()=>{
  for(const seconds of [NaN,Infinity,0,1,31])assert.throws(()=>startPerformanceCheck({seconds}),/2–30/);
  for(const warmup of [NaN,Infinity,-1,6])assert.throws(()=>startPerformanceCheck({warmup}),/warmup/);
  for(const key of ['camp','prepare'])for(const value of [1,'false',null])
    assert.throws(()=>startPerformanceCheck({[key]:value}),/boolean/);
});

test('performance fixture refuses the production app or overlapping fixtures',()=>{
  const original=globalThis.document;
  try {
    globalThis.document={querySelector:selector=>selector==='#game'?{}:null};
    assert.throws(()=>startPerformanceCheck(),/standalone/);
    globalThis.document={querySelector:selector=>selector.includes('data-performance-fixture')?{}:null};
    assert.throws(()=>startPerformanceCheck(),/Reload/);
  } finally {
    if(original===undefined)delete globalThis.document;
    else globalThis.document=original;
  }
});

test('optional camp stage renders without simulation and records the actual configuration',()=>{
  const source=readFileSync(new URL('../scripts/runner-performance-qa.js',import.meta.url),'utf8')
    .replace(/^import .*;\n/gm,'').replace('export function','function');
  for(const camp of [false,true]) {
    const frames=[],draws=[],body={dataset:{},append(){}};
    const context={document:{hidden:false,body,querySelector:()=>null,
      createElement:()=>({dataset:{},style:{}})},performance:{now:()=>0},
      requestAnimationFrame:fn=>frames.push(fn),console:{log(){}},
      createRun:()=>({time:0,distance:0,ended:false}),actionCue:()=>'',act(){},recordHitch(){},
      step:(run,dt)=>{run.time+=dt;run.distance+=dt*22;},
      createView:()=>({draw:(run,time,state)=>draws.push({distance:run.distance,state}),diagnostics:()=>({})})};
    runInNewContext(source,context);
    const result=context.startPerformanceCheck({seconds:2,warmup:0,camp});
    let clock=0;
    while(frames.length&&clock<10000)frames.shift()(clock+=1000/60);
    assert.equal(result.status,'done');
    assert.deepEqual(Array.from(result.phases,p=>p.phase),camp?['idle','camp','game']:['idle','game']);
    assert.equal(result.configuration.camp,camp);
    assert.equal(result.configuration.prepare,false);
    const menu=draws.filter(d=>d.state==='menu');
    assert.equal(menu.length>0,camp);
    assert.ok(menu.every(d=>d.distance===0),'camp must not advance the run');
    assert.equal(draws.find(d=>d.state==='playing').distance,0,'game starts with no camp-time catchup');
    assert.equal(JSON.parse(body.dataset.performanceResult).configuration.camp,camp);
  }
});
