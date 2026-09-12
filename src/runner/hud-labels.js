import {REGIONS,regionAt} from './regions.js';
import {practiceProgress} from './practice.js';
import {scoreChaseLabel} from './score-chase.js';

// Keep location/difficulty together so route sections never hide a score chase.
export function runHudLabels(run, best) {
  if (run.practice) return {region:'Practice · no penalties',score:practiceProgress(run)};
  const index=regionAt(run.distance);
  const route=run.route && run.distance<run.route.until ? run.route.kind : null;
  return {
    region: route
      ? `${['Jungle','Canyon','Glade'][index]} · ${route==='challenge'?'Challenge':'Scenic'}`
      : REGIONS[index].name,
    score:scoreChaseLabel(run.score,best,run.rematchBest,run.challengeTarget),
  };
}
