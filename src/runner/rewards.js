import { claimMission } from './missions.js';
import { awardPrizes } from './collection.js';

// One completion transaction owns all record updates and earned currency.
// Returning the original receipt also keeps repeated results renders stable.
export function bankRun(profile, run, mission) {
  if (!run.ended) return null;
  if (run.receipt) return run.receipt;
  const personalBest = run.score > profile.best;
  profile.best = Math.max(profile.best, run.score);
  profile.distance = Math.max(profile.distance, run.distance);
  profile.bones += run.bones;
  profile.bestRunBones = Math.max(profile.bestRunBones || 0, run.bones);
  profile.credits += run.score;
  const missionPoints = claimMission(profile, run, mission);
  const prizes = awardPrizes(profile, run);
  run.receipt = {scorePoints: run.score, missionPoints, prizes, personalBest};
  return run.receipt;
}
