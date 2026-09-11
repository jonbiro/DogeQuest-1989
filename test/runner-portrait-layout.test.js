import test from 'node:test';
import assert from 'node:assert/strict';
import {portraitControlIssues} from '../scripts/runner-portrait-layout.mjs';

const viewport={width:320,height:568,safeBottom:34};
const row=()=>Array.from({length:5},(_,i)=>({left:16+i*59,right:68+i*59,top:462,bottom:522,width:52,height:60}));
test('portrait thumb row fits compact phones above the home indicator',()=>{
  assert.deepEqual(portraitControlIssues(row(),viewport),[]);
});
test('portrait guard rejects shrunken, uneven, crowded and unsafe controls',()=>{
  for(const change of [{height:56},{width:64},{top:450},{bottom:535},{left:70}]){
    const rects=row();Object.assign(rects[1],change);
    assert.ok(portraitControlIssues(rects,viewport).length>0);
  }
  assert.ok(portraitControlIssues(row().slice(1),viewport).length>0);
});
test('portrait thumb row does not impose its layout on landscape or desktop',()=>{
  assert.deepEqual(portraitControlIssues([],{width:844,height:390}),[]);
  assert.deepEqual(portraitControlIssues([],{width:900,height:1200}),[]);
});
