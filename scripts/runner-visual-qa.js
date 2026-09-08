// Local-only visual fixture. Bundle separately into dist for browser checks;
// the production build never includes this file or exposes mutable run state.
import {createView} from "../src/runner/render.js";
import {createRun,step,act,fillTrack,HAZARDS} from "../src/runner/world.js";
import {CUES,playNotes} from "../src/runner/sound.js";
import {PUPPIES,COSTUMES} from "../src/runner/collection.js";
import * as THREE from 'three';
import {createMochiModel} from '../src/runner/mochi-model.js';
export function mochiPortraitPreview() {
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:9999';document.body.append(canvas);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setSize(window.innerWidth,window.innerHeight,false);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  const scene=new THREE.Scene();scene.background=new THREE.Color('#d6ddd5');
  scene.add(new THREE.HemisphereLight('#f4f1e6','#4e615a',3));
  const key=new THREE.DirectionalLight('#fff1da',3);key.position.set(-3,5,-4);scene.add(key);
  const fill=new THREE.DirectionalLight('#cce1ec',1);fill.position.set(3,2,1);scene.add(fill);
  const model=createMochiModel();scene.add(model.group);
  const camera=new THREE.PerspectiveCamera(31,window.innerWidth/window.innerHeight,.1,20);
  camera.position.set(2.6,2.05,-4.5);camera.lookAt(0,1.02,-.22);
  renderer.render(scene,camera);
  return {geometries:renderer.info.memory.geometries,drawCalls:renderer.info.render.calls};
}
export function movementPreview(reducedMotion=false) {
  const source=document.createElement('canvas');
  source.style.cssText='position:fixed;left:-1000px;width:360px;height:480px';document.body.append(source);
  const view=createView(source),run=createRun(1989),samples=[];
  run.appearance={puppy:'mochi',costume:'scarf'};
  // Empty practice strip isolates movement; the long-run fixture separately
  // verifies real generated obstacles and rewards with the same physics.
  run.objects=[];run.nextRow=Infinity;run.nextChoice=Infinity;run.nextZipline=Infinity;
  const gallery=document.createElement('section');
  gallery.style.cssText='position:fixed;inset:0;z-index:9999;overflow:auto;background:#102a28;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;color:white';document.body.append(gallery);
  function advance(seconds) {
    for(let i=0;i<Math.round(seconds*120);i++) {
      step(run,1/120);view.draw(run,run.time,'playing',reducedMotion,1/120,1);
    }
  }
  function capture(label) {
    const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');
    figure.style.margin='0';canvas.width=300;canvas.height=360;canvas.style.width='100%';
    canvas.getContext('2d').drawImage(source,0,0,300,360);
    caption.textContent=reducedMotion?`${label.split(' · ')[0]} · reduced motion`:label;
    caption.style.cssText='text-align:center;font:14px Arial;padding:6px';
    figure.append(canvas,caption);gallery.append(figure);
    samples.push({label,y:run.y,vy:run.vy,vx:run.vx,slide:run.slide,landing:run.landing});
  }
  act(run,'jump');advance(.3);capture('Takeoff · nose lifts with the jump');
  act(run,'slide');advance(.075);capture('Dive · smooth downward acceleration');
  advance(.175);capture('Touchdown · soft compression');
  advance(.2);capture('Ground slide · full duration retained');
  act(run,'jump');act(run,'right');advance(.1);capture('Steer · bank into the lane');
  act(run,'left');advance(.1);capture('Reverse · controlled momentum');
  return {reducedMotion,samples,...view.diagnostics()};
}
export function wardrobePreview(puppy="biscuit") {
  if(!Object.hasOwn(PUPPIES,puppy))throw new Error("Unknown puppy");
  const source=document.createElement("canvas");
  source.style.cssText="position:fixed;left:-1000px;width:360px;height:480px";
  document.body.append(source);
  const view=createView(source),run=createRun(1989);
  const gallery=document.createElement("section");
  gallery.style.cssText="position:fixed;inset:0;z-index:9999;overflow:auto;background:#102a28;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;color:white";
  document.body.append(gallery);
  for(const [costume,details] of Object.entries(COSTUMES)) {
    // Exercise shared-model resets, not just fresh-renderer appearances.
    view.draw(run,0,"menu",true,1/60,1,{puppy:puppy==="mochi"?"pepper":"mochi",costume:"party"});
    view.draw(run,0,"menu",true,1/60,1,{puppy,costume});
    const figure=document.createElement("figure"),canvas=document.createElement("canvas"),caption=document.createElement("figcaption");
    figure.style.margin="0";canvas.width=320;canvas.height=320;canvas.style.cssText="width:100%;max-height:320px;object-fit:contain";
    canvas.getContext("2d").drawImage(source,source.width*.25,source.height*.4,source.width*2/3,source.height*.5,0,0,320,320);
    caption.textContent=`${PUPPIES[puppy].name} · ${details.name}`;caption.style.cssText="text-align:center;padding:8px;font:14px Arial";
    figure.append(canvas,caption);gallery.append(figure);
  }
  return {puppy,outfits:Object.keys(COSTUMES),...view.diagnostics()};
}
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
export function powerPreview(reducedMotion=false,combined=false) {
  const source=document.createElement('canvas');
  source.style.cssText='position:fixed;left:-1000px;width:360px;height:480px';document.body.append(source);
  const view=createView(source),run=createRun(1989),samples=[];
  run.nextRow=99999;
  const gallery=document.createElement('section');
  gallery.style.cssText='position:fixed;inset:0;z-index:9999;overflow:auto;background:#102a28;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px;color:white';document.body.append(gallery);
  function capture(label) {
    view.draw(run,run.time,'playing',reducedMotion,1/60,1);
    const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');
    figure.style.margin='0';canvas.width=270;canvas.height=360;canvas.style.width='100%';
    canvas.getContext('2d').drawImage(source,0,0,270,360);
    caption.textContent=label;figure.append(canvas,caption);gallery.append(figure);
    samples.push({label,bones:run.bones,magnet:run.magnet,zoomies:run.zoomies,shield:run.shield,double:run.double,pulling:run.objects.filter(o=>o.pull&&!o.used).length});
  }
  if(!combined) {
    for(const [id,type] of ['bone','magnet','shield','gem','double','heart','gift','zoomies'].entries()) {
      run.objects=[{id,type,lane:1,at:12,used:false}];capture(type);
    }
  } else {
    run.objects=['magnet','shield','zoomies','double'].map((type,id)=>({id,type,lane:1,at:.5,used:false}));
    for(let lane=0;lane<3;lane++)run.objects.push({id:10+lane,type:'bone',lane,at:12,used:false});
    for(const target of [.1,.4,6.5,10.5]) {
      while(run.time<target)step(run,1/120);
      capture(`${target}s · ${run.bones} bones`);
    }
    if(samples[0].pulling!==3||samples[0].bones!==0||samples[1].bones!==3||samples[2].zoomies!==0||samples[3].magnet!==0||samples[3].double!==0||samples.some(s=>s.shield!==1))throw new Error('Combined power lifecycle regression');
  }
  return {reducedMotion,combined,samples,...view.diagnostics()};
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
        else if(safe===undefined&&next.at-run.distance<run.speed*.4)act(run,next.type==="gate"?"slide":"jump");
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
  if(summary.peakGeometries>32||summary.peakTextures>4||summary.peakObjects>200||summary.peakDrawCalls>220)throw new Error(`Renderer resource regression: ${JSON.stringify(summary)}`);
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
export function posePauseCheck(puppy="biscuit") {
  const canvas=document.createElement("canvas");
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999";document.body.append(canvas);
  const run=createRun(1989),view=createView(canvas);
  run.appearance={puppy,costume:"scarf"};
  act(run,"jump");
  for(let i=0;i<20;i++){step(run,1/120);view.draw(run,run.time,"playing",false,1/120,1);}
  const before=view.diagnostics().legAngles;
  const bodyBefore=view.diagnostics().bodyTransform;
  for(let i=0;i<60;i++)view.draw(run,run.time,"paused",false,1/60,1);
  const paused=view.diagnostics().legAngles;
  if(JSON.stringify(bodyBefore)!==JSON.stringify(view.diagnostics().bodyTransform))throw new Error("Body weight continued during pause");
  if(JSON.stringify(before)!==JSON.stringify(paused))throw new Error("Leg transitions continued during pause");
  view.draw(run,run.time,"playing",false,1/60,1);
  const resumed=view.diagnostics().legAngles;
  if(JSON.stringify(paused)===JSON.stringify(resumed))throw new Error("Leg transition did not resume");
  return {before,paused,resumed,bodyFrozen:true};
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
export function keyboardCheck() {
  const state=()=>document.querySelector("#game").dataset.state;
  const press=(code,repeat=false)=>window.dispatchEvent(new window.KeyboardEvent("keydown",{code,key:code,repeat,bubbles:true,cancelable:true}));
  const restored=[];
  for(const id of ["help","shop","kennel"]){
    document.getElementById(id).click();
    if(state()!==id)throw new Error(`Could not open ${id}`);
    press("Escape",true);
    if(state()!==id)throw new Error(`Repeated Escape closed ${id}`);
    press("Escape");
    if(state()!=="menu"||document.activeElement.id!==id)throw new Error(`Focus did not return to ${id}`);
    restored.push(id);
  }
  document.querySelector("#play").click();
  press("Escape");
  for(let i=0;i<10;i++)press("Escape",true);
  if(state()!=="paused")throw new Error("Held Escape resumed a paused game");
  press("Escape");
  if(state()!=="playing"||document.activeElement.id!=="scene")throw new Error("Resume did not focus the trail");
  for(let i=0;i<10;i++)press("Escape",true);
  if(state()!=="playing")throw new Error("Held Escape paused a resumed game");
  press("Escape");
  return {restored,heldEscapeIgnored:true,finalState:state()};
}
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
  const ids=["power","cue","route-choice","toast","mission-summary","mission-label","mission-hud","controls"];
  const saved=ids.map(id=>{const element=document.getElementById(id);return {element,html:element.innerHTML,hidden:element.hidden};});
  const state=game.dataset.state,hidden=hud.hidden,classes=hud.className;
  try {
    game.dataset.state="playing";hud.hidden=false;hud.classList.add("has-powers");
    document.querySelector("#controls").hidden=false;
    document.querySelector("#mission-hud").hidden=false;
    document.querySelector("#cue").hidden=false;
    for(const id of ['route-choice','toast','mission-summary'])document.getElementById(id).hidden=true;
    document.querySelector("#cue").textContent="↑ JUMP · ZIPLINE";
    document.querySelector("#route-choice").textContent="GATES IN 100m · ← Scenic · Challenge →";
    document.querySelector("#mission-label").textContent="Trailblazer · 300/300 meters";
    document.querySelector("#power").innerHTML=["🐾 140m","🎾 6s","◇ SHIELD","🧲 19s","×2 10s"].map(label=>`<span class="power-chip">${label}<progress max="10" value="8"></progress></span>`).join("");
    const rect=id=>document.querySelector(id).getBoundingClientRect();
    const issues=[];
    for(const [first,second] of [["#power","#mission-hud"],["#power","#controls"],["#mission-hud","#controls"]]){
      const a=rect(first),b=rect(second);
      if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)issues.push(`${first} overlaps ${second}`);
    }
    for(const id of ["#power","#cue","#mission-hud","#controls"]){const r=rect(id);if(r.top<0||r.bottom>window.innerHeight||r.left<0||r.right>window.innerWidth)issues.push(`${id} outside viewport`);}
    if(rect('#cue').top<window.innerHeight*.65)issues.push('Cue covers the center of the trail');
    return {viewport:[window.innerWidth,window.innerHeight],issues,powerBottom:rect("#power").bottom,cueTop:rect("#cue").top};
  } finally {
    game.dataset.state=state;hud.hidden=hidden;hud.className=classes;
    for(const {element,html,hidden:wasHidden} of saved){if(!['controls','mission-hud','mission-summary'].includes(element.id))element.innerHTML=html;element.hidden=wasHidden;}
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
      gate ||= route.includes("GATES IN");challenge ||= document.querySelector('#run-score').textContent.includes("CHALLENGE");
      if(now-lastAction>250) {
        for (const [first, second] of [["#power","#mission-hud"],["#power","#controls"],["#mission-hud","#controls"]]) {
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
