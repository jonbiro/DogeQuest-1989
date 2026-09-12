import {CURRENT_TRAIL_VERSION} from './trail-version.js';
import {trailLink} from './trail-link.js';

// A shared UTC day gives everyone the same starting layout without a server.
// Selection is explicit: crossing midnight never changes an active run/retry.
export function dailyTrail(href, timestamp=Date.now()) {
  if (!Number.isFinite(timestamp) || timestamp<0 || timestamp>8.64e15) return null;
  const day=new Date(timestamp).toISOString().slice(0,10);
  const seed=(Math.floor(timestamp/86400000)^0x0b15c017)>>>0;
  const url=trailLink(href,seed,CURRENT_TRAIL_VERSION);
  return url ? {day,seed,version:CURRENT_TRAIL_VERSION,url} : null;
}
