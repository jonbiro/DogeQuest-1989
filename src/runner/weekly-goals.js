// Small, local-only weekly goals. A goal is selected from the UTC week so
// every player gets a fresh reason to return without an account or a server.
// Progress is deliberately cumulative across completed adventures, while
// practice runs never advance it.

export const WEEKLY_GOAL_VERSION = 1;

const DAY_MS = 86_400_000;
const GOALS = Object.freeze([
  {
    id: 'bone-bloom',
    metric: 'bones',
    mode: 'sum',
    target: 120,
    unit: 'bones',
    title: 'Bone bloom',
    icon: '🦴',
    reward: 800,
    description: 'Collect 120 bones across completed runs.',
  },
  {
    id: 'clean-paws',
    metric: 'clears',
    mode: 'sum',
    target: 24,
    unit: 'clean clears',
    title: 'Clean paws',
    icon: '✦',
    reward: 900,
    description: 'Clear 24 obstacles with good timing this week.',
  },
  {
    id: 'long-sniff',
    metric: 'distance',
    mode: 'sum',
    target: 2_500,
    unit: 'meters',
    title: 'Long sniff',
    icon: '➜',
    reward: 700,
    description: 'Run 2,500 meters across completed adventures.',
  },
  {
    id: 'ride-rover',
    metric: 'rides',
    mode: 'sum',
    target: 3,
    unit: 'completed rides',
    title: 'Ride rover',
    icon: '⚑',
    reward: 1_000,
    description: 'Finish three river, zipline or mine-cart rides.',
  },
  {
    id: 'pup-pursuit',
    metric: 'dogChases',
    mode: 'sum',
    target: 3,
    unit: 'puppy chases',
    title: 'Pup pursuit',
    icon: '🐾',
    reward: 950,
    description: 'Complete three friendly puppy chases this week.',
  },
  {
    id: 'streak-star',
    metric: 'bestCombo',
    mode: 'max',
    target: 20,
    unit: 'bones in one streak',
    title: 'Streak star',
    icon: '★',
    reward: 850,
    description: 'Build one 20-bone streak in a completed run.',
  },
  {
    id: 'corner-pro',
    metric: 'turns',
    mode: 'sum',
    target: 6,
    unit: 'clean turns',
    title: 'Corner pro',
    icon: '↪',
    reward: 800,
    description: 'Nail six marked turns across completed runs.',
  },
]);

function validTimestamp(value) {
  return Number.isFinite(value) && value >= 0 && value <= 8.64e15;
}

function dayIndex(timestamp) {
  return Math.floor(timestamp / DAY_MS);
}

function weekIndex(timestamp) {
  // 1970-01-01 was a Thursday. Adding three days makes Monday the stable
  // boundary while keeping this calculation independent of local time zones.
  return Math.floor((dayIndex(timestamp) + 3) / 7);
}

function weekStart(timestamp) {
  const date = new Date(timestamp);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return date.toISOString().slice(0, 10);
}

function goalForIndex(index) {
  const safe = ((index % GOALS.length) + GOALS.length) % GOALS.length;
  return GOALS[safe];
}

export function weeklyGoalFor(timestamp = Date.now()) {
  if (!validTimestamp(timestamp)) return null;
  const index = weekIndex(timestamp);
  const goal = goalForIndex(index);
  return {...goal, key: weekStart(timestamp), weekIndex: index};
}

function validProgress(value) {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function weeklyStateFrom(value, timestamp = Date.now()) {
  const goal = weeklyGoalFor(timestamp);
  if (!goal) return {version: WEEKLY_GOAL_VERSION, key: null, goalId: null, progress: 0, claimed: false};
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      value.key !== goal.key || value.goalId !== goal.id) {
    return {version: WEEKLY_GOAL_VERSION, key: goal.key, goalId: goal.id, progress: 0, claimed: false};
  }
  return {
    version: WEEKLY_GOAL_VERSION,
    key: goal.key,
    goalId: goal.id,
    progress: Math.min(goal.target, Math.floor(validProgress(value.progress))),
    claimed: value.claimed === true,
  };
}

export function weeklyValueFor(run, goal) {
  if (!run || !goal) return 0;
  if (goal.metric === 'rides')
    return Math.max(0, Math.floor((run.rafts || 0) + (run.ziplines || 0) + (run.minecarts || 0)));
  if (goal.metric === 'distance') return Math.max(0, Math.floor(validProgress(run.distance)));
  return Math.max(0, Math.floor(validProgress(run[goal.metric])));
}

// Bank one completed run into the current weekly goal. Profiles without the
// optional `weekly` field are intentionally ignored so older direct callers
// and imported legacy saves retain their exact reward totals until the app
// initializes the feature in its normal load path.
export function bankWeeklyGoal(profile, run, timestamp = Date.now()) {
  if (!profile || !Object.hasOwn(profile, 'weekly') || !run?.ended || run.practice) return null;
  if (run.weeklyReceipt) return run.weeklyReceipt;
  const goal = weeklyGoalFor(timestamp);
  if (!goal) return null;
  const before = weeklyStateFrom(profile.weekly, timestamp);
  const contribution = weeklyValueFor(run, goal);
  const progress = Math.min(goal.target, goal.mode === 'max'
    ? Math.max(before.progress, contribution)
    : before.progress + contribution);
  const reward = progress >= goal.target && !before.claimed ? goal.reward : 0;
  const next = {
    version: WEEKLY_GOAL_VERSION,
    key: goal.key,
    goalId: goal.id,
    progress,
    claimed: before.claimed || progress >= goal.target,
  };
  profile.weekly = next;
  if (reward) profile.credits = Math.max(0, validProgress(profile.credits)) + reward;
  run.weeklyReceipt = {
    goal: {...goal},
    previous: before.progress,
    progress,
    target: goal.target,
    reward,
    completed: progress >= goal.target,
  };
  return run.weeklyReceipt;
}

export function weeklySummary(state, timestamp = Date.now()) {
  const goal = weeklyGoalFor(timestamp);
  if (!goal) return '';
  const current = weeklyStateFrom(state, timestamp);
  return current.claimed
    ? `${goal.icon} ${goal.title} · COMPLETE · +${goal.reward} pts`
    : `${goal.icon} ${goal.title} · ${current.progress}/${goal.target} ${goal.unit} · +${goal.reward} pts`;
}

export function weeklyGoals() {
  return GOALS.map(goal => ({...goal}));
}
