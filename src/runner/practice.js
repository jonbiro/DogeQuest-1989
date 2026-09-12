import {createRun, fillTrack, step, LANES} from './world.js';
import {actionCue} from './guidance.js';
import {ZIPLINE_FIRST,ZIPLINE_LENGTH} from './ziplines.js';
import {cornerByIndex,turnPrompt} from './turns.js';
import {courseAt,courseCue} from './courses.js';

const LESSONS = [
  {at:35,type:'log',hint:'Logs ahead · wait for the cue'},
  {at:75,type:'gate',hint:'Gates ahead · wait for the cue'},
  {at:115,type:'rock',hint:'← Steer into the open left lane'},
];
const GAP_LESSON={at:35,type:'gap',hint:'Gap ahead · wait for the jump cue'};
export function practiceOffer(run) {
  if (!run.ended || run.practice || run.retired) return null;
  const mistake=run.lastMistake;
  if (mistake?.type==='rock' && mistake.courseWeave)
    return {kind:'weave',cornerIndex:0,label:'Practise lane weaves'};
  if (mistake?.type==='gap') return {kind:'gap',cornerIndex:0,label:'Practise gap jumps'};
  if (mistake?.type==='corner' && ['left','right'].includes(mistake.direction))
    return {kind:'turn',cornerIndex:mistake.direction==='right'?1:0,label:'Practise this turn'};
  if (['log','rock','arch','branch','gate'].includes(mistake?.type))
    return {kind:'moves',cornerIndex:0,label:'Practise the basics'};
  return null;
}
function lessonFeedback(lesson,correct,detail) {
  if (lesson.type==='gap') return correct ? '✓ Gap cleared' : 'Jump at the cue · do not slide';
  if (correct) return lesson.type==='log' ? '✓ Jump cleared' : lesson.type==='gate' ? '✓ Slide cleared' : '✓ Open lane found';
  if (lesson.type==='rock') return 'Steer left into the open lane';
  const reason=Math.abs((detail?.distance ?? -100)-lesson.at)<2 ? detail.reason : '';
  const timing={
    'early-jump':'Jump later · nearer the log',
    'late-jump':'Jump a little earlier',
    'cancelled-jump':'Stay airborne over the log',
    'early-slide':'Slide later · nearer the gate',
    'late-dive':'Slide earlier, from the ground',
  };
  return timing[reason] || (lesson.type==='log' ? 'Use ↑ to jump over logs' : 'Use ↓ to slide under gates');
}
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
export function createGapPracticeRun(upgrades = {}) {
  const run=createPracticeRun(upgrades);
  run.practice.kind='gap';
  run.objects=[0,1,2].map(lane=>({id:run.id++,type:'gap',lane,at:GAP_LESSON.at,used:false}));
  return run;
}
export function createWeavePracticeRun(upgrades = {}) {
  const run=createRun(1989,upgrades),course=courseAt(1020);
  Object.assign(run,{distance:990,lane:2,x:LANES[2],vx:0,speed:12,course,
    objects:[],nextRow:Infinity,nextChoice:Infinity,nextZipline:Infinity,nextCorner:2,choicePending:null});
  run.previous={x:run.x,y:run.y,distance:run.distance};
  run.practice={kind:'weave',start:run.distance,end:1105,index:0,correct:0,outcomes:[]};
  for(const beat of course.beats)for(let lane=0;lane<3;lane++)if(lane!==beat.safeLane)
    run.objects.push({id:run.id++,type:'rock',courseRegion:2,lane,at:beat.at,used:false});
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
export function createTurnPracticeRun(upgrades = {}, cornerIndex = 0) {
  const run = createRun(1989, upgrades);
  const corner = cornerByIndex(cornerIndex === 1 ? 1 : 0);
  Object.assign(run, {distance:corner.at-35, speed:12, objects:[],
    nextCorner:corner.index, nextRow:Infinity, nextChoice:Infinity, nextZipline:Infinity,
    choicePending:null});
  run.previous = {x:run.x,y:run.y,distance:run.distance};
  run.practice = {kind:'turn',cornerIndex:corner.index,start:run.distance,
    direction:corner.direction,end:corner.end+15,correct:0,outcomes:[]};
  return run;
}
export function stepPractice(run, dt) {
  if (!run.practice || run.ended) return;
  if(run.practice.kind==='weave') {
    const course=run.course,checked=course.checked,clean=course.clean;
    step(run,dt);
    if(course.checked>checked) {
      const correct=course.clean>clean;
      run.practice.outcomes.push(correct);
      const late=!correct&&run.lane===course.beats[checked].safeLane;
      if(late)run.practice.lateWeaves=(run.practice.lateWeaves||0)+1;
      const feedback=correct?'✓ Open lane found':late
        ? 'Correct lane · steer earlier next time'
        : 'Aim for the open lane · ×2 means two swipes';
      run.practice.feedback={text:feedback,until:run.time+1};
    }
    run.practice.index=course.checked;run.practice.correct=course.clean;
    run.hearts=3;run.fetchCharge=0;
    run.events=run.events.filter(event=>!['hit','flow','end'].includes(event));
    if(run.distance>=run.practice.end)run.ended=true;
    return;
  }
  if (run.practice.kind === 'turn') {
    step(run, dt);
    if (run.nextCorner > run.practice.cornerIndex) {
      run.practice.correct = run.turns > 0 ? 1 : 0;
      run.practice.outcomes = [Boolean(run.practice.correct)];
    }
    run.hearts = 3;
    run.fetchCharge = 0;
    run.events = run.events.filter(event => !['hit','flow','end'].includes(event));
    if (run.distance >= run.practice.end) run.ended = true;
    return;
  }
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
  const lesson = (run.practice.kind==='gap' ? [GAP_LESSON] : LESSONS)[run.practice.index];
  const clears = run.clears;
  step(run, dt);
  if (lesson && run.distance > lesson.at + .4) {
    const correct = lesson.type === 'rock' ? Math.abs(run.x-LANES[0]) < .75 : run.clears > clears;
    run.practice.outcomes.push(correct);
    run.practice.feedback={text:lessonFeedback(lesson,correct,run.lastMistakeDetail),until:run.time+1};
    run.practice.correct += Number(correct);
    run.practice.index++;
  }
  run.hearts = 3;
  run.fetchCharge = 0;
  run.events = run.events.filter(event => !['hit','flow','end'].includes(event));
  if (run.distance >= (run.practice.kind==='gap' ? 55 : 130)) run.ended = true;
}
export function practiceCue(run) {
  if(run.practice.kind==='weave') {
    if(run.practice.feedback?.until>run.time)return run.practice.feedback.text;
    return courseCue(run) || (run.practice.index===3?'Weave practice complete':'Open lane ahead · ×2 means two swipes');
  }
  if (run.practice.kind==='gap') {
    if (run.practice.feedback?.until>run.time) return run.practice.feedback.text;
    if (run.practice.outcomes.length) return 'Gap practice complete';
    if (run.y>0 || run.vy>0) return 'Stay airborne · do not slide';
    return GAP_LESSON.at-run.distance < run.speed*.45 ? '↑ JUMP GAP' : GAP_LESSON.hint;
  }
  if (run.practice.kind === 'turn') {
    const prompt = turnPrompt(run);
    if (prompt) return actionCue(run);
    if (run.practice.outcomes.length) return run.practice.correct
      ? '✓ CORNER CLEARED' : `Next try: swipe ${run.practice.direction} at the arrow`;
    return `${run.practice.direction === 'left' ? '←' : '→'} Corner ahead · wait for the turn cue`;
  }
  if (run.practice.kind === 'zipline') {
    if (run.ziplines) return '✓ LANDED · high bones belong to the cable';
    return actionCue(run) || (run.zipline ? 'Steer toward the high bones' : 'ZIPLINE AHEAD · wait for jump cue');
  }
  if (run.practice.feedback?.until>run.time) return run.practice.feedback.text;
  const lesson = LESSONS[run.practice.index];
  if (!lesson) return `${run.practice.correct}/3 moves practised · trail complete`;
  if (lesson.type==='log' && (run.y>0 || run.vy>0)) return 'Jumping · wait for landing';
  if (lesson.type==='gate' && run.slide>0) return 'Sliding · stay low';
  const near = lesson.at-run.distance < run.speed*.45;
  return `${run.practice.index+1}/3 · ${near && lesson.type!=='rock' ? lesson.type==='log'?'↑ JUMP NOW':'↓ SLIDE NOW' : lesson.hint}`;
}

export function practiceProgress(run) {
  if(run.practice.kind==='weave')return `${run.practice.correct}/3 weaves cleared`;
  if (run.practice.kind==='gap') return `${run.practice.correct}/1 gap cleared`;
  if (run.practice.kind==='turn') return `${run.practice.direction} corner · ${run.practice.correct}/1 cleared`;
  return run.practice.kind==='zipline' ? `${run.bones}/18 high bones · ${run.ziplines ? 'landed' : run.practice.caught ? 'cable caught' : 'catch the cable'}` : `${run.practice.correct}/3 moves cleared`;
}
export function practiceResult(run) {
  if(run.practice.kind==='weave')return {
    title:`${run.practice.correct} of 3 weaves cleared`,
    lesson:run.practice.correct===3
      ? 'Nice footwork! Two quick swipes cross from one outside lane to the other. The hint shortens after the first move; one swipe is enough for an adjacent lane.'
      : run.practice.lateWeaves>0
        ? 'You found an open lane but arrived too late. Start steering earlier; for ×2, make both swipes before the rocks reach your puppy. Try the same moves again.'
        : 'Aim for the open lane, not the crystals. ×2 means two separate swipes in the same direction. After the first swipe, follow the remaining single-move hint.',
  };
  if (run.practice.kind==='gap') return {
    title:run.practice.correct ? 'Gap cleared!' : 'Try the gap again',
    lesson:run.practice.correct ? 'Jump as the striped edge approaches, then stay airborne until you pass the gap. The adventure uses these same jump physics.'
      : 'Wait for the jump cue near the striped edge. Jump across the full-width gap; sliding or switching lanes will not cross it.',
  };
  if (run.practice.kind==='turn') return {
    title:run.practice.correct ? 'Corner cleared!' : 'Try the turn again',
    lesson:run.practice.correct
      ? 'One swipe locks in the corner when the arrow appears. Between corners, swipes change lanes. Try the opposite direction next.'
      : `Wait for the ${run.practice.direction} turn arrow, then swipe ${run.practice.direction} once. An early swipe only changes lanes. A wrong direction can be corrected before the corner.`,
  };
  if (run.practice.kind==='zipline') return {
    title:run.practice.caught ? `${run.bones} of 18 high bones` : 'Try catching the handle',
    lesson:!run.practice.caught ? 'Wait for the jump prompt, then jump to grab the turquoise handle. High bones can only be collected while riding the cable.'
      : run.bones===18 ? 'Every high bone collected! Steer on the cable; landing happens automatically. The adventure uses these same moves.'
      : 'Handle caught! Follow the left and right bone prompts while riding. Landing is automatic; jumping from the ground cannot reach these bones.',
  };
  return {title:`${run.practice.correct} of 3 moves cleared`,lesson:run.practice.correct===3 ? 'Nice paws! You are ready to take these moves onto the adventure trail.' : 'Watch the edge prompt for jump and slide timing. For the last move, steer left instead of jumping.'};
}
