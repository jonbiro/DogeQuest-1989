import {createRun, fillTrack, step, LANES} from './world.js';
import {actionCue} from './guidance.js';
import {ZIPLINE_FIRST,ZIPLINE_LENGTH} from './ziplines.js';

const LESSONS = [
  {at:35,type:'log',hint:'↑ Jump over the logs'},
  {at:75,type:'gate',hint:'↓ Slide under the gates'},
  {at:115,type:'rock',hint:'← Steer into the open left lane'},
];
export function createPracticeRun(upgrades = {}) {
  const run = createRun(1989, upgrades);
  run.practice = {index:0,correct:0,outcomes:[]};
  run.objects = [];
  run.speed = 12;
  for (const lesson of LESSONS) for (let lane=0;lane<3;lane++) {
    if (lesson.type === 'rock' && lane === 0) continue;
    run.objects.push({id:run.id++,type:lesson.type,lane,at:lesson.at,used:false});
  }
  return run;
}
export function createZiplinePracticeRun(upgrades = {}) {
  const run=createRun(1989,upgrades);
  const start=ZIPLINE_FIRST;
  Object.assign(run,{distance:start-40,nextRow:start-40,nextZipline:start,
    nextChoice:start+400,choicePending:null,objects:[]});
  run.previous={x:run.x,y:run.y,distance:run.distance};
  fillTrack(run);
  run.objects=run.objects.filter(object=>object.type.startsWith('zipline-') || object.airborne);
  run.practice={kind:'zipline',start:run.distance,index:0,correct:0,outcomes:[],caught:false};
  run.speed=12;
  return run;
}
export function stepPractice(run, dt) {
  if (!run.practice || run.ended) return;
  if (run.practice.kind === 'zipline') {
    step(run,dt);
    run.practice.caught ||= Boolean(run.zipline) || run.ziplines>0;
    run.practice.outcomes=[run.practice.caught,run.bones===18,run.ziplines>0];
    run.practice.correct=run.practice.outcomes.filter(Boolean).length;
    run.hearts=3;
    run.fetchCharge=0;
    run.events=run.events.filter(event=>!['hit','flow','end'].includes(event));
    // A missed handle is a quick retry, not a long walk under unreachable treats.
    if ((!run.practice.caught && run.distance>ZIPLINE_FIRST+4) ||
        run.distance>=ZIPLINE_FIRST+ZIPLINE_LENGTH+20) run.ended=true;
    return;
  }
  const lesson = LESSONS[run.practice.index];
  const clears = run.clears;
  step(run, dt);
  if (lesson && run.distance > lesson.at + .4) {
    const correct = lesson.type === 'rock' ? Math.abs(run.x-LANES[0]) < .75 : run.clears > clears;
    run.practice.outcomes.push(correct);
    run.practice.correct += Number(correct);
    run.practice.index++;
  }
  run.hearts = 3;
  run.fetchCharge = 0;
  run.events = run.events.filter(event => !['hit','flow','end'].includes(event));
  if (run.distance >= 130) run.ended = true;
}
export function practiceCue(run) {
  if (run.practice.kind === 'zipline') {
    if (run.ziplines) return '✓ LANDED · high bones belong to the cable';
    return actionCue(run) || (run.zipline ? 'Steer toward the high bones' : 'ZIPLINE AHEAD · wait for jump cue');
  }
  const lesson = LESSONS[run.practice.index];
  if (!lesson) return `${run.practice.correct}/3 moves practised · trail complete`;
  const near = lesson.at-run.distance < run.speed*.45;
  return `${run.practice.index+1}/3 · ${near && lesson.type!=='rock' ? lesson.type==='log'?'↑ JUMP NOW':'↓ SLIDE NOW' : lesson.hint}`;
}

export function practiceProgress(run) {
  return run.practice.kind==='zipline' ? `${run.bones}/18 high bones · ${run.ziplines ? 'landed' : run.practice.caught ? 'cable caught' : 'catch the cable'}` : `${run.practice.correct}/3 moves cleared`;
}
export function practiceResult(run) {
  if (run.practice.kind==='zipline') return {
    title:run.practice.caught ? `${run.bones} of 18 high bones` : 'Try catching the handle',
    lesson:!run.practice.caught ? 'Wait for the jump prompt, then jump to grab the turquoise handle. High bones can only be collected while riding the cable.'
      : run.bones===18 ? 'Every high bone collected! Steer on the cable; landing happens automatically. The adventure uses these same moves.'
      : 'Handle caught! Follow the left and right bone prompts while riding. Landing is automatic; jumping from the ground cannot reach these bones.',
  };
  return {title:`${run.practice.correct} of 3 moves cleared`,lesson:run.practice.correct===3 ? 'Nice paws! You are ready to take these moves onto the adventure trail.' : 'Watch the edge prompt for jump and slide timing. For the last move, steer left instead of jumping.'};
}
