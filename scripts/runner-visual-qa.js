// Local-only visual fixture. Bundle separately into dist for browser checks;
// the production build never includes this file or exposes mutable run state.
import {createView} from "../src/runner/render.js";
import {createRun,step,act,fillTrack,HAZARDS} from "../src/runner/world.js";
import {CUES,playNotes} from "../src/runner/sound.js";
export function previewZoomies(reducedMotion=false,distance=0,gap=false) {
  const canvas=document.createElement("canvas");
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999";
  document.body.append(canvas);
  const run=createRun(1989);
  run.distance=distance;run.previous.distance=distance;
  run.appearance={puppy:"mochi",costume:"hero"};
  run.zoomies=6;run.magnet=6;run.nextRow=99999;
  run.objects=[{id:1,type:"zoomies",lane:0,at:distance+16},{id:2,type:"log",lane:1,at:distance+24},{id:3,type:"bone",lane:2,at:distance+12}];
  if(gap) run.objects=[0,1,2].map(lane=>({id:lane,type:"gap",lane,at:Math.round((distance+25)/5)*5}));
  const view=createView(canvas);
  for(let i=0;i<30;i++)step(run,1/120);
  view.draw(run,run.time,"playing",reducedMotion,1/60,1);
  return {zoomies:run.zoomies,speed:run.speed,bones:run.bones};
}
export function longRunCheck() {
  const canvas=document.createElement("canvas");
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999";
  document.body.append(canvas);
  const view=createView(canvas),samples=[];
  let completedZiplines=0;
  for(let attempt=0;attempt<3;attempt++) {
    const run=createRun(1989+attempt);
    run.appearance={puppy:["biscuit","mochi","pepper"][attempt],costume:["scarf","hero","explorer"][attempt]};
    let nextSample=250;
    while(run.distance<4500 && !run.ended) {
      const cable=run.objects.find(o=>o.type==="zipline-start"&&!o.caught&&o.at>run.distance&&o.at-run.distance<run.speed*.4);
      if(cable)act(run,"jump");
      if(run.zipline) {
        const treat=run.objects.find(o=>o.airborne&&!o.used&&o.at>run.distance-1.8);
        if(treat&&treat.at-run.distance<12&&treat.lane!==run.lane)act(run,treat.lane>run.lane?"right":"left");
      }
      if(run.choicePending!==null && run.choicePending-run.distance<35)act(run,attempt===1?"right":"left");
      const next=run.objects.find(o=>HAZARDS.includes(o.type)&&o.at>run.distance&&o.at-run.distance<24);
      if(next) {
        const blocked=new Set(run.objects.filter(o=>o.at===next.at&&HAZARDS.includes(o.type)).map(o=>o.lane));
        const safe=[0,1,2].find(lane=>!blocked.has(lane));
        if(safe!==undefined && safe!==run.lane)act(run,safe<run.lane?"left":"right");
        else if(safe===undefined&&next.at-run.distance<run.speed*.6)act(run,next.type==="gate"?"slide":"jump");
      }
      step(run,1/120);run.events=[];
      if(run.distance>=nextSample) {
        view.draw(run,run.time,"playing",attempt===2,1/60,1);
        samples.push({attempt,distance:Math.floor(run.distance),hearts:run.hearts,...view.diagnostics()});
        nextSample+=250;
      }
    }
    if(run.ended)throw new Error(`Input-driven run ended at ${run.distance} on seed ${run.seed}`);
    if(run.ziplines!==3)throw new Error(`Expected three zipline finishes, got ${run.ziplines}`);
    completedZiplines+=run.ziplines;
  }
  const peak=key=>Math.max(...samples.map(sample=>sample[key]));
  const summary={runs:3,metersPerRun:4500,completedZiplines,renderedCheckpoints:samples.length,minimumHearts:Math.min(...samples.map(sample=>sample.hearts)),peakGeometries:peak("geometries"),peakTextures:peak("textures"),peakDrawCalls:peak("drawCalls"),peakObjects:Math.max(...samples.map(sample=>sample.activeObjects+sample.pooledObjects)),final:samples.at(-1)};
  if(summary.peakGeometries>32||summary.peakTextures>4||summary.peakObjects>200)throw new Error(`Renderer resource regression: ${JSON.stringify(summary)}`);
  return summary;
}
export function previewGates() {
  const canvas=document.createElement("canvas");
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999";document.body.append(canvas);
  const run=createRun(1989);run.distance=325;run.previous.distance=325;fillTrack(run);
  createView(canvas).draw(run,1,"playing",true,1/60,1);
  return {gateAt:run.choicePending};
}
export function previewZipline(distance=700,reducedMotion=false) {
  const canvas=document.createElement("canvas");
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999";document.body.append(canvas);
  const run=createRun(1989);
  Object.assign(run,{distance:610,nextRow:610,nextChoice:1050,choicePending:null,objects:[]});
  fillTrack(run);
  const view=createView(canvas);
  let jumped=false;
  while(run.distance<distance) {
    if(!jumped && 650-run.distance<run.speed*.4){act(run,"jump");jumped=true;}
    if(run.zipline && run.distance>680)act(run,"right");
    step(run,1/120);run.events=[];
    view.draw(run,run.time,"playing",reducedMotion,1/120,1);
  }
  return {distance:run.distance,zipline:run.zipline,y:run.y,hearts:run.hearts,...view.diagnostics()};
}
export async function audioCheck() {
  const results=[];
  for(const [name,notes] of Object.entries(CUES)) {
    const context=new window.OfflineAudioContext(1,44100,44100);
    playNotes(context,notes);
    const buffer=await context.startRendering(),samples=buffer.getChannelData(0);
    let peak=0,energy=0;
    for(const sample of samples){if(!Number.isFinite(sample))throw new Error(`Invalid sample: ${name}`);peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;}
    if(peak<=0||peak>=.2||energy===0)throw new Error(`Invalid audio output: ${name}`);
    results.push({name,peak,rms:Math.sqrt(energy/samples.length)});
  }
  return results;
}
// Long browser evaluations may be retried by automation clients. Start once,
// return immediately, and poll the status to avoid overlapping test runs.
let uiCheckStatus = null;
export function startUiPlayCheck(seconds=34) {
  if (uiCheckStatus?.status === "running") return uiCheckStatus;
  uiCheckStatus = {status:"running"};
  uiPlayCheck(seconds).then(result => {uiCheckStatus={status:"complete",result};}, error => {uiCheckStatus={status:"failed",message:String(error)};});
  return uiCheckStatus;
}
export function readUiPlayCheck() { return uiCheckStatus; }
export function dialogLayoutCheck() {
  const content=document.querySelector(".modal-content");
  const actions=[...document.querySelectorAll(".modal-actions button")].filter(button=>!button.hidden).map(button=>{
    const rect=button.getBoundingClientRect();
    const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    if(rect.top<0||rect.bottom>window.innerHeight||!button.contains(hit))throw new Error(`Dialog action is clipped or covered: ${button.id}`);
    return {id:button.id,top:rect.top,bottom:rect.bottom};
  });
  return {viewport:[window.innerWidth,window.innerHeight],scrollable:content.scrollHeight>content.clientHeight,actions};
}
// UI-only stress case: maximum simultaneous indicators, not an earned game state.
export function hudStressCheck() {
  const game=document.querySelector("#game"),hud=document.querySelector("#hud");
  const ids=["power","cue","route-choice","mission-label","controls"];
  const saved=ids.map(id=>{const element=document.getElementById(id);return {element,html:element.innerHTML,hidden:element.hidden};});
  const state=game.dataset.state,hidden=hud.hidden,classes=hud.className;
  try {
    game.dataset.state="playing";hud.hidden=false;hud.classList.add("has-powers");
    document.querySelector("#controls").hidden=false;
    document.querySelector("#cue").textContent="↑ JUMP to grab the zipline";
    document.querySelector("#route-choice").textContent="GATES IN 100m · ← Scenic · Challenge +60 → (center: scenic)";
    document.querySelector("#mission-label").textContent="Trailblazer · 300/300 meters";
    document.querySelector("#power").innerHTML=["🐾 SKY PAWS · 140m","🎾 ZOOMIES · 6s","◇ SHIELD · One hit protected","🧲 MAGNET · 19s","×2 BONE POINTS · 10s"].map(label=>`<span class="power-chip">${label}<small>Power description</small><progress max="10" value="8"></progress></span>`).join("");
    const rect=id=>document.querySelector(id).getBoundingClientRect();
    const issues=[];
    for(const [first,second] of [["#power","#cue"],["#power","#mission-hud"],["#power","#controls"],["#cue","#mission-hud"],["#cue","#controls"]]){
      const a=rect(first),b=rect(second);
      if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)issues.push(`${first} overlaps ${second}`);
    }
    for(const id of ["#power","#cue","#mission-hud","#controls"]){const r=rect(id);if(r.top<0||r.bottom>window.innerHeight||r.left<0||r.right>window.innerWidth)issues.push(`${id} outside viewport`);}
    return {viewport:[window.innerWidth,window.innerHeight],issues,powerBottom:rect("#power").bottom,cueTop:rect("#cue").top};
  } finally {
    game.dataset.state=state;hud.hidden=hidden;hud.className=classes;
    for(const {element,html,hidden:wasHidden} of saved){if(element.id!=="controls")element.innerHTML=html;element.hidden=wasHidden;}
  }
}
export function uiPlayCheck(seconds=22) {
  return new Promise(resolve=>{
    document.querySelector("#pause-button").click();
    document.querySelector("#home").click();
    document.querySelector("#play").click();
    const started=performance.now(),frames=[];
    const regions = new Set(), layoutIssues = new Set();
    let last=started,lastAction=0,gate=false,challenge=false,zipline=false,landed=false;
    function tick(now) {
      frames.push(now-last);last=now;
      const state=document.querySelector("#game").dataset.state;
      const route=document.querySelector("#route-choice").textContent;
      const cue=document.querySelector("#cue").textContent;
      regions.add(document.querySelector("#region-name").textContent);
      zipline ||= document.querySelector("#scene").dataset.posture === "zipline";
      landed ||= zipline && document.querySelector("#toast").textContent.includes("Zipline complete");
      gate ||= route.includes("GATES IN");challenge ||= route.includes("CHALLENGE");
      if(now-lastAction>250) {
        for (const [first, second] of [["#power","#cue"],["#power","#mission-hud"],["#power","#controls"],["#cue","#mission-hud"],["#cue","#controls"]]) {
          const a=document.querySelector(first).getBoundingClientRect(),b=document.querySelector(second).getBoundingClientRect();
          if(a.width && a.height && b.width && b.height && a.left<b.right && a.right>b.left && a.top<b.bottom && a.bottom>b.top)layoutIssues.add(`${first} overlaps ${second}`);
        }
        const code=cue.includes("SLIDE")?"ArrowDown":cue.includes("JUMP")?"ArrowUp":route.includes("GATES IN")?"ArrowRight":null;
        if(code){window.dispatchEvent(new window.KeyboardEvent("keydown",{code,key:code,bubbles:true}));lastAction=now;}
      }
      if(now-started>=seconds*1000||state!=="playing") {
        document.querySelector("#pause-button").click();
        const sorted=[...frames].sort((a,b)=>a-b);
        resolve({state,viewport:[window.innerWidth,window.innerHeight],endDistance:document.querySelector("#distance").textContent,frames:frames.length,meanMs:frames.reduce((a,b)=>a+b,0)/frames.length,p95Ms:sorted[Math.floor(sorted.length*.95)],regions:[...regions],layoutIssues:[...layoutIssues],gatePromptSeen:gate,challengeSelected:challenge,ziplineCaught:zipline,ziplineLanded:landed,hearts:document.querySelector("#hearts").getAttribute("aria-label")});
        return;
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  });
}
