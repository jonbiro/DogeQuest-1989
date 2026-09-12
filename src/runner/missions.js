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
const ADVENTURE_GOALS = [
  {metric:'turns', target:2, step:1, cap:8, title:'Corner confidence', unit:'clean turns', reward:550},
  {metric:'fetchUses', target:1, step:1, cap:4, title:'Fetch champion', unit:'Fetch bursts', reward:600},
  {metric:'ziplines', target:1, step:0, cap:1, title:'Sky paws', unit:'completed zipline', reward:650},
  {metric:'regionalCourses', target:1, step:1, cap:3, title:'Course conqueror', unit:'clean courses', reward:700},
  {metric:'bestCombo', target:10, step:5, cap:30, title:'Snack streak', unit:'bones in one streak', reward:600},
  {...GOALS[0], target:900, step:150, cap:1800},
  {...GOALS[1], target:50, step:10, cap:100},
  {...GOALS[2], target:10, step:2, cap:20},
];
export function missionFor(completed = 0) {
  const value = Number(completed);
  const index = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  // Keep the first six familiar goals intact for existing and new players.
  const goals = index < 6 ? GOALS : ADVENTURE_GOALS;
  const offset = index < 6 ? index : index - 6;
  const round = Math.floor(offset / goals.length);
  const goal = goals[offset % goals.length];
  return {
    ...goal,
    target: Math.min(goal.cap ?? Infinity, goal.target + round * goal.step),
    reward: goal.reward + Math.min(round, 6) * 100,
    id: index,
  };
}
export function missionProgress(run, mission) {
  const value = mission.metric === 'regionalCourses'
    ? (run.regionalCourses || []).reduce((sum, count) => sum + count, 0)
    : run[mission.metric];
  return Math.min(
    mission.target,
    Math.max(0, Math.floor(value || 0)),
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
