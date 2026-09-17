import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {
  weeklyGoalFor,
  weeklyGoals,
  weeklyStateFrom,
  weeklyValueFor,
  bankWeeklyGoal,
  weeklySummary,
} from '../src/runner/weekly-goals.js';

const monday = Date.parse('2026-09-14T12:00:00Z');
const sunday = Date.parse('2026-09-20T23:59:59Z');
const nextMonday = Date.parse('2026-09-21T00:00:00Z');

test('weekly goals stay stable inside a UTC week and rotate at Monday', () => {
  const first = weeklyGoalFor(monday);
  assert.deepEqual(weeklyGoalFor(sunday), first);
  assert.notEqual(weeklyGoalFor(nextMonday).key, first.key);
  assert.notEqual(weeklyGoalFor(nextMonday).id, first.id);
  assert.equal(new Set(weeklyGoals().map(goal => goal.id)).size, weeklyGoals().length);
  assert.ok(weeklyGoals().every(goal => goal.target > 0 && goal.reward > 0));
});

test('weekly state resets stale or malformed data without trusting progress', () => {
  const goal = weeklyGoalFor(monday);
  const fresh = weeklyStateFrom(null, monday);
  assert.deepEqual(fresh, {version: 1, key: goal.key, goalId: goal.id, progress: 0, claimed: false});
  assert.equal(weeklyStateFrom({...fresh, progress: 9999}, monday).progress, goal.target);
  assert.equal(weeklyStateFrom({...fresh, key: 'old-week', progress: 40}, monday).progress, 0);
  assert.equal(weeklyStateFrom({...fresh, claimed: 'yes'}, monday).claimed, false);
  assert.equal(weeklyStateFrom(null, NaN).key, null);
});

test('weekly values use completed-run metrics and never practice data', () => {
  const goals = weeklyGoals();
  const ride = goals.find(goal => goal.metric === 'rides');
  const combo = goals.find(goal => goal.metric === 'bestCombo');
  assert.equal(weeklyValueFor({rafts: 1, ziplines: 2, minecarts: 1}, ride), 4);
  assert.equal(weeklyValueFor({bestCombo: 25}, combo), 25);
  assert.equal(weeklyValueFor({bestCombo: -4}, combo), 0);
});

test('banking a weekly goal is cumulative, rewarding once and idempotent', () => {
  const goal = weeklyGoalFor(monday);
  const profile = {
    credits: 10,
    weekly: {version: 1, key: goal.key, goalId: goal.id, progress: goal.target - 1, claimed: false},
  };
  const run = {ended: true, bones: goal.metric === 'bones' ? 1 : 0, distance: goal.metric === 'distance' ? goal.target : 0,
    clears: goal.metric === 'clears' ? 1 : 0, turns: goal.metric === 'turns' ? 1 : 0,
    bestCombo: goal.metric === 'bestCombo' ? goal.target : 0,
    rafts: goal.metric === 'rides' ? 1 : 0, ziplines: 0, minecarts: 0};
  const receipt = bankWeeklyGoal(profile, run, monday);
  assert.equal(receipt.completed, true);
  assert.equal(receipt.reward, goal.reward);
  assert.equal(profile.credits, 10 + goal.reward);
  assert.equal(bankWeeklyGoal(profile, run, monday), receipt);
  assert.equal(profile.credits, 10 + goal.reward);
  const before = JSON.parse(JSON.stringify(profile));
  bankWeeklyGoal(profile, {ended: true, practice: {kind: 'jump'}, bones: 999}, monday);
  assert.deepEqual(profile, before);
});

test('weekly summary explains local progress and completion', () => {
  const goal = weeklyGoalFor(monday);
  const state = weeklyStateFrom({version: 1, key: goal.key, goalId: goal.id, progress: 7, claimed: false}, monday);
  assert.match(weeklySummary(state, monday), new RegExp(goal.title));
  assert.match(weeklySummary(state, monday), /7\//);
  const complete = weeklyStateFrom({...state, progress: goal.target, claimed: true}, monday);
  assert.match(weeklySummary(complete, monday), /COMPLETE/);
});

test('the menu and help surfaces explain the local weekly loop', () => {
  const shell = readFileSync(new URL('../runner/index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
  assert.match(shell, /id="weekly-preview"/);
  assert.match(shell, /id="weekly-help"/);
  assert.match(shell, /rotates every Monday at midnight UTC/);
  assert.match(app, /saved\.weekly = weeklyStateFrom/);
  assert.match(app, /weeklySummary\(state\)/);
  assert.match(app, /Weekly fetch complete/);
});
