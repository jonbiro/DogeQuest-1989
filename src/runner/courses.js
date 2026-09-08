import {regionAt, REGION_LENGTH} from './regions.js';

const BEAT_OFFSETS = [0,35,70];
export const COURSE_RECOVERY = 30;
export const COURSE_LENGTH = BEAT_OFFSETS.at(-1) + COURSE_RECOVERY;
export const COURSE_BONUS = 180;
export const COURSES = [
  {name:'Root scramble', types:['log','branch','log']},
  {name:'Canyon crossings', types:['gap','log','gap']},
  {name:'Crystal slalom', lanes:[0,2,1]},
];

export function courseAt(start) {
  const region = regionAt(start), definition = COURSES[region];
  return {
    start, end:start+COURSE_LENGTH, region, visit:Math.floor(start/REGION_LENGTH),
    name:definition.name, checked:0, clean:0,
    beats:BEAT_OFFSETS.map((offset,index)=>({at:start+offset,
      type:definition.types?.[index] || 'rock', safeLane:definition.lanes?.[index]})),
  };
}

// This only scores the authored course. Ordinary hazard collision remains the
// sole owner of damage, shields and jump/slide rewards.
export function advanceCourse(run, lanes) {
  const course = run.course;
  if (!course) return;
  while (course.checked < course.beats.length && run.distance >= course.beats[course.checked].at + .4) {
    const beat = course.beats[course.checked++];
    const clean = beat.safeLane !== undefined
      ? Math.abs(run.x-lanes[beat.safeLane]) < .95
      : beat.type === 'branch' ? run.slide > 0 && run.y < .2 || run.zoomies > 0
        : run.y > (beat.type === 'gap' ? .8 : .65) || run.zoomies > 0;
    if (clean) course.clean++;
  }
  if (run.distance >= course.end) {
    if (course.clean === course.beats.length) {
      run.regionalCourses[course.region]++;
      run.bonusPoints += COURSE_BONUS;
      run.events.push('course-complete');
    }
    run.course = null;
  }
}

export function courseCue(run) {
  const course = run.course;
  if (!course) return '';
  const beat = course.beats[course.checked];
  if (!beat || beat.safeLane === undefined || beat.at < run.distance ||
      beat.at-run.distance > run.speed*.8 || run.lane === beat.safeLane) return '';
  return beat.safeLane < run.lane ? '← WEAVE LEFT' : '→ WEAVE RIGHT';
}
