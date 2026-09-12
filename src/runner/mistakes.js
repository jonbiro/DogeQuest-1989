// Capture collision evidence before the next simulation step changes the pose.
export function mistakeDetail(run, mistake) {
  let reason = 'missed';
  const overhead = ['arch', 'branch', 'gate'].includes(mistake.type);
  if(mistake.type==='rock'&&mistake.courseWeave) {
    if([0,1,2].includes(mistake.safeLane)&&run.lane===mistake.safeLane)reason='late-weave';
  } else if (mistake.type === 'corner') {
    if (run.turnAttempt && !run.turnAttempt.correct) reason = 'wrong-turn';
  } else if (overhead) {
    if (run.y >= .2) reason = run.diving ? 'late-dive' : 'jumped';
    else if (Number.isFinite(run.slideExpiredAt) && run.time - run.slideExpiredAt < .4) reason = 'early-slide';
  } else if (run.diving) reason = 'cancelled-jump';
  else if (run.slide > 0) reason = 'slid';
  else if (run.y > 0) reason = run.vy > 0 ? 'late-jump' : 'early-jump';
  else if (run.landing && run.time - run.landing.time < .25) reason = 'early-jump';
  return {reason, distance: Math.floor(run.distance)};
}

export function timingLesson(detail) {
  const lessons = {
    'late-jump': 'Your jump started too late to clear this obstacle. Jump a little earlier, as it approaches your puppy.',
    'early-jump': 'Your jump came down before the obstacle cleared. Wait a little longer before jumping on the retry.',
    'cancelled-jump': 'Sliding brought your jump down into the obstacle. Stay airborne until you have passed it.',
    slid: 'This obstacle needs a jump, not a slide. Swipe up, or steer into an open lane.',
    jumped: 'You jumped into an overhead obstacle. Stay low: swipe down instead of up.',
    'late-dive': 'You were still landing when the overhead obstacle arrived. Slide earlier, or approach it on the ground.',
    'early-slide': 'Your slide ended before the overhead obstacle passed. Swipe down a little later on the retry.',
    'wrong-turn': 'The turn was locked in the wrong direction. Match the arrow with one left or right swipe.',
  };
  return detail && lessons[detail.reason] || '';
}
