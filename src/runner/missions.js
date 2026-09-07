const GOALS = [
  {
    metric: "distance",
    target: 300,
    step: 150,
    title: "Trailblazer",
    unit: "meters",
    reward: 250,
  },
  {
    metric: "bones",
    target: 30,
    step: 10,
    title: "Snack collector",
    unit: "bones",
    reward: 350,
  },
  {
    metric: "clears",
    target: 6,
    step: 2,
    title: "Fancy footwork",
    unit: "jump / slide clears",
    reward: 500,
  },
];
export function missionFor(completed = 0) {
  const index = Math.max(0, Math.floor(Number(completed) || 0));
  const round = Math.floor(index / GOALS.length);
  const goal = GOALS[index % GOALS.length];
  return {
    ...goal,
    target: goal.target + round * goal.step,
    reward: goal.reward + round * 100,
    id: index,
  };
}
export function missionProgress(run, mission) {
  return Math.min(
    mission.target,
    Math.max(0, Math.floor(run[mission.metric] || 0)),
  );
}
export function claimMission(profile, run, mission) {
  if (!run.ended) return 0;
  if (
    profile.challenges !== mission.id ||
    missionProgress(run, mission) < mission.target
  )
    return 0;
  profile.challenges++;
  profile.credits += mission.reward;
  return mission.reward;
}
