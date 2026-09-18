// Capture collision evidence before the next simulation step changes the pose.
import {OVERHEAD_HAZARDS} from './hazard-cast.js';

export function mistakeDetail(run, mistake) {
  let reason = 'missed';
  const overhead = OVERHEAD_HAZARDS.includes(mistake.type);
  if(mistake.minecartHazard){
    reason=run.lane===mistake.safeLane?'late-minecart-steer':'minecart-lane';
  } else if(mistake.raftHazard){
    reason=run.lane===mistake.safeLane?'late-raft-steer':'raft-lane';
  } else if(mistake.type==='rock'&&mistake.courseWeave) {
    if([0,1,2].includes(mistake.safeLane)&&run.lane===mistake.safeLane)reason='late-weave';
  } else if (mistake.type === 'corner') {
    if (run.turnAttempt && !run.turnAttempt.correct) reason = 'wrong-turn';
  } else if (mistake.type === 'pound-worker') {
    reason = run.lane === mistake.safeLane ? 'late-shelter-steer' : 'shelter-lane';
  } else if (overhead) {
    if (run.y >= .2) reason = run.diving ? 'late-dive' : 'jumped';
    else if (Number.isFinite(run.slideExpiredAt) && run.time - run.slideExpiredAt < .4) reason = 'early-slide';
  } else if (run.diving) reason = 'cancelled-jump';
  else if (run.slide > 0) reason = 'slid';
  else if (run.y > 0) reason = run.vy > 0 ? 'late-jump' : 'early-jump';
  else if (run.landing && run.time - run.landing.time < .25) reason = 'early-jump';
  return {reason, distance: Math.floor(run.distance)};
}

export function timingLesson(detail, obstacleType) {
  if(obstacleType==='gap'){
    const gapLessons={
      slid:'The broken trail spans every lane. Swipe up at the striped edge; sliding or changing lanes will not cross it.',
      'cancelled-jump':'Swiping down ended your jump over the gap. Stay airborne until you reach the far side.',
      'early-jump':'You landed before reaching the far side of the gap. Jump later, close to the striped edge.',
      'late-jump':'You reached the gap before your jump was high enough. Swipe up just before the striped edge reaches your puppy.',
    };
    if(gapLessons[detail?.reason])return gapLessons[detail.reason];
  }
  const lessons = {
    'late-jump': 'Your jump started too late to clear this obstacle. Jump a little earlier, as it approaches your puppy.',
    'early-jump': 'Your jump came down before the obstacle cleared. Wait a little longer before jumping on the retry.',
    'cancelled-jump': 'Sliding brought your jump down into the obstacle. Stay airborne until you have passed it.',
    slid: 'This obstacle needs a jump, not a slide. Swipe up, or steer into an open lane.',
    jumped: 'You jumped into an overhead obstacle. Stay low: swipe down instead of up.',
    'late-dive': 'You were still landing when the overhead obstacle arrived. Slide earlier, or approach it on the ground.',
    'early-slide': 'Your slide ended before the overhead obstacle passed. Swipe down a little later on the retry.',
    'moving-gate': 'The moving gate swept into your lane. Follow the opening to a clear lane, or slide under it when the bar arrives.',
    'wrong-turn': 'The turn was locked in the wrong direction. Match the arrow with one left or right swipe.',
    'late-minecart-steer': 'The cart was still drifting toward the open lane. Start steering earlier; one swipe moves one lane.',
    'minecart-lane': 'The mine-cart rocks leave one open lane. Steer toward the glowing lane cue; jump and slide are unavailable until the exit.',
    'late-shelter-steer': 'The shelter worker stepped into your lane before your steer settled. Change lanes earlier; one tap moves one lane.',
    'shelter-lane': 'The shelter worker blocks this lane. Tap left or right toward the open lane, or jump over the worker.',
  };
  return detail && lessons[detail.reason] || '';
}
