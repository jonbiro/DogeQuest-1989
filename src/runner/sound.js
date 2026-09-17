export const CUES = {
  yip:[{from:320,to:620,at:0,duration:.1,type:"triangle"},{from:560,to:260,at:.11,duration:.13,type:"triangle"}],
  reward:[{from:523,to:523,at:0,duration:.14,type:"triangle"},{from:659,to:659,at:.08,duration:.14,type:"triangle"},{from:784,to:1046,at:.16,duration:.23,type:"sine"}],
  zoomies:[{from:220,to:880,at:0,duration:.22,type:"triangle"},{from:440,to:1320,at:.12,duration:.25,type:"sine"}],
  board:[{from:210,to:105,at:0,duration:.13,type:"sine",volume:.019},{from:340,to:155,at:.055,duration:.16,type:"sine",volume:.012}],
  shore:[{from:392,to:392,at:0,duration:.13,type:"sine",volume:.022},{from:523,to:523,at:.11,duration:.19,type:"sine",volume:.022}],
  jump:[{from:300,to:700,at:0,duration:.12,type:"sine"}],
  land:[{from:180,to:100,at:0,duration:.065,type:"sine",volume:.016}],
  slide:[{from:420,to:140,at:0,duration:.10,type:"sine"}],
  // Keep the small event vocabulary distinct enough that a player can learn
  // what just happened without turning the trail into a wall of beeps.
  clear:[{from:470,to:620,at:0,duration:.075,type:"triangle",volume:.022}],
  "near-miss":[{from:560,to:320,at:0,duration:.09,type:"sine",volume:.026}],
  turn:[{from:430,to:700,at:0,duration:.08,type:"triangle",volume:.024},{from:700,to:900,at:.07,duration:.1,type:"triangle",volume:.026}],
  area:[{from:330,to:500,at:0,duration:.12,type:"sine",volume:.021},{from:500,to:760,at:.13,duration:.16,type:"triangle",volume:.025}],
  "bridge-collapse":[{from:250,to:120,at:0,duration:.16,type:"sine",volume:.024},{from:180,to:110,at:.1,duration:.2,type:"triangle",volume:.018}],
  "chase-start":[{from:330,to:620,at:0,duration:.12,type:"triangle",volume:.024},{from:494,to:988,at:.10,duration:.18,type:"sine",volume:.022}],
  "chase-end":[{from:523,to:659,at:0,duration:.10,type:"triangle",volume:.024},{from:659,to:1046,at:.08,duration:.20,type:"sine",volume:.022}],
  "ski-start":[{from:196,to:294,at:0,duration:.14,type:"sine",volume:.022},{from:294,to:440,at:.10,duration:.18,type:"triangle",volume:.024}],
  "ski-end":[{from:392,to:523,at:0,duration:.12,type:"triangle",volume:.024},{from:523,to:784,at:.09,duration:.2,type:"sine",volume:.022}],
  "ski-jump":[{from:440,to:880,at:0,duration:.13,type:"triangle",volume:.022}],
  "ski-ice":[{from:180,to:110,at:0,duration:.12,type:"sine",volume:.02}],
  "ski-yeti":[{from:260,to:520,at:0,duration:.1,type:"triangle",volume:.021},{from:520,to:780,at:.08,duration:.14,type:"sine",volume:.018}],
  "ski-snowball":[{from:330,to:220,at:0,duration:.11,type:"sine",volume:.019},{from:440,to:660,at:.09,duration:.12,type:"triangle",volume:.02}],
  "ski-snowman":[{from:280,to:180,at:0,duration:.16,type:"sine",volume:.018}],
  hit:[{from:120,to:120,at:0,duration:.2,type:"sine"}],
  ready:[{from:660,to:660,at:0,duration:.09,type:"sine"},{from:880,to:880,at:.09,duration:.12,type:"sine"}],
  finish:[{from:523,to:440,at:0,duration:.15,type:"triangle"},{from:392,to:330,at:.17,duration:.2,type:"triangle"}],
};
export function traversalCue(event) {
  switch(event){
    case 'raft-start':return 'board';
    case 'raft-end':return 'shore';
    case 'minecart-start':return 'board';
    case 'minecart-end':return 'shore';
    case 'zipline-start':return 'zoomies';
    case 'zipline-end':return 'reward';
    case 'bridge-collapse':return 'bridge-collapse';
    case 'dog-chase-start':return 'chase-start';
    case 'dog-chase-end':return 'chase-end';
    case 'ski-start':return 'ski-start';
    case 'ski-end':return 'ski-end';
    case 'ski-jump':return 'ski-jump';
    case 'ski-ice-dodge':return 'ski-ice';
    case 'ski-yeti-dodge':return 'ski-yeti';
    case 'ski-snowball-clear':return 'ski-snowball';
    case 'ski-snowball-dodge':return 'ski-snowball';
    case 'ski-snowman-dodge':return 'ski-snowman';
    default:return null;
  }
}
const voices=new WeakMap();
export function feedbackPriority(cue){
  return ['jump','slide','hit','ready'].includes(cue)?1:0;
}
export function resumeSound(context) {
  if (!context || context.state==='closed' || typeof context.resume!=='function') return;
  // Also queue resume while a prior suspend is still pending. Checking only
  // for 'suspended' can miss a rapid pause/resume pair.
  try { context.resume().catch(()=>{}); } catch { /* Audio remains optional. */ }
}
export function playNotes(context,notes,priority=0) {
  const scheduled=[];
  const now=context.currentTime;
  if(!voices.has(context))voices.set(context,new Set());
  const active=voices.get(context);
  for(const note of notes) {
    // Leave four voices free for moves and damage when pickups/rewards burst.
    // All voices still share the existing twelve-node hard ceiling.
    if(active.size>=(priority===1?12:8))break;
    const osc=context.createOscillator(),gain=context.createGain();
    const start=now+(note.at||0),end=start+note.duration;
    osc.type=note.type||"sine";
    osc.frequency.setValueAtTime(note.from,start);
    osc.frequency.exponentialRampToValueAtTime(note.to||note.from,end);
    gain.gain.setValueAtTime(.0001,start);
    const volume=Number.isFinite(note.volume)?Math.max(.0001,Math.min(.035,note.volume)):.035;
    gain.gain.linearRampToValueAtTime(volume,start+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,end);
    osc.connect(gain);gain.connect(context.destination);
    active.add(osc);
    scheduled.push(osc);
    let cleaned=false;
    osc.cleanup=()=>{
      if(cleaned)return;
      cleaned=true;
      osc.disconnect();gain.disconnect();active.delete(osc);
    };
    osc.onended=osc.cleanup;
    osc.start(start);osc.stop(end);
  }
  return ()=>{
    for(const osc of scheduled){
      try{osc.stop();}catch{/* A completed voice needs only idempotent cleanup. */}
      osc.cleanup();
    }
  };
}
export function stopSound(context) {
  const active=voices.get(context);
  if(active){
    for(const osc of active){
      try{osc.stop();}catch{/* The browser may have already ended this voice. */}
      osc.cleanup?.();
    }
    active.clear();
  }
  if(context.state==="running"&&typeof context.suspend==="function"){
    try{context.suspend().catch(()=>{});}catch{/* Sound remains optional. */}
  }
}
