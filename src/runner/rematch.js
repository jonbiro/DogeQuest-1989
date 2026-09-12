// A rehearsal may interrupt a rematch, but must not replace its challenge.
export function rematchFor(run,ended){
  if(!ended)return null;
  if(run.practice)return run.practice.returnTrail||null;
  return {seed:run.seed,generatorVersion:run.generatorVersion,
    rematchBest:Math.max(run.rematchBest||0,run.score||0),
    challengeTarget:run.challengeTarget||0};
}
