// Reward deliberate clean movement independently of the bone-collection streak.
export function cleanMove(run) {
  run.cleanStreak++;
  run.bestCleanStreak = Math.max(run.bestCleanStreak, run.cleanStreak);
  if (run.cleanStreak % 5 !== 0) return;
  const bonus = Math.min(200, run.cleanStreak * 10);
  run.lastFlowBonus = bonus;
  run.flowPoints += bonus;
  run.bonusPoints += bonus;
  run.events.push('flow');
}
