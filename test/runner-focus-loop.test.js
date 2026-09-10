import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

test('dialog keyboard loop excludes controls inside collapsed sections',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('window.addEventListener("keydown",');
  const end=source.indexOf('let pointer = null;',start);
  assert.ok(start>=0 && end>start);
  let handler,focused,prevented=0;
  const control=(name,visible=true,hidden=false)=>({
    closest:()=>hidden?{}:null,
    getClientRects:()=>visible?[{}]:[],
    focus:()=>{focused=name;},
  });
  const collapsed=control('collapsed',false),first=control('first'),last=control('last');
  const hidden=control('hidden',true,true);
  const overlay={hidden:false,querySelectorAll:()=>[collapsed,first,last,hidden]};
  const document={activeElement:first};
  runInNewContext(source.slice(start,end),{
    window:{addEventListener:(_name,callback)=>{handler=callback;}},
    document,$:()=>overlay,state:'help',keyActions:{},
  });
  handler({key:'Tab',shiftKey:true,preventDefault:()=>{prevented++;}});
  assert.equal(focused,'last');
  document.activeElement=last;
  handler({key:'Tab',shiftKey:false,preventDefault:()=>{prevented++;}});
  assert.equal(focused,'first');
  assert.equal(prevented,2);
});
