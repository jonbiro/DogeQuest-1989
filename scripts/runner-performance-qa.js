// Standalone developer fixture: bundle into a blank page, never the production
// app. No saves, purchases, synthetic user records or background game loop.
import {createView} from '../src/runner/render.js';
import {createRun,step,act} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';
import {recordHitch} from './runner-hitch-log.js';

function summary(values) {
  const sorted=values.slice().sort((a,b)=>a-b);
  if(!sorted.length)return {samples:0};
  return {samples:sorted.length,mean:values.reduce((a,b)=>a+b,0)/values.length,
    p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],
    max:sorted.at(-1),over50:values.filter(value=>value>50).length};
}

export function startPerformanceCheck({seconds=8,warmup=1,prepare=false}={}) {
  if(!Number.isFinite(seconds)||seconds<2||seconds>30||!Number.isFinite(warmup)||warmup<0||warmup>5)
    throw Error('Use a 2–30 second sample and 0–5 second warmup');
  if(document.querySelector('#game'))throw Error('Use a blank standalone page, not the running app');
  if(document.querySelector('canvas[data-performance-fixture]'))throw Error('Reload the fixture page before another measurement');
  const setupStarted=performance.now();
  const canvas=document.createElement('canvas');
  canvas.dataset.performanceFixture='true';
  canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh';
  document.body.append(canvas);
  const view=createView(canvas),run=createRun(1989);
  const result={status:'running',phase:'idle',phases:[],visibilityInterrupted:false,
    setupCPU:performance.now()-setupStarted,hitches:{count:0,worst:[]}};
  let phase=0,start=null,last=null,accumulator=0,lastCue='';
  let intervals=[],updates=[],draws=[];
  let warmUpdates=[],warmDraws=[],previousCPU=null;
  function frame(now) {
    if(document.hidden)result.visibilityInterrupted=true;
    if(start===null)start=now;
    const elapsed=(now-start)/1000;
    const interval=last===null?0:now-last;
    last=now;
    const before=performance.now();
    if(phase===1) {
      accumulator+=Math.min(.1,interval/1000);
      while(accumulator>=1/120) {
        const cue=actionCue(run);
        if(cue!==lastCue) {
          lastCue=cue;
          const action=cue.includes('LEFT')?'left':cue.includes('RIGHT')?'right':
            cue.includes('SLIDE')?'slide':cue.includes('JUMP')?'jump':null;
          if(action&&!cue.includes('SET'))act(run,action);
        }
        step(run,1/120);accumulator-=1/120;
      }
    }
    const updated=performance.now();
    if(phase===1)view.draw(run,run.time,'playing',false,Math.min(.1,interval/1000),accumulator/(1/120));
    const drawn=performance.now();
    const cpu={updateCPU:updated-before,drawCPU:drawn-updated};
    recordHitch(result.hitches,{phase:phase===0?'idle':'game',elapsed,interval,
      warmup:elapsed<warmup,distance:run.distance,...cpu,previousCPU});
    previousCPU=cpu;
    if(elapsed<warmup) {warmUpdates.push(cpu.updateCPU);warmDraws.push(cpu.drawCPU);}
    if(elapsed>=warmup&&interval>0) {
      intervals.push(interval);updates.push(updated-before);draws.push(drawn-updated);
    }
    if(elapsed<warmup+seconds) {requestAnimationFrame(frame);return;}
    result.phases.push({phase:phase===0?'idle':'game',interval:summary(intervals),
      updateCPU:summary(updates),drawCPU:summary(draws),distance:run.distance,
      warmupCPU:{update:summary(warmUpdates),draw:summary(warmDraws)},
      ...(phase===1?{renderer:view.diagnostics(),ended:run.ended}:{}) });
    if(phase===0) {
      phase=1;result.phase='game';start=null;last=null;
      intervals=[];updates=[];draws=[];warmUpdates=[];warmDraws=[];previousCPU=null;
      requestAnimationFrame(frame);
    } else {
      result.status='done';result.phase='done';
      // Safari inspection may select an isolated JavaScript world. Store the
      // completed read-only report in the shared DOM for reliable retrieval.
      document.body.dataset.performanceResult=JSON.stringify(result);
      console.log('Biscuit performance check',JSON.stringify(result));
    }
  }
  if(prepare) {
    result.phase='preparing';const started=performance.now();
    view.prepareShaders().then(ready=>{
      result.preparation={ready,wallMs:performance.now()-started};
      result.phase='idle';requestAnimationFrame(frame);
    });
  } else requestAnimationFrame(frame);
  return result;
}
