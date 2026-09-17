import test from 'node:test';
import assert from 'node:assert/strict';
import {practiceOffer} from '../src/runner/practice.js';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {URL} from 'node:url';

test('help exposes and routes every practice skill without requiring a failed run',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const practiceSource=readFileSync(new URL('../src/runner/practice.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../runner/index.html',import.meta.url),'utf8');
  const britishVerb=/Prac(?:tise|tised)/;
  assert.doesNotMatch(source,britishVerb);
  assert.doesNotMatch(practiceSource,britishVerb);
  assert.doesNotMatch(html,britishVerb);
  const from=source.indexOf("$('practice-start').onclick"),to=source.indexOf("$('practice-again').onclick",from);
  const buttons=new Map();let selected;
  runInNewContext(source.slice(from,to),{$:id=>{const node={};buttons.set(id,node);return node;},startPractice:kind=>selected=kind});
  for(const [suffix,kind] of [['start','moves'],['jump','jump'],['slide','slide'],['gap','gap'],['weave','weave'],['zipline','zipline'],['turn','turn']]){
    const id=`practice-${suffix}`;
    assert.ok(html.includes(`id="${id}"`));buttons.get(id).onclick();assert.equal(selected,kind);
  }
});

test('collision results offer relevant practice without guessing an unsupported lesson', () => {
  for (const [direction,cornerIndex] of [['left',0],['right',1]])
    assert.deepEqual(practiceOffer({ended:true,lastMistake:{type:'corner',direction}}),
      {kind:'turn',cornerIndex,label:'Practice this turn'});
  for (const [type,kind] of [['log','jump'],['rock','moves'],['arch','slide'],['branch','slide'],['gate','slide']])
    assert.equal(practiceOffer({ended:true,lastMistake:{type}}).kind,kind);
  for (const run of [{}, {ended:true}, {ended:true,lastMistake:{type:'corner'}},
    {ended:true,lastMistake:{type:'unknown'}},
    {ended:false,lastMistake:{type:'log'}},
    {ended:true,retired:true,lastMistake:{type:'log'}},
    {ended:true,practice:{},lastMistake:{type:'log'}}])
    assert.equal(practiceOffer(run),null);
});

test('the actual results practice button routes collisions and rehearsal retries correctly', () => {
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const from=source.indexOf("$('practice-again').onclick =");
  const to=source.indexOf('const runBreakdown = $("run-breakdown")',from);
  assert.ok(from>=0&&to>from);
  for (const [run,expected] of [
    [{ended:true,lastMistake:{type:'corner',direction:'right'}},['turn',1]],
    [{ended:true,lastMistake:{type:'log'}},['jump',0]],
    [{ended:true,lastMistake:{type:'branch'}},['slide',0]],
    [{practice:{kind:'jump'}},['jump',0]],
    [{practice:{kind:'slide'}},['slide',0]],
    [{ended:true,lastMistake:{type:'gap'}},['gap',0]],
    [{ended:true,lastMistake:{type:'rock',courseWeave:true}},['weave',0]],
    [{practice:{kind:'weave'}},['weave',0]],
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
