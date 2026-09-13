import {CURRENT_TRAIL_VERSION} from './trail-version.js';
import {trailLink,validTrailTarget} from './trail-link.js';
import {trailBest} from './trail-records.js';
import {dailySeed} from './daily-seed.js';

// A shared UTC day gives everyone the same starting layout without a server.
// Selection is explicit: crossing midnight never changes an active run/retry.
export function dailyTrail(href, timestamp=Date.now()) {
  if (!Number.isFinite(timestamp) || timestamp<0 || timestamp>8.64e15) return null;
  const day=new Date(timestamp).toISOString().slice(0,10);
  const seed=dailySeed(timestamp);
  const url=trailLink(href,seed,CURRENT_TRAIL_VERSION);
  return url ? {day,seed,version:CURRENT_TRAIL_VERSION,url} : null;
}

export function selectedTrailDescription(seed,version,target,daily){
  if(validTrailTarget(target))return `Beat ${target.toLocaleString()} pts · friendly, unverified target. Your upgrades apply.`;
  return daily && seed===daily.seed && version===daily.version
    ? `Daily trail · ${daily.day} UTC · your upgrades apply.`
    : 'Shared trail · your upgrades apply.';
}

export function restoredTrailSelection(seed,version,target,daily,records){
  // An explicit friend's target always takes precedence over a local record.
  const localDaily=Boolean(!validTrailTarget(target)&&daily&&seed===daily.seed&&version===daily.version);
  const best=localDaily?trailBest(records,seed,version):0;
  if(validTrailTarget(best))return {target:best,localDaily,
    description:`Daily trail · ${daily.day} UTC · Your best: ${best.toLocaleString()} pts · your upgrades apply.`};
  return {target:validTrailTarget(target)?target:0,localDaily,
    description:selectedTrailDescription(seed,version,target,daily)};
}
