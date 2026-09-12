import {createRun, step, LANES} from './world.js';

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
export function stepPractice(run, dt) {
  if (!run.practice || run.ended) return;
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
  const lesson = LESSONS[run.practice.index];
  if (!lesson) return `${run.practice.correct}/3 moves practised · trail complete`;
  const near = lesson.at-run.distance < run.speed*.45;
  return `${run.practice.index+1}/3 · ${near && lesson.type!=='rock' ? lesson.type==='log'?'↑ JUMP NOW':'↓ SLIDE NOW' : lesson.hint}`;
}
