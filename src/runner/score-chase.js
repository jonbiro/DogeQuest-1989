// Reuse the existing score line: no new HUD panel, timer or reward currency.
import {validTrailTarget} from './trail-link.js';
export function scoreChaseLabel(score, best, rematchBest = 0, target = 0) {
  const points = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
  // An explicitly opened challenge owns this existing line, not another panel.
  if (validTrailTarget(target)) {
    if (points > target) return `${points.toLocaleString()} pts · TARGET BEAT`;
    const needed = target - points + 1;
    if (needed <= Math.min(500, Math.max(150,target*.1)))
      return `${needed.toLocaleString()} ${needed===1?'pt':'pts'} to target`;
    return `${points.toLocaleString()} / ${target.toLocaleString()} pts`;
  }
  const record = Math.max(0, Math.floor(Number.isFinite(best) ? best : 0));
  if (record > 0 && points > record) return `${points.toLocaleString()} pts · BEST`;
  const remaining = record - points + 1;
  const approach = Math.min(500, Math.max(150, record * .1));
  if (record > 0 && remaining <= approach) return `${remaining.toLocaleString()} ${remaining === 1 ? 'pt' : 'pts'} to best`;
  const rematch=Math.max(0,Math.floor(Number.isFinite(rematchBest)?rematchBest:0));
  if (rematch>0) {
    if (points>rematch) return `${points.toLocaleString()} pts · REMATCH BEST`;
    const needed=rematch-points+1;
    if (needed<=Math.min(500,Math.max(150,rematch*.1)))
      return `${needed.toLocaleString()} ${needed===1?'pt':'pts'} to rematch best`;
  }
  return `${points.toLocaleString()} pts`;
}
