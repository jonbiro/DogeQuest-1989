// Local-only sustained full-app benchmark. Never bundled into production.
// Uses the production clock, renderer, HUD and audio, but an automated driver.
import {readFile,writeFile} from 'node:fs/promises';
import {URL} from 'node:url';
import {build} from 'esbuild';
const root=new URL('../',import.meta.url);
let source=await readFile(new URL('src/runner/app.js',root),'utf8');
for(const [from,to] of [
  ['readStoredProfile(localStorage)','({value:null,available:false,readable:false})'],
  ['writeStoredProfile(localStorage,saved,profileReadable)','false'],
  ['installOfflineSupport();',''],
  ['time += dt;','time += dt; sustainedTick(frameDt);'],
  ['view.draw(run, time, state, reducedMotion, dt, accumulator / (1 / 120), saved.collection, frameDt);',
    '{ const drawStart=performance.now(); view.draw(run, time, state, reducedMotion, dt, accumulator / (1 / 120), saved.collection, frameDt); sustainedRendered(performance.now()-drawStart); }'],
  ['else step(run, 1 / 120);','else { if(sustained.active)sustainedDrive(); step(run, 1 / 120); }'],
  ['for (const event of run.events) {',"for (const event of run.events) { if(sustained.active&&event==='hit')sustained.hits++;"],
]){
  if(!source.includes(from))throw Error('Fixture hook drift: '+from);
  source=source.replace(from,to);
}
source=`import {HAZARDS as QA_HAZARDS} from './world.js';\nimport {areaAt as qaAreaAt} from './areas.js';\nimport {recordHitch as qaHitch} from '../../scripts/runner-hitch-log.js';\n`+source;
source+=`
const sustained={active:false,elapsed:0,frames:[],hits:0,areas:new Set(),peakDrawCalls:0,hitches:{count:0,worst:[]},previousCPU:null};
function sustainedRendered(drawCPU){
  if(!sustained.active)return;
  const sample=view.diagnostics();
  if(sample.drawCalls>sustained.peakDrawCalls){
    sustained.peakDrawCalls=sample.drawCalls;
    sustained.peak={distance:run.distance,area:qaAreaAt(run.distance),drawCalls:sample.drawCalls,active:sample.activeObjects,pooled:sample.pooledObjects};
  }
  const cpu={updateCPU:performance.now()-sustained.frameStart-drawCPU,drawCPU};
  qaHitch(sustained.hitches,{phase:'game',elapsed:sustained.elapsed,interval:sustained.interval,
    warmup:sustained.elapsed<2,distance:run.distance,...cpu,previousCPU:sustained.previousCPU});
  sustained.previousCPU=cpu;
}
function sustainedDrive(){
  const corner=turnPrompt(run),locked=Boolean(corner);
  if(corner&&corner.status!=='accepted')act(run,corner.direction);
  const cable=run.objects.find(o=>o.type==='zipline-start'&&!o.caught&&o.at>run.distance&&o.at-run.distance<run.speed*.4);
  if(cable)act(run,'jump');
  if(run.zipline&&!locked){
    const treat=run.objects.find(o=>o.airborne&&!o.used&&o.at>run.distance-1.8);
    if(treat&&treat.at-run.distance<12&&treat.lane!==run.lane)act(run,treat.lane>run.lane?'right':'left');
  }
  if(!locked&&run.choicePending!==null&&run.choicePending-run.distance<35)act(run,'right');
  const next=run.objects.find(o=>QA_HAZARDS.includes(o.type)&&o.at>run.distance&&o.at-run.distance<24);
  if(next){
    const blocked=new Set(run.objects.filter(o=>o.at===next.at&&QA_HAZARDS.includes(o.type)).map(o=>o.lane));
    const safe=[0,1,2].find(lane=>!blocked.has(lane));
    if(!locked&&safe!==undefined&&safe!==run.lane)act(run,safe<run.lane?'left':'right');
    else if(safe===undefined&&next.at-run.distance<run.speed*.4){
      const occupied=run.objects.find(o=>o.at===next.at&&o.lane===run.lane&&QA_HAZARDS.includes(o.type));
      act(run,['gate','branch','arch'].includes(occupied.type)?'slide':'jump');
    }
  }
  if(fetchReady(run))act(run,'fetch');
}
function sustainedTick(frameDt){
  if(!sustained.active)return;
  sustained.frameStart=performance.now();sustained.interval=frameDt*1000;
  sustained.elapsed+=Math.max(0,frameDt);
  sustained.areas.add(qaAreaAt(run.distance));
  if(sustained.elapsed>2)sustained.frames.push(frameDt*1000);
  const interrupted=document.hidden||state!=='playing';
  if(sustained.elapsed<180&&!run.ended&&!interrupted)return;
  sustained.active=false;
  const sorted=sustained.frames.slice().sort((a,b)=>a-b);
  const pct=p=>sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
  const result={elapsed:sustained.elapsed,frames:sorted.length,medianMs:pct(.5),p95Ms:pct(.95),p99Ms:pct(.99),
    over50ms:sorted.filter(ms=>ms>50).length,maxMs:sorted.at(-1),interrupted,ended:run.ended,
    distance:run.distance,areas:[...sustained.areas],turns:run.turns,missedTurns:run.missedTurns,
    ziplines:run.ziplines,rafts:run.rafts,bones:run.bones,hits:sustained.hits,
    peak:sustained.peak,hitches:sustained.hitches,renderer:view.diagnostics(),audioEnabled:sound};
  pause();
  const report=document.createElement('pre');report.id='sustained-result';
  report.style.cssText='position:fixed;inset:0;z-index:999;background:#102b36;color:white;overflow:auto;padding:24px;font-size:14px;white-space:pre-wrap';
  const summary={...result};delete summary.renderer;delete summary.hitches;
  report.textContent=JSON.stringify(summary,null,2);document.body.append(report);
  const details=document.createElement('button');details.textContent='Show frame stalls';
  details.style.cssText='position:fixed;bottom:8px;right:8px;z-index:1000;padding:12px';
  details.onclick=()=>{report.textContent=JSON.stringify(result.hitches,null,2);report.scrollTop=0;};document.body.append(details);
}
const sustainedButton=document.createElement('button');
sustainedButton.textContent='Run 3-minute portrait benchmark';
sustainedButton.onclick=()=>{
  sharedSeed=1989;sharedVersion=4;saved.collection.puppy='mochi';
  start();if(state!=='playing')throw Error('Wait for graphics preparation');
  sound=true;tone('ready');
  Object.assign(sustained,{active:true,elapsed:0,frames:[],hits:0,areas:new Set(),peakDrawCalls:0,hitches:{count:0,worst:[]},previousCPU:null});
};
document.getElementById('menu').append(sustainedButton);
`;
await build({stdin:{contents:source,resolveDir:new URL('src/runner/',root).pathname,sourcefile:'sustained-qa.js'},
  bundle:true,format:'esm',outfile:new URL('dist/runner/sustained-qa.js',root).pathname});
const html=(await readFile(new URL('runner/index.html',root),'utf8')).replace('src="game.js"','src="sustained-qa.js"');
await writeFile(new URL('dist/runner/sustained-qa.html',root),html);
console.log('Local fixture: /runner/sustained-qa.html; no profile writes or service worker');
