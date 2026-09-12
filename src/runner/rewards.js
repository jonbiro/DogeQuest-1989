import { claimMission } from './missions.js';
import { awardPrizes } from './collection.js';
import {bankMastery} from './mastery.js';

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
  let missionPoints = 0, missionCount = 0;
  for (const goal of Array.isArray(mission) ? mission.slice(0, 3) : [mission]) {
    const earned = claimMission(profile, run, goal);
    if (!earned) break;
    missionPoints += earned;
    missionCount++;
  }
  const prizes = awardPrizes(profile, run);
  const mastery = bankMastery(profile, run);
  run.receipt = {scorePoints: run.score, missionPoints, missionCount, prizes, personalBest, mastery};
  return run.receipt;
}
