import {AREAS,areaAt,areaGameplayAt} from './areas.js';
import {practiceProgress} from './practice.js';
import {scoreChaseLabel} from './score-chase.js';

// Keep location/difficulty together so route sections never hide a score chase.
export function runHudLabels(run, best) {
  if (run.practice) return {region:'Practice · no penalties',rhythm:'',score:practiceProgress(run)};
  const area=AREAS[areaAt(run.distance)];
  const rhythm=areaGameplayAt(run.distance).label;
  const route=run.route && run.distance<run.route.until ? run.route.kind : null;
  return {
    region: route
      ? `${area.short} · ${route==='challenge'?'Challenge':'Scenic'}`
      : area.name,
    rhythm,
    score:scoreChaseLabel(run.score,best,run.rematchBest,run.challengeTarget),
  };
}
