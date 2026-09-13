export const CUES = {
  yip:[{from:320,to:620,at:0,duration:.1,type:"triangle"},{from:560,to:260,at:.11,duration:.13,type:"triangle"}],
  reward:[{from:523,to:523,at:0,duration:.14,type:"triangle"},{from:659,to:659,at:.08,duration:.14,type:"triangle"},{from:784,to:1046,at:.16,duration:.23,type:"sine"}],
  zoomies:[{from:220,to:880,at:0,duration:.22,type:"triangle"},{from:440,to:1320,at:.12,duration:.25,type:"sine"}],
  board:[{from:210,to:105,at:0,duration:.13,type:"sine",volume:.019},{from:340,to:155,at:.055,duration:.16,type:"sine",volume:.012}],
  shore:[{from:392,to:392,at:0,duration:.13,type:"sine",volume:.022},{from:523,to:523,at:.11,duration:.19,type:"sine",volume:.022}],
  jump:[{from:300,to:700,at:0,duration:.12,type:"sine"}],
  land:[{from:180,to:100,at:0,duration:.065,type:"sine",volume:.016}],
  slide:[{from:420,to:140,at:0,duration:.10,type:"sine"}],
  hit:[{from:120,to:120,at:0,duration:.2,type:"sine"}],
  ready:[{from:660,to:660,at:0,duration:.09,type:"sine"},{from:880,to:880,at:.09,duration:.12,type:"sine"}],
  finish:[{from:523,to:440,at:0,duration:.15,type:"triangle"},{from:392,to:330,at:.17,duration:.2,type:"triangle"}],
};
export function traversalCue(event) {
  switch(event){
    case 'raft-start':return 'board';
    case 'raft-end':return 'shore';
    case 'zipline-start':return 'zoomies';
    case 'zipline-end':return 'reward';
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
    let cleaned=false;
    osc.cleanup=()=>{
      if(cleaned)return;
      cleaned=true;
      osc.disconnect();gain.disconnect();active.delete(osc);
    };
    osc.onended=osc.cleanup;
    osc.start(start);osc.stop(end);
  }
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
