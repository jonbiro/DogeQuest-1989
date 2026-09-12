// Reuse the existing score line: no new HUD panel, timer or reward currency.
export function scoreChaseLabel(score, best) {
  const points = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));
  const record = Math.max(0, Math.floor(Number.isFinite(best) ? best : 0));
  if (record > 0 && points > record) return `${points.toLocaleString()} pts · BEST`;
  const remaining = record - points + 1;
  const approach = Math.min(500, Math.max(150, record * .1));
  if (record > 0 && remaining <= approach) return `${remaining.toLocaleString()} ${remaining === 1 ? 'pt' : 'pts'} to best`;
  return `${points.toLocaleString()} pts`;
}
