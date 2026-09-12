import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

test('opening practice or challenge help reveals its controls without scrolling on collapse',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf("for (const id of ['mission-help','practice-help'])");
  const end=source.indexOf('$("help").onclick',start);
  assert.ok(start>=0&&end>start);
  const nodes={},calls=[];
  for(const id of ['mission-help','practice-help'])nodes[id]={open:false,
    addEventListener:(event,handler)=>{assert.equal(event,'toggle');nodes[id].toggle=handler;},
    scrollIntoView:options=>calls.push([id,options.block])};
  runInNewContext(source.slice(start,end),{$:id=>nodes[id]});
  for(const id of Object.keys(nodes)) {
    nodes[id].toggle();assert.equal(calls.length,0);
  }
  for(const id of Object.keys(nodes)){nodes[id].open=true;nodes[id].toggle();nodes[id].open=false;nodes[id].toggle();}
  assert.deepEqual(calls,[['mission-help','start'],['practice-help','start']]);
});
