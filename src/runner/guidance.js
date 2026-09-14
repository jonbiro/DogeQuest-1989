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
  if(run.raft){
    const obstacle=run.objects.find(object=>object.raftHazard&&!object.used&&object.at>run.distance&&object.at-run.distance<run.speed*1.35);
    return obstacle?laneCue(run.lane,obstacle.raftSafeLane,'RAFT'):
      run.raft.end-run.distance<run.speed*.8?'SHORE AHEAD':'RAFT · STEER LEFT / RIGHT';
  }
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
    if (cable.at - run.distance >= run.speed * .45) return 'ZIPLINE AHEAD · zipline bones';
    return run.y > .05 || run.vy > 0 ? 'CATCH THE TURQUOISE HANDLE' : '↑ JUMP · ZIPLINE';
  }
  if (run.zoomies > 0) return '';
  // A closely following jump needs an earlier first takeoff so the next landing
  // buffer remains usable. Short slides retain their normal half-second cue.
  const warningLead=object=>['log','rock','gap'].includes(object.type)&&run.objects.some(next=>
    ['log','rock','gap'].includes(next.type)&&!next.used&&!next.passed&&next.at>object.at&&
    next.at-object.at<run.speed*.75&&onApproach(run,next)) ? .58 : .5;
  const relic=run.objects.find(object=>object.type==='relic'&&!object.used&&
    object.at>run.distance&&object.at-run.distance<run.speed*1.1);
  // A lane change takes time to settle. Do not steer toward a collectible if
  // that lane is about to become the occupied path for another hazard.
  const relicLaneBlocked=relic&&run.objects.some(object=>
    ['rock','log','arch','branch','gate','gap'].includes(object.type)&&!object.used&&
    object.at>run.distance&&object.at-run.distance<run.speed*1.25&&object.lane===relic.lane);
  const danger = run.objects.find(object => !object.used && !object.passed &&
    ['rock', 'log', 'arch', 'branch', 'gate', 'gap'].includes(object.type) &&
    object.at > run.distance && object.at - run.distance < run.speed*.58 &&
    onApproach(run, object) &&
    (object.at-run.distance<run.speed*.5 || object.at-run.distance<run.speed*warningLead(object)));
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
    run.course.start-run.distance > run.speed*.5 ? `${run.course.name} · ${run.course.scenic?'open lanes':'+180 clean'}` : '';
  if (!danger && relic && !relicLaneBlocked) return laneCue(run.lane,relic.lane,'RELIC') || '✦ RELIC AHEAD';
  return !danger ? intro : ['arch', 'branch', 'gate'].includes(danger.type)
    ? '↓ SLIDE' : danger.type === 'gap' ? '↑ JUMP GAP' : '↑ JUMP';
}

// Keep the first touch lesson attached to the thumb controls instead of
// placing another banner in the play corridor. It stays through the first few
// deliberate actions, with one extra explanation when a long drag is broken
// into several small lane snaps. A new player often needs more than one
// attempt to discover the controls; this low-profile dock is the least noisy
// place to keep that help available.
export function touchCoach(run) {
  const actions = Number.isFinite(run?.touchActionCount)
    ? run.touchActionCount : run?.inputCount || 0;
  if (!run?.touchHint || (actions >= 4 && !run.touchOverdrag)) return '';
  if (run.touchOverdrag)
    return 'KEEP DRAGGING · ONE LANE PER SNAP';
  if (actions === 0)
    return 'TAP TO MOVE · DRAG TO STEER';
  // Keep the first lesson aligned with the visible buttons. Only introduce
  // the no-lift gesture vocabulary after the player has actually tried one;
  // a first-time player should never feel that a swipe is required.
  return run.touchSwipeSeen
    ? 'DRAG ONE LANE · KEEP MOVING OR LIFT'
    : 'ONE TAP = ONE MOVE · SWIPES OPTIONAL';
}

// Keep a live gesture label beside the controls while a touch is still down.
// This closes the gap between a finger movement and the resulting lane/action
// without adding a second message over the playable trail. Mouse pointers do
// not need this coaching because desktop already has visible buttons/keys.
export function touchGestureCoach(pointer) {
  if (!pointer || pointer.pointerType !== 'touch') return '';
  if (!pointer.axis) return 'DRAG A SHORT WAY · ONE MOVE';
  if (pointer.laneDirection === 'left') return '← ONE LANE · KEEP DRAGGING OR LIFT';
  if (pointer.laneDirection === 'right') return '→ ONE LANE · KEEP DRAGGING OR LIFT';
  if (pointer.laneDirection === 'jump') return '↑ JUMP · KEEP PLAYING OR LIFT';
  if (pointer.laneDirection === 'slide') return '↓ SLIDE · KEEP PLAYING OR LIFT';
  return '';
}

// Keep the coach visible beside a quiet opening/course cue, but yield the
// limited lower screen to route decisions, timed result toasts and urgent
// movement instructions. A player should never have to choose between two
// different messages while an obstacle is inside its reaction window.
export function touchCoachVisible(run, mode, state = 'playing', cue = '', liveCopy = '') {
  const quietCourseCue = !cue || / · (?:open lanes|\+\d+ clean)$/.test(cue);
  return state === 'playing' && Boolean(touchCoach(run) || liveCopy) &&
    !['route-choice', 'toast'].includes(mode) &&
    !(mode === 'cue' && !quietCourseCue);
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
    'full-heart': {text:'Full hearts · +100 points',priority:0},
    'spare-shield': {text:'Shield already active · +100 points',priority:0},
    flow: {text: `${run.cleanStreak} clean moves · +${run.lastFlowBonus}`, priority: 0},
    hit: {text: `${run.hearts} ${run.hearts === 1 ? 'heart' : 'hearts'} left`, priority: 3},
    'shield-break': {text: 'Shield used', priority: 2},
    'route-scenic': {text: 'Scenic trail', priority: 1},
    'route-challenge': {text: 'Challenge trail · +60 per clear', priority: 1},
    'zipline-end': {text: 'Zipline complete · +250', priority: 1},
    'raft-end': {text: 'Shore reached · +250', priority: 1},
    'course-complete': {text: 'Clean regional course · +180', priority: 1},
    'course-recovery': {text: 'Strong finish · 2/3 clean · +60', priority: 1},
    relic: {text: 'Area relic · +160 points', priority: 0},
  };
  return notices[event] || null;
}

export function runLesson(run) {
  if (run.retired) return 'Good dogs deserve a break. Only completed challenges and traversal rewards count; your next adventure is ready whenever you are.';
  if(run.lastMistake?.raftHazard)return run.lastMistakeDetail?.reason==='late-raft-steer'
    ? 'The raft was still drifting toward the open lane. Follow the arrow earlier; ×2 means two drag segments. Jump and slide return at the shore.'
    : 'Steer the raft into the open lane between the river rocks. Each drag segment moves one lane; ×2 means drag twice. Jump and slide return at the shore.';
  if (run.lastMistake?.type==='rock' && run.lastMistake.courseWeave)
    return run.lastMistakeDetail?.reason==='late-weave'
      ? 'You chose the open lane, but reached it too late. Start steering a little earlier; for a ×2 hint, make both drag segments before the rocks reach your puppy.'
      : 'This course rewards finding the open lane. Each drag segment moves one lane; ×2 means drag twice. The hint updates after your first move.';
  const timing = timingLesson(run.lastMistakeDetail,run.lastMistake?.type);
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
