import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {setImmediate} from 'node:timers';
import {createRun,step} from '../src/runner/world.js';
import {createPracticeRun,stepPractice} from '../src/runner/practice.js';
import {resumeStep} from '../src/runner/resume.js';
import {installTiltControls} from '../src/runner/tilt-controls.js';

test('real frame simulation waits for motion permission and never catches up the waiting time',async()=>{
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf('function frame(now) {');
  const end=source.indexOf('    for (const event of run.events)',start);
  assert.ok(start>=0&&end>start);
  const simulation=source.slice(start,end)+'}}';
  for(const practice of [false,true])for(const result of ['granted','denied','error']){
    let resolve,reject;
    const host={isSecureContext:true,matchMedia:()=>({matches:true}),
      DeviceOrientationEvent:{requestPermission:()=>new Promise((yes,no)=>{resolve=yes;reject=no;})},
      performance:{now:()=>0},setTimeout:()=>1,clearTimeout(){},addEventListener(){},removeEventListener(){}};
    const tilt=installTiltControls(host,{toggle:{setAttribute(){}},recenter:{},message:{},
      canSteer:()=>true,onAction(){}});
    const run=practice?createPracticeRun({}):createRun(1989);
    const context={run,tilt,state:'playing',last:0,time:0,accumulator:0,step,stepPractice,resumeStep};
    runInNewContext(simulation,context);
    const before=JSON.stringify(run);
    tilt.enableDefault();
    for(let frame=1;frame<=600;frame++)context.frame(frame*1000/60);
    assert.equal(JSON.stringify(run),before,`${practice}/${result}: ten seconds pending must not change the run`);
    assert.equal(context.accumulator,0);
    if(result==='error')reject(new Error('permission unavailable'));else resolve(result);
    await new Promise(done=>setImmediate(done));
    assert.equal(tilt.isRequesting(),false);
    const distance=run.distance;
    context.frame(10000+1000/60);
    assert.ok(run.distance>distance,'simulation resumes after every permission outcome');
    assert.ok(run.distance-distance<1,'waiting time is never replayed as movement');
    assert.equal(run.hearts,3);
    tilt.stop();
  }
});
