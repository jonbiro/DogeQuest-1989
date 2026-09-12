// Score components are explanations of the existing total, never extra awards.
export function scoreBreakdown(run) {
  const format=value=>Math.floor(value||0).toLocaleString();
  const included=[];
  if(run.streakPoints>0)included.push(`${format(run.streakPoints)} from bone streaks`);
  if(run.flowPoints>0)included.push(`${format(run.flowPoints)} from clean-move streaks`);
  return `Score sources: ${format(run.distance)} distance + ${format(run.bonePoints)} bones + ${format(run.bonusPoints)} trail bonuses = ${format(run.score)} points.`
    +(included.length?` Trail bonuses include ${included.join(' and ')}; these are already in your score.`:'');
}
