import {regionAt, REGION_LENGTH} from './regions.js';
import {CURRENT_TRAIL_VERSION} from './trail-version.js';
import {laneCue} from './lane-cue.js';

const BEAT_OFFSETS = [0,35,70];
export const COURSE_RECOVERY = 30;
export const COURSE_LENGTH = BEAT_OFFSETS.at(-1) + COURSE_RECOVERY;
export const COURSE_BONUS = 180;
export const COURSES = [
  {name:'Root scramble', types:['log','branch','log']},
  {name:'Canyon crossings', types:['gap','log','gap']},
  {name:'Crystal slalom', lanes:[0,2,1]},
];
const LEGACY_VARIATIONS = [
  [COURSES[0],
    {name:'Canopy shuffle',types:['branch','log','branch']},
    {name:'Root rhythm',types:['log','log','branch']}],
  [COURSES[1],
    {name:'Ridge hop',types:['log','gap','log']},
    {name:'Twin crossings',types:['gap','gap','log']}],
  [COURSES[2],
    {name:'Moonpaw weave',lanes:[2,0,1]},
    {name:'Crystal switchback',lanes:[1,0,2]}],
];
const MIXED_COURSES = [
  {name:'Fern dash',beats:[{type:'log'},{type:'rock',safeLane:2},{type:'branch'}]},
  {name:'Ridge switch',beats:[{type:'gap'},{type:'rock',safeLane:0},{type:'gap'}]},
  {name:'Moonlit hurdles',beats:[{type:'rock',safeLane:2},{type:'log'},{type:'rock',safeLane:0}]},
];
const VARIATIONS=LEGACY_VARIATIONS.map((courses,i)=>[courses[0],MIXED_COURSES[i],...courses.slice(1)]);

export function courseAt(start,version=CURRENT_TRAIL_VERSION) {
  const region = regionAt(start);
  const variations=version===1?LEGACY_VARIATIONS:VARIATIONS;
  const variant = Math.floor(start / (REGION_LENGTH * COURSES.length)) % variations[region].length;
  const definition = variations[region][variant];
  return {
    start, end:start+COURSE_LENGTH, region, visit:Math.floor(start/REGION_LENGTH),
    name:definition.name, variant, checked:0, clean:0,
    beats:BEAT_OFFSETS.map((offset,index)=>({at:start+offset,
      type:definition.types?.[index] || 'rock', safeLane:definition.lanes?.[index],...definition.beats?.[index]})),
  };
}

// Scores the authored course and returns newly completed unboosted weave beats.
// Ordinary hazard collision remains the sole owner of damage and jump/slide rewards.
export function advanceCourse(run, lanes) {
  const course = run.course;
  if (!course) return 0;
  let weaves=0;
  while (course.checked < course.beats.length && run.distance >= course.beats[course.checked].at + .4) {
    const beat = course.beats[course.checked++];
    const clean = beat.safeLane !== undefined
      ? Math.abs(run.x-lanes[beat.safeLane]) < .95
      : beat.type === 'branch' ? run.slide > 0 && run.y < .2 || run.zoomies > 0
        : run.y > (beat.type === 'gap' ? .8 : .65) || run.zoomies > 0;
    if (clean) {
      course.clean++;
      if(beat.safeLane !== undefined && run.zoomies===0)weaves++;
    }
  }
  if (run.distance >= course.end) {
    if (course.clean === course.beats.length) {
      run.regionalCourses[course.region]++;
      run.bonusPoints += COURSE_BONUS;
      run.events.push('course-complete');
    }
    run.course = null;
  }
  return weaves;
}

export function courseCue(run) {
  const course = run.course;
  if (!course) return '';
  const beat = course.beats[course.checked];
  if (!beat || beat.safeLane === undefined || beat.at < run.distance ||
      beat.at-run.distance > run.speed*.8 || run.lane === beat.safeLane) return '';
  return laneCue(run.lane,beat.safeLane,'WEAVE');
}

export function activeCourse(run) {
  const course=run.course;
  return !run.practice && course && run.distance>=course.start && run.distance<course.end ? course : null;
}
export function courseProgress(run) {
  const course=activeCourse(run);
  if (!course) return null;
  return {label:`${course.name} · ${course.clean}/3 clean · ${course.clean===course.checked?'+180 possible':'bonus missed'}`,
    value:course.clean,max:course.beats.length};
}
