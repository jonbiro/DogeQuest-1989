// Local-only visual fixture. Bundle separately into dist for browser checks;
// the production build never includes this file or exposes mutable run state.
import {createView} from "../src/runner/render.js";
import {createRun,step,act,fillTrack,HAZARDS} from "../src/runner/world.js";
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
  for(let attempt=0;attempt<3;attempt++) {
    const run=createRun(1989+attempt);
    run.appearance={puppy:["biscuit","mochi","pepper"][attempt],costume:["scarf","hero","explorer"][attempt]};
    let nextSample=250;
    while(run.distance<4500 && !run.ended) {
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
  }
  const peak=key=>Math.max(...samples.map(sample=>sample[key]));
  const summary={runs:3,metersPerRun:4500,renderedCheckpoints:samples.length,minimumHearts:Math.min(...samples.map(sample=>sample.hearts)),peakGeometries:peak("geometries"),peakTextures:peak("textures"),peakDrawCalls:peak("drawCalls"),peakObjects:Math.max(...samples.map(sample=>sample.activeObjects+sample.pooledObjects)),final:samples.at(-1)};
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
