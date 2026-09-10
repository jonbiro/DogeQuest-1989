import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

test('new dialogs start at the top while same-dialog updates preserve scroll',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function setState(next) {');
  const end=source.indexOf('function start()',start);
  assert.ok(start>=0 && end>start);
  const elements=new Map(),content={scrollTop:250},focus=[];
  const get=id=>{
    if(!elements.has(id))elements.set(id,{dataset:{},hidden:false,focus:options=>focus.push(options)});
    return elements.get(id);
  };
  const context={state:'shop',accumulator:1,pointer:{id:1},$:get,
    document:{querySelector:selector=>selector==='.modal-content'?content:get(selector)}};
  runInNewContext(source.slice(start,end),context);
  context.setState('shop');
  assert.equal(content.scrollTop,250);
  context.setState('menu');context.setState('help');
  assert.equal(content.scrollTop,0);
  assert.ok(focus.every(options=>options.preventScroll===true));
  assert.equal(context.pointer,null);
  assert.equal(context.accumulator,0);
});
