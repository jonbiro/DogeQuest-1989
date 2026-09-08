// One small, timely hint at the edge of the trail; never a stack of banners.
import {LANES} from './world.js';
import {steer} from './motion.js';
import {turnPrompt} from './turns.js';
import {courseCue} from './courses.js';

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
  if (run.zipline) return '';
  const cable = run.objects.find(object => object.type === 'zipline-start' && !object.caught &&
    object.at > run.distance && object.at - run.distance < run.speed * 1.6);
  if (cable) {
    if (cable.at - run.distance >= run.speed * .45) return 'ZIPLINE AHEAD · high bones';
    return run.y > .05 || run.vy > 0 ? 'CATCH THE TURQUOISE HANDLE' : '↑ JUMP · ZIPLINE';
  }
  if (run.y > .05 || run.vy > 0) return '';
  if (run.zoomies > 0) return '';
  const danger = run.objects.find(object => !object.used && !object.passed &&
    ['rock', 'log', 'arch', 'branch', 'gate', 'gap'].includes(object.type) &&
    object.at > run.distance && object.at - run.distance < run.speed * .45 && onApproach(run, object));
  if (danger && ['arch','branch','gate'].includes(danger.type) &&
      run.slide > (danger.at - run.distance + .4) / run.speed) return '';
  const intro = run.course && run.course.start-run.distance < 40 &&
    run.course.start-run.distance > run.speed*.5 ? `${run.course.name} · +180 clean` : '';
  return !danger ? intro : ['arch', 'branch', 'gate'].includes(danger.type)
    ? '↓ SLIDE' : danger.type === 'gap' ? '↑ JUMP GAP' : '↑ JUMP';
}

export function eventNotice(event, run) {
  if (event === 'hit' && run.lastMistake?.type === 'corner')
    return {text:`Missed ${run.lastMistake.direction} turn · ${run.hearts} ${run.hearts === 1 ? 'heart' : 'hearts'} left`, priority:3};
  const notices = {
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
