// One small, timely hint at the edge of the trail; never a stack of banners.
import {LANES} from './world.js';
import {steer} from './motion.js';

function onApproach(run, object) {
  const projected = {x:run.x, vx:run.vx};
  steer(projected, LANES[run.lane], (object.at - run.distance + .4) / run.speed);
  return Math.abs(LANES[object.lane] - projected.x) < .95;
}

export function actionCue(run) {
  if (run.zipline || run.y > .05 || run.vy > 0) return '';
  const cable = run.objects.find(object => object.type === 'zipline-start' && !object.caught &&
    object.at > run.distance && object.at - run.distance < run.speed * .45);
  if (cable) return '↑ JUMP · ZIPLINE';
  if (run.zoomies > 0) return '';
  const danger = run.objects.find(object => !object.used && !object.passed &&
    ['rock', 'log', 'arch', 'branch', 'gate', 'gap'].includes(object.type) &&
    object.at > run.distance && object.at - run.distance < run.speed * .45 && onApproach(run, object));
  if (danger && ['arch','branch','gate'].includes(danger.type) &&
      run.slide > (danger.at - run.distance + .4) / run.speed) return '';
  return !danger ? '' : ['arch', 'branch', 'gate'].includes(danger.type)
    ? '↓ SLIDE' : danger.type === 'gap' ? '↑ JUMP GAP' : '↑ JUMP';
}

export function eventNotice(event, run) {
  const notices = {
    hit: {text: `${run.hearts} ${run.hearts === 1 ? 'heart' : 'hearts'} left`, priority: 3},
    'shield-break': {text: 'Shield used', priority: 2},
    'route-scenic': {text: 'Scenic trail', priority: 1},
    'route-challenge': {text: 'Challenge trail · +60 per clear', priority: 1},
    'zipline-end': {text: 'Zipline complete · +250', priority: 1},
  };
  return notices[event] || null;
}

export function dockMode({cue, route, notice, missionComplete}) {
  return cue ? 'cue' : route ? 'route-choice' : notice ? 'toast' : !missionComplete ? 'mission-summary' : '';
}
