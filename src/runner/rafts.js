// River traversal contract. Integration with the generator and renderer follows
// separately; these functions do not alter existing versioned trails.
export const RAFT_FIRST=1150,RAFT_PERIOD=2800,RAFT_LENGTH=140;
export const RAFT_APPROACH=45,RAFT_RECOVERY=35,RAFT_BANK_LIMIT=3.15;
const FREQUENCY=10,DAMPING=6.5;
const DAMPED_FREQUENCY=Math.sqrt(FREQUENCY*FREQUENCY-DAMPING*DAMPING);

export function raftByIndex(index){
  if(!Number.isSafeInteger(index)||index<0)return null;
  const start=RAFT_FIRST+index*RAFT_PERIOD;
  if(!Number.isSafeInteger(start+RAFT_LENGTH+RAFT_RECOVERY))return null;
  return {index,start,end:start+RAFT_LENGTH,approach:start-RAFT_APPROACH,recovery:start+RAFT_LENGTH+RAFT_RECOVERY};
}

export function raftAt(distance){
  if(!Number.isFinite(distance)||distance<RAFT_FIRST)return null;
  const raft=raftByIndex(Math.floor((distance-RAFT_FIRST)/RAFT_PERIOD));
  return raft&&distance<raft.end?raft:null;
}

export function raftIntersecting(start,end){
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return null;
  const index=Math.max(0,Math.floor((start-RAFT_FIRST-RAFT_LENGTH-RAFT_RECOVERY)/RAFT_PERIOD));
  if(!Number.isSafeInteger(index))return null;
  for(let i=index;i<=index+1;i++){
    const raft=raftByIndex(i);
    if(raft&&end>=raft.approach&&start<=raft.recovery)return raft;
  }
  return null;
}

// An eased current nudges the aiming line, never teleports the boat. Both value
// and slope reach zero at the shore, so entering/exiting introduces no impulse.
export function raftCurrent(distance){
  const raft=raftAt(distance);
  if(!raft)return 0;
  const t=(distance-raft.start)/RAFT_LENGTH;
  return .22*Math.pow(Math.sin(Math.PI*t),2)*Math.sin(Math.PI*t*4);
}

// Exact damped oscillator for a held steering target. Compared with the runner's
// critically damped spring, momentum produces a small, controlled overshoot.
export function steerRaft(body,target,dt){
  if(!Number.isFinite(dt)||dt<=0||!Number.isFinite(target))return;
  target=Math.max(-2.65,Math.min(2.65,target));
  const offset=body.x-target,velocity=body.vx;
  const decay=Math.exp(-DAMPING*dt),angle=DAMPED_FREQUENCY*dt;
  const cosine=Math.cos(angle),sine=Math.sin(angle);
  body.x=target+decay*(offset*cosine+(velocity+DAMPING*offset)/DAMPED_FREQUENCY*sine);
  body.vx=decay*(velocity*cosine-(DAMPING*velocity+FREQUENCY*FREQUENCY*offset)/DAMPED_FREQUENCY*sine);
  if(Math.abs(body.x)>RAFT_BANK_LIMIT){
    body.x=Math.sign(body.x)*RAFT_BANK_LIMIT;
    if(body.x*body.vx>0)body.vx=0;
  }
}

// A shore transition clears queued ground actions, not progression or powers.
export function clearRaftGroundActions(run){
  run.y=0;run.vy=0;run.slide=0;run.slideNext=0;
  run.jumpBuffer=0;run.diving=false;run.slideExpiredAt=null;
}

export const RAFT_REWARD=250;

// Call with the actual simulation interval, not a restored distance alone.
// Skipping an entire ride cannot manufacture a completion reward.
export function advanceRaft(run,from,to){
  if(run.ended||!Number.isFinite(from)||!Number.isFinite(to)||to<=from)return null;
  if(run.raft){
    if(to<run.raft.end)return 'riding';
    const completed=from<run.raft.end;
    run.raft=null;
    clearRaftGroundActions(run);
    if(!completed)return 'aborted';
    run.rafts=(run.rafts||0)+1;
    run.bonusPoints+=RAFT_REWARD;
    run.invulnerable=Math.max(run.invulnerable,1.2);
    run.events.push('raft-end');
    return 'exited';
  }
  const section=raftAt(to);
  if(!section||from>section.start||section.index<=(run.lastRaftIndex??-1)||run.zipline)return null;
  run.lastRaftIndex=section.index;
  run.raft={...section,boardedAt:run.time,boardingHeight:run.y};
  clearRaftGroundActions(run);
  run.events.push('raft-start');
  return 'entered';
}

export function moveRaft(run,target,dt){
  if(!run.raft||run.ended||!Number.isFinite(dt)||dt<=0)return false;
  steerRaft(run,target+raftCurrent(run.distance),dt);
  clearRaftGroundActions(run);
  return true;
}
