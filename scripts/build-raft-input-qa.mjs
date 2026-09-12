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
  ['accumulator += resumeStep(run, dt);','accumulator += 0;'],
]){
  if(!source.includes(from))throw Error(`Fixture hook drift: ${from}`);
  source=source.replace(from,to);
}
source+=`
window.raftInputQA={
  prepare(){
    start(); if(state!=='playing')throw Error('Graphics not ready');
    Object.assign(run,{raftPrototype:true,distance:1090,nextRow:1090,objects:[],
      nextChoice:1750,nextZipline:2050,course:null,route:{kind:'challenge',until:1270}});
    run.previous.distance=1090; lastHud=-1;
    return this.snapshot();
  },
  advance(seconds){
    if(state!=='playing')throw Error('Run is not playing');
    for(let i=0;i<Math.round(seconds*120)&&!run.ended;i++)step(run,1/120);
    lastHud=-1;return this.snapshot();
  },
  snapshot(){return {state,distance:run.distance,lane:run.lane,x:run.x,y:run.y,
    raft:Boolean(run.raft),rafts:run.rafts||0,hearts:run.hearts,bones:run.bones,
    cue:actionCue(run),jumpBuffer:run.jumpBuffer,slide:run.slide};}
};
`;
await build({stdin:{contents:source,resolveDir:new URL('src/runner/',root).pathname,sourcefile:'raft-input-qa.js'},
  bundle:true,format:'esm',outfile:new URL('dist/runner/raft-input-qa.js',root).pathname});
const html=(await readFile(new URL('runner/index.html',root),'utf8'))
  .replace('src="game.js"','src="raft-input-qa.js"');
await writeFile(new URL('dist/runner/raft-input-qa.html',root),html);
console.log('Local fixture: /runner/raft-input-qa.html (simulation clock is manual)');
