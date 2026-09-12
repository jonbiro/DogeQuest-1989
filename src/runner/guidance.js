// One small, timely hint at the edge of the trail; never a stack of banners.
import {LANES} from './world.js';
import {steer,jumpLandingTime,JUMP_BUFFER,SLIDE_BUFFER} from './motion.js';
import {turnPrompt} from './turns.js';
import {courseCue} from './courses.js';
import {timingLesson} from './mistakes.js';
import {laneCue} from './lane-cue.js';

function onApproach(run, object) {
  const projected = {x:run.x, vx:run.vx};
  steer(projected, LANES[run.lane], (object.at - run.distance + .4) / run.speed);
  return Math.abs(LANES[object.lane] - projected.x) < .95;
}

export function actionCue(run) {
  const turn = turnPrompt(run);
  if (turn) return turn.status === 'accepted' ? '✓ TURN SET'
    : turn.direction === 'left' ? '← TURN LEFT' : '→ TURN RIGHT';
  const weave = courseCue(run);
  if (weave) return weave;
  if (run.zipline) {
    const bone = run.objects.filter(object => object.airborne && ['bone','gift'].includes(object.type) &&
      (object.type === 'gift' || run.magnet === 0) &&
      !object.used && !object.pull && object.at > run.distance &&
      object.at-run.distance < run.speed*.8).sort((a,b)=>a.at-b.at)[0];
    return !bone ? '' : laneCue(run.lane,bone.lane,bone.type==='gift'?'GIFT':'BONES');
  }
  const cable = run.objects.find(object => object.type === 'zipline-start' && !object.caught &&
    object.at > run.distance && object.at - run.distance < run.speed * 1.6);
  if (cable) {
    if (cable.at - run.distance >= run.speed * .45) return 'ZIPLINE AHEAD · high bones';
    return run.y > .05 || run.vy > 0 ? 'CATCH THE TURQUOISE HANDLE' : '↑ JUMP · ZIPLINE';
  }
  if (run.zoomies > 0) return '';
  const danger = run.objects.find(object => !object.used && !object.passed &&
    ['rock', 'log', 'arch', 'branch', 'gate', 'gap'].includes(object.type) &&
    object.at > run.distance && object.at - run.distance < run.speed * .45 && onApproach(run, object));
  // Jumping already answers low hazards, but an overhead row needs a new
  // downward input. Keep that escape visible until the dive is underway.
  if (run.y > 0 || run.vy > 0) {
    if (danger && ['arch', 'branch', 'gate'].includes(danger.type) && !run.diving)
      return '↓ DIVE · SLIDE';
    if (danger && !run.diving && run.vy<0 && !run.jumpBuffer) {
      const landing=jumpLandingTime(run);
      if (landing<=JUMP_BUFFER && (danger.at-run.distance+.4)/run.speed>landing)
        return '↑ JUMP AGAIN';
    }
    return '';
  }
  if (danger && ['arch','branch','gate'].includes(danger.type) &&
      run.slide+(run.slideNext||0) > (danger.at - run.distance + .4) / run.speed) return '';
  if (danger && ['arch','branch','gate'].includes(danger.type) && run.slide>SLIDE_BUFFER)
    return 'OVERHEAD NEXT';
  const intro = run.course && run.course.start-run.distance < 40 &&
    run.course.start-run.distance > run.speed*.5 ? `${run.course.name} · +180 clean` : '';
  return !danger ? intro : ['arch', 'branch', 'gate'].includes(danger.type)
    ? '↓ SLIDE' : danger.type === 'gap' ? '↑ JUMP GAP' : '↑ JUMP';
}

// Gates reserve the final 45m from obstacle rows. Keep the actionable choice
// inside that clear stretch, with room for the last hazard's collision depth.
export function routeChoiceCue(run) {
  if (run.choicePending === null) return '';
  const remaining=run.choicePending-run.distance;
  return remaining>0 && remaining<=40
    ? `GATES IN ${Math.ceil(remaining)}m · ← Scenic: fewer obstacles · Challenge: more points →` : '';
}

export function eventNotice(event, run) {
  if (event === 'hit' && run.lastMistake?.type === 'corner')
    return {text:`Missed ${run.lastMistake.direction} turn · ${run.hearts} ${run.hearts === 1 ? 'heart' : 'hearts'} left`, priority:3};
  const notices = {
    flow: {text: `${run.cleanStreak} clean moves · +${run.lastFlowBonus}`, priority: 0},
    hit: {text: `${run.hearts} ${run.hearts === 1 ? 'heart' : 'hearts'} left`, priority: 3},
    'shield-break': {text: 'Shield used', priority: 2},
    'route-scenic': {text: 'Scenic trail', priority: 1},
    'route-challenge': {text: 'Challenge trail · +60 per clear', priority: 1},
    'zipline-end': {text: 'Zipline complete · +250', priority: 1},
    'course-complete': {text: 'Clean regional course · +180', priority: 1},
  };
  return notices[event] || null;
}

export function runLesson(run) {
  if (run.retired) return 'Good dogs deserve a break. Only completed challenges and traversal rewards count; your next adventure is ready whenever you are.';
  if (run.lastMistake?.type==='rock' && run.lastMistake.courseWeave)
    return 'This course rewards finding the open lane. Each swipe moves one lane; ×2 means swipe twice. The hint updates after your first move.';
  const timing = timingLesson(run.lastMistakeDetail);
  if (timing) return timing;
  const mistake = run.lastMistake;
  if (!mistake) return 'Keep an eye on the trail ahead. Your next run is one tap away.';
  if (mistake.type === 'corner') return `Missed a ${mistake.direction} turn. Swipe ${mistake.direction} when the turn arrow appears; one swipe locks it in.`;
  if (['arch', 'branch', 'gate'].includes(mistake.type)) return 'Caught an overhead obstacle. Slide as it approaches; a jump will not fit underneath.';
  if (mistake.type === 'gap') return 'Missed a broken trail section. Jump at the striped edge, not far in advance.';
  return 'Clipped a low obstacle. Jump shortly before it reaches your puppy, or take an open lane.';
}

export function dockMode({cue, route, notice, missionComplete}) {
  return cue ? 'cue' : route ? 'route-choice' : notice ? 'toast' : !missionComplete ? 'mission-summary' : '';
}
