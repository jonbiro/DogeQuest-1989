// One small, timely hint at the edge of the trail; never a stack of banners.
import {LANES} from './world.js';
import {steer,jumpLandingTime,JUMP_BUFFER,SLIDE_BUFFER} from './motion.js';
import {turnPrompt} from './turns.js';
import {courseCue} from './courses.js';
import {timingLesson} from './mistakes.js';
import {laneCue} from './lane-cue.js';
import {movingGateSafeLane, movingGateX} from './moving-gate.js';

function onApproach(run, object) {
  const projected = {x:run.x, vx:run.vx};
  // Forecast the lane the runner is already committed to, rather than
  // silently steering the forecast toward every nearby object. That keeps
  // hints tied to the occupied/destination lane (and prevents an off-path
  // hazard from masking the action for the obstacle actually in front of the
  // puppy). Moving gates still use their animated collision position.
  steer(projected, LANES[run.lane], (object.at - run.distance + .4) / run.speed);
  const target = object.movingGate ? movingGateX(object, object.at) : LANES[object.lane];
  return Math.abs(target - projected.x) < .95;
}

function movingGateCue(run, object) {
  if (!object?.movingGate) return '';
  const target = movingGateSafeLane(object, object.at, run.lane);
  const lane = laneCue(run.lane, target, 'OPEN LANE');
  return lane || '↔ MOVING GATE · FOLLOW THE OPENING';
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
  if(run.minecart){
    const objects = Array.isArray(run.objects) ? run.objects : [];
    const obstacle=objects.find(object=>object.minecartHazard&&!object.used&&object.at>run.distance&&object.at-run.distance<run.speed*1.35);
    if (obstacle) return laneCue(run.lane,obstacle.minecartSafeLane,'CART');
    const gem = run.minecartChoice
      ? objects
        .filter(object => object.minecartChoice === 'gem' && !object.used && !object.passed &&
          object.at > run.distance && object.at - run.distance < run.speed * 1.35)
        .sort((a, b) => a.at - b.at)[0]
      : null;
    if (gem) return laneCue(run.lane,gem.lane,'GEM LINE') || 'CART · CHOOSE GEM OR BONES';
    return run.minecart.end-run.distance<run.speed*.8
      ? 'CART EXIT AHEAD'
      : run.minecartChoice ? 'CART · CHOOSE GEM OR BONES' : 'CART · STEER LEFT / RIGHT';
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
  const cart = run.objects.find(object => object.type === 'minecart-start' && !object.used &&
    object.at > run.distance && object.at - run.distance < run.speed * 1.6);
  if (cart) return cart.at - run.distance >= run.speed * .35
    ? 'MINE-CART AHEAD · AUTO-BOARD'
    : 'MINE-CART AHEAD · GET READY';
  const cable = run.objects.find(object => object.type === 'zipline-start' && !object.caught &&
    object.at > run.distance && object.at - run.distance < run.speed * 1.6);
  if (cable) {
    if (cable.at - run.distance >= run.speed * .45) return 'ZIPLINE AHEAD · zipline bones';
    return run.y > .05 || run.vy > 0 ? 'CATCH THE TURQUOISE HANDLE' : '↑ JUMP · ZIPLINE';
  }
  // A chase is a reward beat, not a new hazard. Point at the next authored
  // pickup only while the lane is otherwise safe; any imminent obstacle below
  // still owns the cue and keeps the player out of a distracting side quest.
  const chaseBone = run.dogChase && (Array.isArray(run.objects) ? run.objects : [])
    .filter(object => object.chasePickup && object.type === 'bone' && !object.used &&
      !object.passed && object.at > run.distance && object.at - run.distance < run.speed * 1.65)
    .sort((a, b) => a.at - b.at)[0];
  if (run.zoomies > 0) return '';
  // A closely following jump needs an earlier first takeoff so the next landing
  // buffer remains usable. Short slides retain their normal half-second cue.
  const warningLead=object=>['log','rock','gap','moving-gate'].includes(object.type)&&run.objects.some(next=>
    ['log','rock','gap','moving-gate'].includes(next.type)&&!next.used&&!next.passed&&next.at>object.at&&
    next.at-object.at<run.speed*.75&&onApproach(run,next)) ? .58 : .5;
  const relic=run.objects.find(object=>object.type==='relic'&&!object.used&&
    object.at>run.distance&&object.at-run.distance<run.speed*1.1);
  // A lane change takes time to settle. Do not steer toward a collectible if
  // that lane is about to become the occupied path for another hazard.
  const relicLaneBlocked=relic&&run.objects.some(object=>
    ['rock','log','arch','branch','gate','moving-gate','gap'].includes(object.type)&&!object.used&&
    object.at>run.distance&&object.at-run.distance<run.speed*1.25&&object.lane===relic.lane);
  const danger = run.objects.find(object => !object.used && !object.passed &&
    ['rock', 'log', 'arch', 'branch', 'gate', 'moving-gate', 'gap'].includes(object.type) &&
    object.at > run.distance && object.at - run.distance < run.speed*.58 &&
    // A moving gate is a shared timing beat: announce it even when its bar is
    // currently sweeping across another lane so the player can watch the
    // opening instead of discovering it only after it enters their path.
    (object.movingGate
      ? object.at - run.distance < run.speed * .5 || onApproach(run, object)
      : onApproach(run, object)) &&
    (object.at-run.distance<run.speed*.5 || object.at-run.distance<run.speed*warningLead(object)));
  // Jumping already answers low hazards, but an overhead row needs a new
  // downward input. Keep that escape visible until the dive is underway.
  if (run.y > 0 || run.vy > 0) {
    if (danger && ['arch', 'branch', 'gate', 'moving-gate'].includes(danger.type) && !run.diving)
      return '↓ DIVE · SLIDE';
    if (danger && !run.diving && run.vy<0 && !run.jumpBuffer) {
      const landing=jumpLandingTime(run);
      if (landing<=JUMP_BUFFER && (danger.at-run.distance+.4)/run.speed>landing)
        return '↑ JUMP AGAIN';
    }
    return '';
  }
  if (danger && ['arch','branch','gate','moving-gate'].includes(danger.type) &&
      run.slide+(run.slideNext||0) > (danger.at - run.distance + .4) / run.speed) return '';
  if (danger && ['arch','branch','gate','moving-gate'].includes(danger.type) && run.slide>SLIDE_BUFFER)
    return 'OVERHEAD NEXT';
  const intro = run.course && run.course.start-run.distance < 40 &&
    run.course.start-run.distance > run.speed*.5 ? `${run.course.name} · ${run.course.scenic?'open lanes':'+180 clean'}` : '';
  if (!danger && run.dogChase) {
    if (chaseBone) return laneCue(run.lane, chaseBone.lane, 'CHASE') || 'PUPPY CHASE · FOLLOW THE TAIL';
    return 'PUPPY CHASE · FOLLOW THE TAIL';
  }
  if (!danger && relic && !relicLaneBlocked) return laneCue(run.lane,relic.lane,'RELIC') || '✦ RELIC AHEAD';
  return !danger ? intro : ['arch', 'branch', 'gate', 'moving-gate'].includes(danger.type)
    ? (danger.type === 'moving-gate' ? movingGateCue(run, danger) : '↓ SLIDE')
    : danger.type === 'gap' ? (danger.bridgeCollapse ? 'BRIDGE COLLAPSING · ↑ JUMP' : '↑ JUMP GAP') : '↑ JUMP';
}

// Keep the first touch lesson attached to the thumb controls instead of
// placing another banner in the play corridor. It stays through the first few
// deliberate actions, with one extra explanation when a long drag is broken
// into several small lane moves. A new player often needs more than one
// attempt to discover the controls; this low-profile dock is the least noisy
// place to keep that help available.
export function touchCoach(run) {
  const actions = Number.isFinite(run?.touchActionCount)
    ? run.touchActionCount : run?.inputCount || 0;
  if (!run?.touchHint || (actions >= 4 && !run.touchOverdrag)) return '';
  if (run.touchOverdrag)
    return 'ONE SWIPE = ONE MOVE · STOP, THEN DRAG AGAIN';
  if (actions === 0)
    return 'TAP BUTTONS · ONE SWIPE = ONE MOVE';
  // Keep the first lesson aligned with the visible buttons. Only introduce
  // the no-lift gesture vocabulary after the player has actually tried one;
  // a first-time player should never feel that a swipe is required.
  return run.touchSwipeSeen
    ? 'ONE SWIPE = ONE MOVE · STOP, THEN DRAG AGAIN'
    : 'ONE TAP = ONE MOVE · SWIPES OPTIONAL';
}

// Keep a live gesture label beside the controls while a touch is still down.
// This closes the gap between a finger movement and the resulting lane/action
// without adding a second message over the playable trail. Mouse pointers do
// not need this coaching because desktop already has visible buttons/keys.
export function touchGestureCoach(pointer) {
  if (!pointer || pointer.pointerType !== 'touch') return '';
  if (!pointer.axis) return 'DRAG ONE WAY · ONE MOVE';
  if (pointer.laneDirection === 'left') return '← ONE LANE · STOP, THEN DRAG AGAIN';
  if (pointer.laneDirection === 'right') return '→ ONE LANE · STOP, THEN DRAG AGAIN';
  if (pointer.laneDirection === 'jump') return '↑ JUMP · STOP, THEN DRAG AGAIN';
  if (pointer.laneDirection === 'slide') return '↓ SLIDE · STOP, THEN DRAG AGAIN';
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
  if (event === 'modifier-start' && run.modifier)
    return {text: run.modifier.name + ' ready · ' + run.modifier.effect, priority: 1};
  const notices = {
    'full-heart': {text:'Full hearts · +100 points',priority:0},
    'spare-shield': {text:'Shield already active · +100 points',priority:0},
    hit: {text: `${run.hearts} ${run.hearts === 1 ? 'heart' : 'hearts'} left`, priority: 3},
    'shield-break': {text: 'Shield used', priority: 2},
    'route-scenic': {text: 'Scenic trail', priority: 1},
    'route-challenge': {text: 'Challenge trail · +60 per clear', priority: 1},
    'zipline-end': {text: 'Zipline complete · +250', priority: 1},
    'raft-end': {text: 'Shore reached · +250', priority: 1},
    'minecart-end': {text: 'Cart reached · +250', priority: 1},
    'dog-chase-start': {text: 'Puppy ahead · follow the bone line', priority: 1},
    'dog-chase-end': {text: 'Chase complete · +140', priority: 1},
    'bridge-collapse': {text: 'Bridge shifting · jump gap ahead', priority: 1},
    'course-complete': {text: 'Clean regional course · +180', priority: 1},
    'course-recovery': {text: 'Strong finish · 2/3 clean · +60', priority: 1},
    relic: {text: 'Area relic · +160 points', priority: 0},
  };
  return notices[event] || null;
}

export function runLesson(run) {
  if (run.retired) return 'Good dogs deserve a break. Only completed challenges and traversal rewards count; your next adventure is ready whenever you are.';
  if(run.lastMistake?.minecartHazard)return run.lastMistakeDetail?.reason==='late-minecart-steer'
    ? 'The cart was still drifting toward the open lane. Start steering earlier; one swipe moves one lane and jump/slide return after the cart.'
    : run.minecartChoice
      ? 'Steer the cart into the open lane between the rocks. The bone lane is steady; the glowing gem lane is optional for +250 points each.'
      : 'Steer the cart into the open lane between the rocks. The cart boards automatically; one swipe moves one lane and jump/slide return after the cart.';
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
  if (mistake.type === 'moving-gate') return 'The moving gate swept into your lane. Follow the opening to a clear lane, or slide under it as it arrives.';
  if (['arch', 'branch', 'gate'].includes(mistake.type)) return 'Caught an overhead obstacle. Slide as it approaches; a jump will not fit underneath.';
  if (mistake.type === 'gap') return mistake.bridgeCollapse
    ? 'The bridge gave way. Jump at the bright striped edge and stay airborne until the far plank.'
    : 'Missed a broken trail section. Jump at the striped edge, not far in advance.';
  return 'Clipped a low obstacle. Jump shortly before it reaches your puppy, or take an open lane.';
}

export function dockMode({cue, route, notice, missionComplete}) {
  return cue ? 'cue' : route ? 'route-choice' : notice ? 'toast' : !missionComplete ? 'mission-summary' : '';
}
