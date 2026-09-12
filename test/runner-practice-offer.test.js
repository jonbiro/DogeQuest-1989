import test from 'node:test';
import assert from 'node:assert/strict';
import {practiceOffer} from '../src/runner/practice.js';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {URL} from 'node:url';

test('collision results offer relevant practice without guessing an unsupported lesson', () => {
  for (const [direction,cornerIndex] of [['left',0],['right',1]])
    assert.deepEqual(practiceOffer({ended:true,lastMistake:{type:'corner',direction}}),
      {kind:'turn',cornerIndex,label:'Practise this turn'});
  for (const type of ['log','rock','arch','branch','gate'])
    assert.equal(practiceOffer({ended:true,lastMistake:{type}}).kind,'moves');
  for (const run of [{}, {ended:true}, {ended:true,lastMistake:{type:'corner'}},
    {ended:true,lastMistake:{type:'gap'}}, {ended:true,lastMistake:{type:'unknown'}},
    {ended:false,lastMistake:{type:'log'}},
    {ended:true,retired:true,lastMistake:{type:'log'}},
    {ended:true,practice:{},lastMistake:{type:'log'}}])
    assert.equal(practiceOffer(run),null);
});

test('the actual results practice button routes collisions and rehearsal retries correctly', () => {
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const from=source.indexOf("$('practice-again').onclick =");
  const to=source.indexOf('$("run-breakdown").addEventListener',from);
  assert.ok(from>=0&&to>from);
  for (const [run,expected] of [
    [{ended:true,lastMistake:{type:'corner',direction:'right'}},['turn',1]],
    [{ended:true,lastMistake:{type:'log'}},['moves',0]],
    [{practice:{kind:'turn',cornerIndex:1,correct:1}},['turn',0]],
    [{practice:{kind:'turn',cornerIndex:1,correct:0}},['turn',1]],
    [{practice:{kind:'zipline'}},['zipline',0]],
    [{ended:true,retired:true,lastMistake:{type:'log'}},null],
  ]) {
    const button={};let actual=null;
    runInNewContext(source.slice(from,to),{run,practiceOffer,$:()=>button,
      startPractice:(...args)=>{actual=args;}});
    button.onclick();
    assert.deepEqual(actual,expected);
  }
});
