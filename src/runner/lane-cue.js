// One swipe still moves one lane. Tell the player when a second is needed,
// then shorten the cue as soon as the first lane change is accepted.
export function laneCue(current,target,label) {
  if(current===target)return '';
  const left=target<current;
  return `${left?'←':'→'} ${label} ${left?'LEFT':'RIGHT'}${Math.abs(target-current)>1?' ×2':''}`;
}
