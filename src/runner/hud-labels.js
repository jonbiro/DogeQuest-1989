import {AREAS,areaAt,areaGameplayAt} from './areas.js';
import {practiceProgress} from './practice.js';
import {scoreChaseLabel} from './score-chase.js';

const COMPACT_MISSION_TITLES = Object.freeze({
  distance: 'Distance',
  bones: 'Bones',
  clears: 'Clears',
  turns: 'Corners',
  fetchUses: 'Fetch',
  ziplines: 'Zipline',
  regionalCourses: 'Course',
  bestCombo: 'Streak',
  rides: 'Rides',
});

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

// The quiet mission chip has very little room on a portrait phone. Keep the
// full sentence in the DOM for assistive technology and desktop, while giving
// the visual phone label a short, scannable progress cue that never collapses
// into an ellipsis in the middle of a run.
export function missionSummaryLabel(mission, progress, position = 1, total = 3) {
  const title = COMPACT_MISSION_TITLES[mission?.metric] || mission?.title || 'Goal';
  const current = Number.isFinite(Number(progress)) ? Math.max(0, Math.floor(Number(progress))) : 0;
  const target = Number.isFinite(Number(mission?.target)) ? Math.max(1, Math.floor(Number(mission.target))) : 1;
  const place = Number.isFinite(Number(position)) ? Math.max(1, Math.floor(Number(position))) : 1;
  const count = Number.isFinite(Number(total)) ? Math.max(place, Math.floor(Number(total))) : 3;
  return `${place}/${count} · ${title} · ${Math.min(current, target)}/${target}`;
}

// Keep the live reward loop compact enough for the portrait HUD. The runner
// already tracks a bone combo in the simulation; this turns that value into a
// small, deterministic display model without coupling the HUD to world state.
export function boneStreakLabel(combo, target = 10) {
  const count = Number.isFinite(Number(combo)) ? Math.max(0, Math.floor(Number(combo))) : 0;
  const goal = Number.isFinite(Number(target)) ? Math.max(2, Math.floor(Number(target))) : 10;
  if (count < 2) {
    return {
      count,
      target: goal,
      progress: 0,
      remaining: goal,
      visible: false,
      label: '',
      detail: '',
    };
  }
  const progress = count % goal || goal;
  const remaining = progress === goal ? 0 : goal - progress;
  return {
    count,
    target: goal,
    progress,
    remaining,
    visible: true,
    label: `BONE STREAK ×${count}`,
    detail: remaining === 0 ? '+100 BONUS EARNED' : `${remaining} to +100`,
  };
}

// Clean movement earns a bonus every five deliberate moves. Keep that reward
// loop visible in the same compact chip as the bone streak so players can
// understand why a turn, jump, or slide was worth extra points without a
// center-screen toast taking over the trail.
export function cleanFlowLabel(streak, target = 5) {
  const count = Number.isFinite(Number(streak)) ? Math.max(0, Math.floor(Number(streak))) : 0;
  const goal = Number.isFinite(Number(target)) ? Math.max(2, Math.floor(Number(target))) : 5;
  if (count < 2) {
    return {
      count,
      target: goal,
      progress: 0,
      remaining: goal,
      nextTarget: goal,
      nextBonus: goal * 10,
      visible: false,
      label: '',
      detail: '',
    };
  }
  const progress = count % goal || goal;
  const nextTarget = Math.ceil(count / goal) * goal;
  const remaining = Math.max(0, nextTarget - count);
  const nextBonus = Math.min(200, nextTarget * 10);
  return {
    count,
    target: goal,
    progress,
    remaining,
    nextTarget,
    nextBonus,
    visible: true,
    label: `CLEAN FLOW ×${count}`,
    detail: remaining === 0 ? `+${nextBonus} BONUS EARNED` : `${remaining} to +${nextBonus}`,
  };
}
