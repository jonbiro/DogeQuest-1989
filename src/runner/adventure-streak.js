// A small local return loop for players who like a reason to come back.
// Adventure streaks count completed, scored runs on consecutive UTC days.
// They never require an account, never punish a missed day, and are kept
// separate from the in-run bone/clean-move streaks.

export const ADVENTURE_STREAK_VERSION = 1;

const DAY_MS = 86_400_000;
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 9_999;

export const ADVENTURE_STREAK_MILESTONES = Object.freeze([
  Object.freeze({target: 3, reward: 250, title: 'Three-day tail wag'}),
  Object.freeze({target: 7, reward: 600, title: 'One-week good dog'}),
  Object.freeze({target: 14, reward: 1_000, title: 'Fortnight fetch'}),
  Object.freeze({target: 30, reward: 2_000, title: 'Month of zoomies'}),
]);

function validTimestamp(value) {
  return Number.isFinite(value) && value >= 0 && value <= 8.64e15;
}

function dayIndex(timestamp) {
  return Math.floor(timestamp / DAY_MS);
}

function dayKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function validDayKey(value) {
  if (typeof value !== 'string' || !DAY_KEY.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return validTimestamp(timestamp) && dayKey(timestamp) === value;
}

function safeCount(value) {
  return Number.isFinite(value) && value >= 0
    ? Math.min(MAX_DAYS, Math.floor(value))
    : 0;
}

function safeCredits(value) {
  return Number.isFinite(value) && value >= 0
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value))
    : 0;
}

function emptyState() {
  return {
    version: ADVENTURE_STREAK_VERSION,
    count: 0,
    best: 0,
    lastDay: null,
    claimed: [],
  };
}

export function adventureStreakFrom(value) {
  const empty = emptyState();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty;
  const count = safeCount(value.count);
  const best = Math.max(count, safeCount(value.best));
  const claimed = Array.isArray(value.claimed)
    ? [...new Set(value.claimed
      .filter(target => ADVENTURE_STREAK_MILESTONES.some(milestone => milestone.target === target))
      .map(target => Math.floor(target)))]
      .sort((a, b) => a - b)
    : [];
  return {
    version: ADVENTURE_STREAK_VERSION,
    count,
    best,
    lastDay: validDayKey(value.lastDay) ? value.lastDay : null,
    claimed,
  };
}

function nextMilestone(state) {
  return ADVENTURE_STREAK_MILESTONES.find(milestone => !state.claimed.includes(milestone.target));
}

// Bank exactly one completed adventure. The receipt is attached to the run
// so a repeated results render cannot pay a milestone twice.
export function bankAdventureStreak(profile, run, timestamp = Date.now()) {
  if (!profile || !Object.hasOwn(profile, 'adventureStreak') ||
      !run?.ended || run.practice || !validTimestamp(timestamp)) return null;
  if (run.adventureStreakReceipt) return run.adventureStreakReceipt;

  const before = adventureStreakFrom(profile.adventureStreak);
  const today = dayKey(timestamp);
  const yesterday = dayIndex(timestamp) - 1;
  const alreadyCounted = before.lastDay === today;
  const continued = !alreadyCounted && before.lastDay !== null &&
    validDayKey(before.lastDay) && dayIndex(Date.parse(`${before.lastDay}T00:00:00.000Z`)) === yesterday;
  const count = alreadyCounted
    ? before.count
    : Math.min(MAX_DAYS, continued ? before.count + 1 : 1);
  const earned = alreadyCounted
    ? []
    : ADVENTURE_STREAK_MILESTONES.filter(milestone => milestone.target <= count && !before.claimed.includes(milestone.target));
  const reward = earned.reduce((sum, milestone) => sum + milestone.reward, 0);
  const claimed = [...new Set([...before.claimed, ...earned.map(milestone => milestone.target)])].sort((a, b) => a - b);
  const next = {
    version: ADVENTURE_STREAK_VERSION,
    count,
    best: Math.max(before.best, count),
    lastDay: alreadyCounted ? before.lastDay : today,
    claimed,
  };
  profile.adventureStreak = next;
  if (reward) profile.credits = Math.min(Number.MAX_SAFE_INTEGER, safeCredits(profile.credits) + reward);
  run.adventureStreakReceipt = {
    previous: before.count,
    count,
    best: next.best,
    day: today,
    continued,
    reward,
    earned: earned.map(milestone => ({...milestone})),
    next: nextMilestone(next)?.target || null,
  };
  return run.adventureStreakReceipt;
}

export function adventureStreakSummary(value) {
  const state = adventureStreakFrom(value);
  if (!state.count) return '★ Adventure streak · finish a run today';
  const next = nextMilestone(state);
  if (!next) return `★ ${state.count}-day adventure streak · best ${state.best} · all rewards earned`;
  return `★ ${state.count}-day adventure streak · ${next.target - state.count} to ${next.reward.toLocaleString()} pts`;
}
