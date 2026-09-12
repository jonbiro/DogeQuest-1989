// Local-only visual fixture. Bundle separately into dist for browser checks;
// the production build never includes this file or exposes mutable run state.
import {createView} from "../src/runner/render.js";
import {createRun,step,act,fillTrack,HAZARDS} from "../src/runner/world.js";
import {CUES,playNotes} from "../src/runner/sound.js";
import {portraitControlIssues} from './runner-portrait-layout.mjs';
import {PUPPIES,COSTUMES} from "../src/runner/collection.js";
import {UPGRADES} from '../src/runner/progression.js';
import {turnPrompt,upcomingCorner,cornersBetween} from "../src/runner/turns.js";
import * as THREE from 'three';
import {createMochiModel} from '../src/runner/mochi-model.js';
import {createPowerHud} from '../src/runner/power-hud.js';
import {checkRendererResources} from './runner-resource-budget.js';
export function routeDetourPreview(kind='scenic',distance=435) {
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:9999';document.body.append(canvas);
  const view=createView(canvas);
  function draw(routeKind,at) {
    const run=createRun(1989);
    Object.assign(run,{distance:at,nextRow:at+30,objects:[],nextChoice:1050,nextZipline:650,
      choicePending:null,lastCourseVisit:Math.floor(at/450),route:{kind:routeKind,until:570},
      appearance:{puppy:'mochi',costume:'none'}});
    run.previous={x:run.x,y:run.y,distance:run.distance};fillTrack(run);
    view.draw(run,0,'paused',true,1/60,1);
    return {kind:routeKind,distance:at,...view.diagnostics()};
  }
  return {initial:draw(kind,distance),draw};
}
export function overheadApproachPreview(ahead=35) {
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:9999';document.body.append(canvas);
  const view=createView(canvas),run=createRun(1989);
  Object.assign(run,{distance:210,objects:[],appearance:{puppy:'mochi',costume:'none'}});
  run.previous={x:run.x,y:run.y,distance:run.distance};
  function draw(distanceAhead) {
    run.objects=['arch','gate','branch'].map((type,lane)=>({id:lane,type,lane,at:run.distance+distanceAhead,used:false}));
    view.draw(run,0,'paused',true,1/60,1);
    return {ahead:distanceAhead,...view.diagnostics()};
  }
  return {initial:draw(ahead),draw};
}
export function boneBatchPreview() {
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:9999';
  document.body.append(canvas);
  const run=createRun(1989);
  run.distance=610;run.objects=[];
  run.previous={x:run.x,y:run.y,distance:run.distance};
  for(let i=0;i<60;i++)run.objects.push({id:i,type:'bone',lane:i%3,at:614+Math.floor(i/3)*4,used:false,airborne:i>=48});
  run.objects[0].pull={fromX:-2.4,fromY:1.1,fromAt:614,elapsed:.2,duration:.5};
  run.objects[1].used=true;
  const view=createView(canvas);
  view.draw(run,0,'paused',true,1/60,1);
  const populated=view.diagnostics();
  const verifyReset=()=>{
    run.objects=[];view.draw(run,0,'paused',true,1/60,1);
    return view.diagnostics();
  };
  return {populated,verifyReset};
}
export function contactShadowPreview(overGap=false) {
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:9999';
  document.body.append(canvas);
  const run=createRun(1989);
  Object.assign(run,{distance:35,y:1.6,vy:0,objects:[],appearance:{puppy:'mochi',costume:'none'}});
  run.previous={x:run.x,y:run.y,distance:run.distance};
  if(overGap)run.objects=[0,1,2].map(lane=>({id:lane,type:'gap',lane,at:35,used:false}));
  const view=createView(canvas);
  view.draw(run,0,'paused',true,1/60,1);
  return {overGap,height:run.y};
}
export async function qualityRecoveryCheck() {
  if(window.devicePixelRatio<=1) throw Error('Use a high-density viewport for this fixture');
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:9999';
  document.body.append(canvas);
  const view=createView(canvas),run=createRun(1989);
  const capture=()=>({width:canvas.width,height:canvas.height,...view.diagnostics()});
  view.draw(run,0,'playing',true,1/60);
  const initial=capture();
  for(let i=0;i<100;i++) view.draw(run,0,'playing',true,1/30);
  const reduced=capture();
  for(let i=0;i<1700;i++) {
    view.draw(run,0,'playing',true,1/60);
    if(i%100===0) await new Promise(requestAnimationFrame);
  }
  const recovered=capture();
  if(reduced.width>=initial.width || recovered.width!==initial.width || recovered.height!==initial.height)
    throw Error('Drawing buffer did not reduce and recover');
  if(initial.geometries!==recovered.geometries || initial.textures!==recovered.textures)
    throw Error('Quality change created additional scene resources');
  return {initial,reduced,recovered,syntheticFrameTimes:true};
}
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
export function collectionPortraitCheck(rear=false) {
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;left:-1000px;width:320px;height:480px';document.body.append(canvas);
  const view=createView(canvas),run=createRun(1989),images=[];
  const gallery=document.createElement('section');
  gallery.style.cssText='position:fixed;inset:0;z-index:9999;overflow:auto;display:grid;grid-template-columns:repeat(6,1fr);align-content:start;gap:8px;padding:8px;background:#102a28;color:white';
  document.body.append(gallery);
  for(const puppy of Object.keys(PUPPIES))for(const costume of Object.keys(COSTUMES)) {
    const src=view.portrait(run,{puppy,costume},rear);
    if(!src.startsWith('data:image/png;base64,')||src.length<2000)throw Error(`Empty portrait: ${puppy}/${costume}`);
    images.push(src);
    const figure=document.createElement('figure');figure.style.margin='0';
    const image=document.createElement('img');image.src=src;image.style.width='100%';
    const caption=document.createElement('figcaption');caption.textContent=`${puppy} / ${costume}`;
    figure.append(image,caption);gallery.append(figure);
  }
  if(new Set(images).size!==24)throw Error('Portrait appearances were duplicated');
  view.draw(run,0,'playing',true,1/60,1);
  return {portraits:images.length,rear,...view.diagnostics()};
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
export function mochiOutfitSlideCheck(reducedMotion=false) {
  const source=document.createElement('canvas');
  source.style.cssText='position:fixed;left:-1000px;width:360px;height:480px';document.body.append(source);
  const view=createView(source),gallery=document.createElement('section'),samples=[];
  gallery.style.cssText='position:fixed;inset:0;z-index:9999;overflow:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;background:#102a28;color:white';
  document.body.append(gallery);
  for(const costume of Object.keys(COSTUMES)) {
    const run=createRun(1989);run.appearance={puppy:'mochi',costume};
    run.objects=[];run.nextRow=Infinity;run.nextChoice=Infinity;run.nextZipline=Infinity;
    act(run,'slide');
    for(let frame=0;frame<36;frame++){step(run,1/120);view.draw(run,run.time,'playing',reducedMotion,1/120,1);}
    const result=view.diagnostics();
    if(run.slide<=0||result.bodyTransform[7]<.64||result.bodyTransform[7]>.75)throw Error(`Invalid crouch for ${costume}`);
    const figure=document.createElement('figure'),image=document.createElement('img'),caption=document.createElement('figcaption');
    figure.style.margin='0';image.src=source.toDataURL();image.style.width='100%';caption.textContent=`Mochi / ${costume} / slide`;
    figure.append(image,caption);gallery.append(figure);samples.push({costume,slide:run.slide,...result});
  }
  return {reducedMotion,samples};
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
    samples.push({label,bones:run.bones,magnet:run.magnet,zoomies:run.zoomies,shield:run.shield,double:run.double,pulling:run.objects.filter(o=>o.pull&&!o.used).length,boneInstances:view.diagnostics().boneInstances});
  }
  if(!combined) {
    for(const [id,type] of ['bone','magnet','shield','gem','double','heart','gift','zoomies'].entries()) {
      run.objects=[{id,type,lane:1,at:12,used:false}];capture(type);
    }
  } else {
    run.objects=['magnet','shield','zoomies','double'].map((type,id)=>({id,type,lane:1,at:.5,used:false}));
    for(let lane=0;lane<3;lane++)run.objects.push({id:10+lane,type:'bone',lane,at:12,used:false});
    for(const target of [.1,.4,6.5,10.5]) {
      while(run.time<target) {
        const corner=turnPrompt(run);
        if(corner&&corner.status!=="accepted")act(run,corner.direction);
        step(run,1/120);
      }
      capture(`${target}s · ${run.bones} bones`);
    }
    if(samples[0].pulling!==3||samples[0].bones!==0||samples[1].bones!==3||samples[2].zoomies!==0||samples[3].magnet!==0||samples[3].double!==0||samples.some(s=>s.shield!==1))throw new Error('Combined power lifecycle regression');
    if(samples[0].boneInstances!==3||samples.slice(1).some(sample=>sample.boneInstances!==0))throw new Error('Magnet collection left incorrect bone instances');
  }
  return {reducedMotion,combined,samples,...view.diagnostics()};
}
export function longRunCheck() {
  const canvas=document.createElement("canvas");
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999";
  document.body.append(canvas);
  const view=createView(canvas),samples=[];
  let completedZiplines=0,turns=0,missedTurns=0;
  let minimumHearts=3,hits=0,shieldSaves=0,peakSpeed=0;
  const regionalCourses=[0,0,0];
  const splitRows=new Set(),courseNames=new Set();
  let warmed=null;
  for(let attempt=0;attempt<4;attempt++) {
    const variant=attempt%3;
    const run=createRun(1989+variant);
    run.appearance={puppy:["biscuit","mochi","pepper"][variant],costume:["scarf","hero","explorer"][variant]};
    let nextSample=250;
    while(run.distance<6000 && !run.ended) {
      if(run.course)courseNames.add(run.course.name);
      const corner=turnPrompt(run),turnLocked=Boolean(corner);
      if(corner&&corner.status!=="accepted")act(run,corner.direction);
      const cable=run.objects.find(o=>o.type==="zipline-start"&&!o.caught&&o.at>run.distance&&o.at-run.distance<run.speed*.4);
      if(cable)act(run,"jump");
      if(run.zipline&&!turnLocked) {
        const treat=run.objects.find(o=>o.airborne&&!o.used&&o.at>run.distance-1.8);
        if(treat&&treat.at-run.distance<12&&treat.lane!==run.lane)act(run,treat.lane>run.lane?"right":"left");
      }
      if(!turnLocked&&run.choicePending!==null&&run.choicePending-run.distance<35)act(run,attempt===1?"right":"left");
      const next=run.objects.find(o=>HAZARDS.includes(o.type)&&o.at>run.distance&&o.at-run.distance<24);
      if(next) {
        if(next.splitChoice) splitRows.add(`${attempt}:${next.at}`);
        const blocked=new Set(run.objects.filter(o=>o.at===next.at&&HAZARDS.includes(o.type)).map(o=>o.lane));
        const safe=[0,1,2].find(lane=>!blocked.has(lane));
        if(!turnLocked&&safe!==undefined&&safe!==run.lane)act(run,safe<run.lane?"left":"right");
        else if(safe===undefined&&next.at-run.distance<run.speed*.4) {
          const occupied=run.objects.find(o=>o.at===next.at&&o.lane===run.lane&&HAZARDS.includes(o.type));
          act(run,['gate','branch','arch'].includes(occupied.type)?"slide":"jump");
        }
      }
      step(run,1/120);
      minimumHearts=Math.min(minimumHearts,run.hearts);
      hits+=run.events.filter(event=>event==='hit').length;
      shieldSaves+=run.events.filter(event=>event==='shield-break').length;
      peakSpeed=Math.max(peakSpeed,run.speed);
      run.events=[];
      if(run.distance>=nextSample) {
        view.draw(run,run.time,"playing",attempt===2,1/60,1);
        const frame=view.diagnostics().puppyFrame;
        if(!frame||frame.minX<-.84001||frame.maxX>.84001)throw Error(`Puppy framing regression: ${JSON.stringify(frame)}`);
        const sample={attempt,distance:Math.floor(run.distance),hearts:run.hearts,turns:run.turns,missedTurns:run.missedTurns,...view.diagnostics()};
        checkRendererResources(sample,warmed);
        samples.push(sample);
        nextSample+=250;
      }
    }
    if(run.ended)throw new Error(`Input-driven run ended at ${run.distance} on seed ${run.seed}`);
    if(run.ziplines!==4)throw new Error(`Expected four zipline finishes, got ${run.ziplines}`);
    if(run.turns===0||run.missedTurns!==0)throw new Error(`Corner bot regression: ${run.turns} accepted, ${run.missedTurns} missed on seed ${run.seed}`);
    completedZiplines+=run.ziplines;
    turns+=run.turns;missedTurns+=run.missedTurns;
    run.regionalCourses.forEach((count,region)=>{regionalCourses[region]+=count;});
    if(attempt===2)warmed={geometries:Math.max(...samples.map(s=>s.geometries)),textures:Math.max(...samples.map(s=>s.textures))};
  }
  const peak=key=>Math.max(...samples.map(sample=>sample[key]));
  const summary={runs:4,metersPerRun:6000,completedZiplines,turns,missedTurns,renderedCheckpoints:samples.length,minimumHearts,hits,shieldSaves,peakSpeed,peakGeometries:peak("geometries"),peakTextures:peak("textures"),peakDrawCalls:peak("drawCalls"),peakObjects:Math.max(...samples.map(sample=>sample.activeObjects+sample.pooledObjects)),warmed,repeatLapStable:true,final:samples.at(-1)};
  if(hits||shieldSaves)throw new Error(`Traversal collision between checkpoints: ${JSON.stringify(summary)}`);
  summary.regionalCourses=regionalCourses;
  summary.courseNames=[...courseNames];
  for(const name of ['Root scramble','Canopy shuffle','Root rhythm','Fern dash','Canyon crossings','Ridge hop','Twin crossings','Ridge switch','Crystal slalom','Moonpaw weave','Crystal switchback','Moonlit hurdles'])
    if(!courseNames.has(name))throw new Error(`Missing course variation: ${name}`);
  summary.splitRowsSeen=splitRows.size;
  if(!splitRows.size)throw new Error('Missing split-decision coverage');
  if(regionalCourses.some(count=>count===0))throw new Error(`Missing regional course coverage: ${regionalCourses}`);
  return summary;
}
export function previewRegionalCourses() {
  const source=document.createElement('canvas');
  source.style.cssText='position:fixed;left:-1000px;width:390px;height:600px';document.body.append(source);
  const view=createView(source),gallery=document.createElement('section'),samples=[];
  gallery.style.cssText='position:fixed;inset:0;z-index:9999;overflow:auto;background:#102a28;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;color:white';document.body.append(gallery);
  for(const start of [200,475,1120]) {
    const run=createRun(17);
    Object.assign(run,{distance:start-18,nextRow:start,row:12,objects:[],nextChoice:2000,nextZipline:3000,choicePending:null});
    run.previous.distance=run.distance;run.appearance={puppy:'mochi',costume:'scarf'};
    fillTrack(run);
    view.draw(run,0,'playing',true,1/60,1);
    const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');
    figure.style.margin='0';canvas.width=390;canvas.height=600;canvas.style.width='100%';
    canvas.getContext('2d').drawImage(source,0,0);
    caption.textContent=run.course.name;figure.append(canvas,caption);gallery.append(figure);
    samples.push({name:run.course.name,beats:run.course.beats,...view.diagnostics()});
  }
  return samples;
}
export function previewSplitDecision() {
  const canvas=document.createElement('canvas');
  canvas.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:9999';
  document.body.append(canvas);
  const run=createRun(11);
  Object.assign(run,{distance:1232,nextRow:1250,row:14,objects:[],lastCourseVisit:2,
    nextChoice:3000,nextZipline:4000,choicePending:null});
  run.previous.distance=run.distance;run.appearance={puppy:'mochi',costume:'scarf'};
  fillTrack(run);
  const view=createView(canvas);view.draw(run,0,'playing',true,1/60,1);
  return {row:run.objects.filter(o=>o.at===1250&&o.splitChoice).map(o=>({lane:o.lane,type:o.type})),...view.diagnostics()};
}
export function previewGates() {
  const canvas=document.createElement("canvas");
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999";document.body.append(canvas);
  const run=createRun(1989);run.distance=325;run.previous.distance=325;fillTrack(run);
  createView(canvas).draw(run,1,"playing",true,1/60,1);
  return {gateAt:run.choicePending};
}
export function previewTrailShape(reducedMotion=false) {
  const source=document.createElement("canvas");
  source.style.cssText="position:fixed;left:-1000px;width:390px;height:600px";document.body.append(source);
  const view=createView(source),gallery=document.createElement("section"),samples=[];
  gallery.style.cssText="position:fixed;inset:0;z-index:9999;overflow:auto;background:#102a28;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:12px;color:white";
  document.body.append(gallery);
  for(const [label,distance] of [["Left approach",135],["Midway through left",162.5],["Bridge recovery",180],["Right approach",935],["Midway through right",962.5],["Rolling trail",400],["Later river corner",2962.5]]) {
    const run=createRun(1989);run.distance=distance;run.previous.distance=distance;
    run.appearance={puppy:"mochi",costume:"scarf"};
    // Isolate geometry and signs; the separate long run validates generation.
    run.nextCorner=upcomingCorner(distance).index;
    run.objects=cornersBetween(distance-8,distance+170).map(corner=>({id:corner.index,type:`corner-${corner.direction}`,lane:1,at:corner.at,turnIndex:corner.index}));
    run.nextRow=Infinity;
    view.draw(run,run.time,"playing",reducedMotion,1/60,1);
    const figure=document.createElement("figure"),canvas=document.createElement("canvas"),caption=document.createElement("figcaption");
    figure.style.margin="0";canvas.width=390;canvas.height=600;canvas.style.width="100%";
    canvas.getContext("2d").drawImage(source,0,0,390,600);
    caption.textContent=label;caption.style.cssText="text-align:center;padding:8px;font:14px Arial";
    figure.append(canvas,caption);gallery.append(figure);
    samples.push({label,distance,prompt:turnPrompt(run),...view.diagnostics()});
  }
  return {reducedMotion,samples};
}
export function previewZipline(distance=700,reducedMotion=false,lane=2) {
  const canvas=document.createElement("canvas");
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999";document.body.append(canvas);
  const run=createRun(1989);
  Object.assign(run,{distance:610,nextRow:610,nextChoice:1050,choicePending:null,objects:[]});
  fillTrack(run);
  const view=createView(canvas);
  let jumped=false;
  while(run.distance<distance) {
    if(!jumped && 650-run.distance<run.speed*.4){act(run,"jump");jumped=true;}
    if(run.zipline && run.distance>680 && lane!==run.lane)act(run,lane>run.lane?'right':'left');
    step(run,1/120);run.events=[];
    view.draw(run,run.time,"playing",reducedMotion,1/120,1);
  }
  return {distance:run.distance,zipline:run.zipline,y:run.y,hearts:run.hearts,...view.diagnostics()};
}
export function posePauseCheck(puppy="biscuit",action="jump") {
  if(!['jump','slide'].includes(action))throw Error('Unsupported pause-check action');
  const canvas=document.createElement("canvas");
  canvas.style.cssText="position:fixed;inset:0;width:100vw;height:100vh;z-index:9999";document.body.append(canvas);
  const run=createRun(1989),view=createView(canvas);
  run.appearance={puppy,costume:"scarf"};
  act(run,action);
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
  return {action,before,paused,resumed,bodyFrozen:true};
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
  if(!document.querySelector('#hud').inert)throw new Error('Paused background HUD remains exposed');
  press("Escape");
  if(state()!=="playing"||document.activeElement.id!=="scene")throw new Error("Resume did not focus the trail");
  if(document.querySelector('#hud').inert)throw new Error('Resumed HUD remains inert');
  for(let i=0;i<10;i++)press("Escape",true);
  if(state()!=="playing")throw new Error("Held Escape paused a resumed game");
  press("Escape");
  return {restored,heldEscapeIgnored:true,finalState:state()};
}
export function dialogLayoutCheck() {
  const content=document.querySelector(".modal-content");
  if(document.querySelector('#game').dataset.state==='ended' && content.scrollTop===0) {
    const stats=document.querySelector('#results').getBoundingClientRect();
    const visible=content.getBoundingClientRect();
    if(stats.top<visible.top-1 || stats.bottom>visible.bottom+1)
      throw new Error('Primary results are clipped before scrolling');
  }
  const actions=[...document.querySelectorAll(".modal-actions button")].filter(button=>!button.hidden).map(button=>{
    const rect=button.getBoundingClientRect();
    const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    if(rect.top<0||rect.bottom>window.innerHeight||!button.contains(hit))throw new Error(`Dialog action is clipped or covered: ${button.id}`);
    return {id:button.id,top:rect.top,bottom:rect.bottom};
  });
  return {viewport:[window.innerWidth,window.innerHeight],scrollable:content.scrollHeight>content.clientHeight,actions};
}
export function menuLayoutCheck() {
  if(document.querySelector('#game').dataset.state!=='menu')throw Error('Open camp before checking its layout');
  const controls=['#play','#help','#shop','#kennel','#audio','#motion','.back-link'].map(selector=>{
    const button=document.querySelector(selector),id=button.id||selector,rect=button.getBoundingClientRect();
    if(rect.width<44||rect.height<44||rect.left<0||rect.right>window.innerWidth||rect.top<0||rect.bottom>window.innerHeight)throw Error(`Camp target out of bounds or too small: ${id}`);
    if(!button.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)))throw Error(`Covered camp target: ${id}`);
    return {id,width:rect.width,height:rect.height};
  });
  const textChecks=backedTextChecks([['#play','#play',12],['#help','#help',11],['#kennel','#kennel',11],['#shop','#shop',11],['#audio','#audio',20],['.back-link','.back-link',10],['#motion','#motion',11]]);
  if(textChecks.some(check=>check.fontSize<check.minimumFontSize||check.minimumContrast<4.5))throw Error(`Camp readability regression: ${JSON.stringify(textChecks)}`);
  return {viewport:[window.innerWidth,window.innerHeight],controls,textChecks};
}
export function actionLabelsCheck() {
  const buttons=[...document.querySelectorAll('[data-upgrade],[data-puppy],[data-costume]')];
  if(!buttons.length)throw Error('Open upgrades, puppies or outfits first');
  const labels=buttons.map(button=>{
    const item=UPGRADES[button.dataset.upgrade]||PUPPIES[button.dataset.puppy]||COSTUMES[button.dataset.costume];
    const label=button.getAttribute('aria-label')||'';
    if(!item||!label.includes(item.name)||!label.includes(button.textContent))throw Error(`Ambiguous purchase/equip action: ${label}`);
    return label;
  });
  if(new Set(labels).size!==labels.length)throw Error('Duplicate action names');
  return {labels};
}
// Conservative text/backing contrast over a white scene. This does not measure
// scene objects or claim the complete interface is accessible.
function backedTextChecks(specs) {
  const luminance=rgb=>rgb.map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
  const channels=color=>color.match(/[\d.]+/g).map(Number);
  return specs.map(([text,backing,minimumFontSize])=>{
    const style=window.getComputedStyle(document.querySelector(text));
    const background=channels(window.getComputedStyle(document.querySelector(backing)).backgroundColor);
    const foreground=channels(style.color),alpha=background[3]??1;
    if((foreground[3]??1)!==1)throw Error(`Translucent text needs a separate contrast calculation: ${text}`);
    const backLight=luminance(background.slice(0,3).map(value=>value*alpha+255*(1-alpha)));
    const frontLight=luminance(foreground.slice(0,3));
    const ratio=(Math.max(frontLight,backLight)+.05)/(Math.min(frontLight,backLight)+.05);
    return {text,fontSize:parseFloat(style.fontSize),minimumFontSize,minimumContrast:Number(ratio.toFixed(2))};
  });
}
export function passportLayoutCheck() {
  const passport=document.querySelector('#trail-passport');
  const current=passport?.querySelector('[data-current="true"]');
  if(!current||passport.querySelectorAll('.mastery-card').length!==7||passport.querySelectorAll('.mastery-badge').length!==21)throw Error('Missing passport entries');
  if(passport.firstElementChild!==current||passport.querySelector('.other-passport-cards').open)throw Error('Passport should prioritize the current puppy');
  return {cards:7,badges:21,current:current.querySelector('h3').textContent,...dialogLayoutCheck()};
}
export function instructionLayoutCheck() {
  if(document.querySelector('#game').dataset.state!=='help')throw new Error('Open help before checking illustrations');
  const content=document.querySelector('.modal-content').getBoundingClientRect();
  const images=[...document.querySelectorAll('[data-guide]')].map(image=>{
    const rect=image.getBoundingClientRect();
    if(!image.complete||!image.naturalWidth||!image.alt)throw new Error(`Missing guide: ${image.dataset.guide}`);
    if(rect.left<content.left||rect.right>content.right)throw new Error(`Clipped guide: ${image.dataset.guide}`);
    return {action:image.dataset.guide,width:rect.width,height:rect.height};
  });
  if(images.length!==3)throw new Error('Expected three basic movement illustrations');
  return {images,...dialogLayoutCheck()};
}
// UI-only stress case: maximum simultaneous indicators, not an earned game state.
export function hudStressCheck(routeChoice=false) {
  const game=document.querySelector("#game"),hud=document.querySelector("#hud");
  const ids=["power","cue","route-choice","toast","mission-summary","mission-label","mission-hud","controls"];
  const saved=ids.map(id=>{const element=document.getElementById(id);return {element,nodes:[...element.childNodes],hidden:element.hidden};});
  const state=game.dataset.state,hidden=hud.hidden,classes=hud.className;
  try {
    game.dataset.state="playing";hud.hidden=false;hud.classList.add("has-powers");
    document.querySelector("#controls").hidden=false;
    document.querySelector("#mission-hud").hidden=false;
    document.querySelector("#cue").hidden=false;
    for(const id of ['route-choice','toast','mission-summary'])document.getElementById(id).hidden=true;
    document.querySelector("#cue").textContent="↑ JUMP · ZIPLINE";
    document.querySelector("#route-choice").textContent="GATES IN 40m · ← Scenic: fewer obstacles · Challenge: more points →";
    if(routeChoice){document.querySelector('#cue').hidden=true;document.querySelector('#route-choice').hidden=false;}
    document.querySelector("#mission-label").textContent="Trailblazer · 300/300 meters";
    const power=document.querySelector('#power');power.replaceChildren();
    createPowerHud(power)({distance:0,zipline:{end:140},zoomies:6,shield:1,magnet:19,double:10,upgrades:{magnet:3}});
    const rect=id=>document.querySelector(id).getBoundingClientRect();
    const issues=[];
    const activeCue=routeChoice?'#route-choice':'#cue';
    for(const id of ['#power',activeCue,'#mission-hud','#controls']) {
      const r=rect(id);
      if(r.width<=0||r.height<=0)issues.push(`${id} is not visibly measurable`);
    }
    const rootStyle=window.getComputedStyle(document.documentElement);
    const safeLeft=parseFloat(rootStyle.getPropertyValue('--safe-left'))||0;
    const safeRight=parseFloat(rootStyle.getPropertyValue('--safe-right'))||0;
    for(const id of ['.score','.run-stats']) {
      const r=rect(id);
      if(r.left<safeLeft || r.right>window.innerWidth-safeRight)
        issues.push(`${id} enters a device side safe area`);
    }
    const textChecks=backedTextChecks([['.power-chip','.power-chip',11],['#hearts','#hearts',15],['#region-name','.score',10]]);
    for(const check of textChecks){
      if(check.fontSize<check.minimumFontSize)issues.push(`${check.text} label too small: ${check.fontSize}px`);
      if(check.minimumContrast<4.5)issues.push(`${check.text} worst-case text contrast below 4.5: ${check.minimumContrast}`);
    }
    for(const [first,second] of [["#power",".score"],["#power","#mission-hud"],["#power","#controls"],["#mission-hud","#controls"]]){
      const a=rect(first),b=rect(second);
      if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)issues.push(`${first} overlaps ${second}`);
    }
    for(const id of ["#power",activeCue,"#mission-hud","#controls"]){const r=rect(id);if(r.top<0||r.bottom>window.innerHeight||r.left<0||r.right>window.innerWidth)issues.push(`${id} outside viewport`);}
    const buttons=[...document.querySelectorAll('#controls button')];
    issues.push(...portraitControlIssues(buttons.map(button=>button.getBoundingClientRect()),{
      width:window.innerWidth,height:window.innerHeight,
      safeBottom:parseFloat(rootStyle.getPropertyValue('--safe-bottom'))||0,
    }));
    const landscape=window.innerWidth>window.innerHeight&&window.innerHeight<=520;
    for(const button of buttons){
      const r=button.getBoundingClientRect();
      if(r.left<0||r.right>window.innerWidth||r.top<0||r.bottom>window.innerHeight)issues.push(`${button.textContent} outside viewport`);
      if(r.width<44||r.height<44)issues.push(`${button.textContent} target too small`);
      if(landscape&&r.left<window.innerWidth*.6&&r.right>window.innerWidth*.4)issues.push(`${button.textContent} covers puppy corridor`);
      const guidance=rect('#mission-hud');
      if(r.left<guidance.right&&r.right>guidance.left&&r.top<guidance.bottom&&r.bottom>guidance.top)issues.push(`${button.textContent} overlaps guidance`);
    }
    if(landscape){const r=rect('#mission-hud');if(r.left<window.innerWidth*.6&&r.right>window.innerWidth*.4)issues.push('Guidance covers puppy corridor');}
    if(landscape){if(rect('#mission-hud').bottom>window.innerHeight*.48)issues.push('Guidance enters the near-track area');}
    else if(rect(routeChoice?'#route-choice':'#cue').top<window.innerHeight*.65)issues.push('Guidance covers the center of the trail');
    return {viewport:[window.innerWidth,window.innerHeight],issues,textChecks,powerBottom:rect("#power").bottom,cueTop:rect(activeCue).top};
  } finally {
    game.dataset.state=state;hud.hidden=hidden;hud.className=classes;
    for(const {element,nodes,hidden:wasHidden} of saved){if(!['controls','mission-hud','mission-summary'].includes(element.id))element.replaceChildren(...nodes);element.hidden=wasHidden;}
  }
}
export function uiPlayCheck(seconds=22) {
  return new Promise(resolve=>{
    document.querySelector("#pause-button").click();
    document.querySelector("#home").click();
    document.querySelector("#play").click();
    const started=performance.now(),frames=[];
    const regions = new Set(), layoutIssues = new Set(),turnDirections=new Set();
    let last=started,lastAction=0,gate=false,challenge=false,zipline=false,landed=false,turnAccepted=false;
    function tick(now) {
      frames.push(now-last);last=now;
      const state=document.querySelector("#game").dataset.state;
      const route=document.querySelector("#route-choice").textContent;
      const cue=document.querySelector("#cue").textContent;
      const scene=document.querySelector("#scene");
      const fetchButton=document.querySelector('#fetch');
      if (!fetchButton.disabled) {
        const uses=Number(scene.dataset.fetchUses||0);
        if(uses%2===0) window.dispatchEvent(new window.KeyboardEvent('keydown',{code:'KeyF',key:'f',bubbles:true}));
        else fetchButton.dispatchEvent(new window.PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));
      }
      regions.add(document.querySelector("#region-name").textContent);
      zipline ||= scene.dataset.posture === "zipline";
      landed ||= zipline && document.querySelector("#toast").textContent.includes("Zipline complete");
      gate ||= route.includes("GATES IN");challenge ||= document.querySelector('#run-score').textContent.includes("CHALLENGE");
      if(cue.includes("TURN LEFT"))turnDirections.add("left");
      if(cue.includes("TURN RIGHT"))turnDirections.add("right");
      turnAccepted ||= cue.includes("TURN SET");
      if(now-lastAction>250) {
        for (const [first, second] of [["#power",".score"],["#power","#mission-hud"],["#power","#controls"],["#mission-hud","#controls"],["#fetch","#mission-hud"],["#fetch","#power"]]) {
          const a=document.querySelector(first).getBoundingClientRect(),b=document.querySelector(second).getBoundingClientRect();
          if(a.width && a.height && b.width && b.height && a.left<b.right && a.right>b.left && a.top<b.bottom && a.bottom>b.top)layoutIssues.add(`${first} overlaps ${second}`);
        }
        const turnLocked=cue.includes("TURN");
        const code=cue.includes("TURN LEFT")||cue.includes("WEAVE LEFT")||/(BONES|GIFT) LEFT/.test(cue)?"ArrowLeft":cue.includes("TURN RIGHT")||cue.includes("WEAVE RIGHT")||/(BONES|GIFT) RIGHT/.test(cue)?"ArrowRight":turnLocked?null:
          cue.includes("SLIDE")?"ArrowDown":cue.includes("JUMP")?"ArrowUp":route.includes("GATES IN")?"ArrowRight":null;
        if(code){window.dispatchEvent(new window.KeyboardEvent("keydown",{code,key:code,bubbles:true}));lastAction=now;}
      }
      if(now-started>=seconds*1000||state!=="playing") {
        document.querySelector("#pause-button").click();
        const sorted=[...frames].sort((a,b)=>a-b);
        resolve({state,viewport:[window.innerWidth,window.innerHeight],endDistance:document.querySelector("#distance").textContent,frames:frames.length,meanMs:frames.reduce((a,b)=>a+b,0)/frames.length,p95Ms:sorted[Math.floor(sorted.length*.95)],regions:[...regions],layoutIssues:[...layoutIssues],gatePromptSeen:gate,challengeSelected:challenge,ziplineCaught:zipline,ziplineLanded:landed,turnDirections:[...turnDirections],turnAccepted,turns:Number(scene.dataset.turns||0),missedTurns:Number(scene.dataset.missedTurns||0),regionalCourses:scene.dataset.courses,hearts:document.querySelector("#hearts").getAttribute("aria-label")});
        return;
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  });
}
