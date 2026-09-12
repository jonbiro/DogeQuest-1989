import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {createRun,act} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';
import {createPracticeRun,practiceCue} from '../src/runner/practice.js';

test('decision cues update between counter ticks and clear as soon as movement begins',()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('// Decision cues follow each rendered frame');
  const end=source.indexOf('if (Math.floor(run.time * 10)',start);
  assert.ok(start>=0&&end>start,'cue update must precede the throttled counter block');
  for(const practice of [false,true]) {
    const run=practice?createPracticeRun({}):createRun(1989);
    let displayed='';
    const context={run,actionCue,practiceCue,setText:(id,text)=>{assert.equal(id,'cue');displayed=text;}};
    run.speed=practice?12:22;
    run.distance=practice?29.5:0;
    if(!practice)run.objects=[{type:'log',lane:1,at:10}];
    run.time=.01;
    runInNewContext(source.slice(start,end),context);
    assert.ok(!displayed.includes('NOW')&&!displayed.includes('↑ JUMP'));
    run.distance+=.2;run.time=.02;
    runInNewContext(source.slice(start,end),context);
    assert.match(displayed,/JUMP/);
    act(run,'jump');run.time=.03;
    runInNewContext(source.slice(start,end),context);
    assert.equal(displayed,practice?'Jumping · wait for landing':'');
    assert.equal(Math.floor(run.time*10),0,'all transitions share one HUD tick');
  }
});
