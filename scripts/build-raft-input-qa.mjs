// Local-only full-app fixture: real event handlers, manually advanced simulation.
// Never included by the production build; profile reads/writes and SW are disabled.
import {readFile,writeFile} from 'node:fs/promises';
import {URL} from 'node:url';
import {build} from 'esbuild';
const root=new URL('../',import.meta.url);
let source=await readFile(new URL('src/runner/app.js',root),'utf8');
for(const [from,to] of [
  ['readStoredProfile(localStorage)','({value:null,available:false,readable:false})'],
  ['writeStoredProfile(localStorage,saved,profileReadable)','false'],
  ['installOfflineSupport();',''],
  ['accumulator += resumeStep(run, dt);','accumulator += riverPerf.active ? resumeStep(run, dt) : 0;'],
  ['time += dt;','time += dt; riverPerfTick(frameDt);'],
  ['for (const event of run.events) {',"for (const event of run.events) { if(riverPerf.active&&['hit','shield-break'].includes(event))riverPerf.hits++;"],
]){
  if(!source.includes(from))throw Error(`Fixture hook drift: ${from}`);
  source=source.replace(from,to);
}
source+=`
const riverPerf={active:false,elapsed:0,frames:[],rides:0,bones:0,hits:0};
function riverPerfTick(frameDt){
  if(!riverPerf.active)return;
  if(document.hidden||state!=='playing'){
    riverPerf.active=false;window.riverPerfResult={error:'Benchmark interrupted; keep the page visible and running'};return;
  }
  riverPerf.elapsed+=Math.max(0,frameDt);
  if(riverPerf.elapsed>2&&riverPerf.frames.length<12000)riverPerf.frames.push(frameDt*1000);
  if(run.distance>=1300||run.ended){
    riverPerf.rides+=run.rafts||0;riverPerf.bones+=run.bones;
    window.raftInputQA.prepare();
  }
  const cue=actionCue(run);
  if(cue.startsWith('←'))act(run,'left');
  if(cue.startsWith('→'))act(run,'right');
  if(riverPerf.elapsed>=32){
    riverPerf.active=false;
    const sorted=[...riverPerf.frames].sort((a,b)=>a-b);
    const percentile=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
    window.riverPerfResult={elapsed:riverPerf.elapsed,frames:sorted.length,
      medianMs:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),
      over50ms:sorted.filter(ms=>ms>50).length,rides:riverPerf.rides,
      bones:riverPerf.bones,hits:riverPerf.hits,renderer:view.diagnostics()};
    pause();
    const result=window.riverPerfResult;
    document.getElementById('overlay-copy').textContent=
      result.frames+' frames. Median '+result.medianMs.toFixed(1)+' ms; p95 '+result.p95Ms.toFixed(1)+
      ' ms; p99 '+result.p99Ms.toFixed(1)+' ms. Over 50 ms: '+result.over50ms+
      '. Crossings: '+result.rides+'. Bones: '+result.bones+'. Hits: '+result.hits+'.';
  }
}
window.raftInputQA={
  benchmark(){
    this.prepare();Object.assign(riverPerf,{active:true,elapsed:0,frames:[],rides:0,bones:0,hits:0});
    window.riverPerfResult={running:true};
  },
  prepare(){
    start(); if(state!=='playing')throw Error('Graphics not ready');
    Object.assign(run,{raftPrototype:true,distance:1090,nextRow:1090,objects:[],
      nextChoice:1750,nextZipline:2050,course:null,route:{kind:'challenge',until:1270}});
    run.previous.distance=1090; lastHud=-1;
    return this.snapshot();
  },
  advance(seconds){
    if(state!=='playing')throw Error('Run is not playing');
    for(let i=0;i<Math.round(seconds*120)&&!run.ended;i++){
      accumulator+=resumeStep(run,1/120);
      while(accumulator+1e-12>=1/120&&!run.ended){
        if(run.practice)stepPractice(run,1/120);else step(run,1/120);
        accumulator-=1/120;
      }
    }
    lastHud=-1;return this.snapshot();
  },
  snapshot(){return {state,distance:run.distance,lane:run.lane,x:run.x,y:run.y,
    raft:Boolean(run.raft),rafts:run.rafts||0,hearts:run.hearts,bones:run.bones,
    cue:actionCue(run),jumpBuffer:run.jumpBuffer,slide:run.slide};}
};
const benchmarkButton=document.createElement('button');
benchmarkButton.textContent='Run 30-second river benchmark';
benchmarkButton.onclick=()=>window.raftInputQA.benchmark();
document.getElementById('menu').append(benchmarkButton);
const practiceButton=document.createElement('button');
practiceButton.textContent='QA river lesson';
practiceButton.onclick=()=>startPractice('raft');
document.getElementById('menu').append(practiceButton);
const clockButton=document.createElement('button');
clockButton.textContent='QA advance 3 seconds';
clockButton.style.cssText='position:fixed;top:45%;left:0;z-index:100;font-size:10px;padding:4px';
clockButton.onclick=()=>window.raftInputQA.advance(3);
document.body.append(clockButton);
const inputReport=document.createElement('output');
inputReport.style.cssText='position:fixed;top:22%;left:0;z-index:100;background:#102b36;color:white;padding:4px;font-size:12px';
document.body.append(inputReport);
window.setInterval(()=>{
  inputReport.textContent='QA lane '+(run.lane+1)+' · x '+run.x.toFixed(1)+' · '+(run.raft?'raft':'ground')+' · '+Math.floor(run.distance)+'m';
},100);
`;
await build({stdin:{contents:source,resolveDir:new URL('src/runner/',root).pathname,sourcefile:'raft-input-qa.js'},
  bundle:true,format:'esm',outfile:new URL('dist/runner/raft-input-qa.js',root).pathname});
const html=(await readFile(new URL('runner/index.html',root),'utf8'))
  .replace('src="game.js"','src="raft-input-qa.js"');
await writeFile(new URL('dist/runner/raft-input-qa.html',root),html);
console.log('Local fixture: /runner/raft-input-qa.html (simulation clock is manual)');
