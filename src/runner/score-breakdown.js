// Score components are explanations of the existing total, never extra awards.
import {DOG_CHASE_REWARD} from './dog-chase.js';

const PICKUP_RECEIPTS = Object.freeze([
  ['magnet', 'magnets', 'pull nearby bones'],
  ['shield', 'shields', 'block one hit'],
  ['gem', 'gems', '+250 points each'],
  ['double', 'bone doublers', 'double bone points for 10s'],
  ['heart', 'hearts', 'heal 1 heart or +100 at full health'],
  ['gift', 'gift boxes', '+100 points each'],
  ['zoomies', 'Zoomies balls', 'speed + smash for 6s'],
  ['relic', 'area relics', '+160 points each'],
]);

// Keep the results view and the compact text receipt driven by the same
// vocabulary.  Returning structured rows lets the app show a quick visual
// haul without scraping a sentence (and keeps the helper safe for older runs
// that did not record pickup counts).
export function pickupReceiptItems(run) {
  const counts = run?.pickupCounts;
  if (!counts || typeof counts !== 'object') return [];
  return PICKUP_RECEIPTS
    .map(([key, label, effect]) => {
      const count = Number.isFinite(counts[key]) ? Math.max(0, Math.floor(counts[key])) : 0;
      return count ? {key, count, label, effect} : null;
    })
    .filter(Boolean);
}

function pickupReceipt(run) {
  const collected = pickupReceiptItems(run);
  if (!collected.length) return '';
  const text = collected.map(({count, label, effect}) => `${count} ${label} (${effect})`);
  return ` Pickup haul: ${text.join('; ')}.`;
}

export function scoreBreakdown(run) {
  const format=value=>Math.floor(value||0).toLocaleString();
  const included=[];
  const modifier = run?.modifier?.name
    ? ' Trail perk: ' + run.modifier.name + ' · ' + (run.modifier.effect || 'opening boost') + '.'
    : '';
  if(run.rafts>0)included.push(`${format(run.rafts*250)} from river crossings`);
  if(run.ziplines>0)included.push(`${format(run.ziplines*250)} from zipline rides`);
  if(run.minecarts>0)included.push(`${format(run.minecarts*250)} from mine-cart rides`);
  if(run.minecartGemChoices>0)included.push(`${format(run.minecartGemChoices*250)} from mine-cart gem choices`);
  if(run.streakPoints>0)included.push(`${format(run.streakPoints)} from bone streaks`);
  if(run.nearMissPoints>0)included.push(`${format(run.nearMissPoints)} from near misses`);
  if(run.flowPoints>0)included.push(`${format(run.flowPoints)} from clean-move streaks`);
  if(run.relicPoints>0)included.push(`${format(run.relicPoints)} from area relics`);
  if(run.dogChases>0)included.push(`${format(run.dogChases*DOG_CHASE_REWARD)} from puppy chases`);
  if(run.routeTrailBones>0) {
    const branchPoints = Number.isFinite(run.routeTrailPoints) ? ` · ${format(run.routeTrailPoints)} points` : '';
    included.push(`${format(run.routeTrailBones)} optional branch bones${branchPoints}`);
  }
  if(run.pickupBonusPoints>0)included.push(`${format(run.pickupBonusPoints)} from gems, gifts and spare pickups`);
  return `Score sources: ${format(run.distance)} distance + ${format(run.bonePoints)} bones + ${format(run.bonusPoints)} trail bonuses = ${format(run.score)} points.`
   +(included.length?` Trail bonuses include ${included.join(' and ')}; these are already in your score.`:'')
    +modifier
   +pickupReceipt(run);
}
