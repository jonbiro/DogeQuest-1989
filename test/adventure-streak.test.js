import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADVENTURE_STREAK_MILESTONES,
  adventureStreakFrom,
  adventureStreakSummary,
  bankAdventureStreak,
} from '../src/runner/adventure-streak.js';
import {bankRun} from '../src/runner/rewards.js';
import {collectionFrom} from '../src/runner/collection.js';

const day = (offset = 0) => Date.UTC(2026, 0, 5 + offset, 12);
const profile = (state = null) => ({
  credits: 12_345,
  adventureStreak: state ?? adventureStreakFrom(null),
});
const run = () => ({ended: true, practice: false});

test('malformed streak data is repaired into a bounded local state', () => {
  const state = adventureStreakFrom({
    count: 50_000,
    best: 2,
    lastDay: 'not-a-day',
    claimed: [7, 7, '14', 3, 999],
  });
  assert.equal(state.count, 9_999);
  assert.equal(state.best, 9_999);
  assert.equal(state.lastDay, null);
  assert.deepEqual(state.claimed, [3, 7]);
});

test('consecutive completed adventures advance once per UTC day and pay milestones', () => {
  const p = profile();
  const first = run();
  const opening = p.credits;
  const one = bankAdventureStreak(p, first, day());
  assert.equal(one.count, 1);
  assert.equal(one.continued, false);
  assert.equal(one.reward, 0);
  assert.equal(p.credits, opening);

  const repeat = bankAdventureStreak(p, first, day());
  assert.equal(repeat, one);
  assert.equal(p.credits, opening);

  const second = run();
  assert.equal(bankAdventureStreak(p, second, day(1)).count, 2);
  const third = run();
  const receipt = bankAdventureStreak(p, third, day(2));
  assert.equal(receipt.count, 3);
  assert.equal(receipt.continued, true);
  assert.equal(receipt.reward, ADVENTURE_STREAK_MILESTONES[0].reward);
  assert.equal(p.credits, opening + ADVENTURE_STREAK_MILESTONES[0].reward);
  assert.equal(p.adventureStreak.best, 3);
  assert.match(adventureStreakSummary(p.adventureStreak), /3-day adventure streak/);
});

test('a missed UTC day starts a fresh streak without erasing the best', () => {
  const p = profile({version: 1, count: 6, best: 6, lastDay: '2026-01-06', claimed: [3]});
  const receipt = bankAdventureStreak(p, run(), day(4));
  assert.equal(receipt.count, 1);
  assert.equal(receipt.continued, false);
  assert.equal(p.adventureStreak.best, 6);
  assert.deepEqual(p.adventureStreak.claimed, [3]);
  assert.equal(receipt.reward, 0);
});

test('unfinished and practice runs never touch the local streak', () => {
  const p = profile();
  const before = globalThis.structuredClone(p);
  assert.equal(bankAdventureStreak(p, {...run(), ended: false}, day()), null);
  assert.deepEqual(p, before);
  assert.equal(bankAdventureStreak(p, {...run(), practice: true}, day()), null);
  assert.deepEqual(p, before);
});

test('the normal reward transaction includes a streak milestone exactly once', () => {
  const p = {
    best: 0,
    distance: 0,
    bones: 0,
    bestRunBones: 0,
    credits: 0,
    challenges: 0,
    collection: collectionFrom(),
    adventureStreak: {version: 1, count: 2, best: 2, lastDay: '2026-01-06', claimed: []},
  };
  const completed = {
    ended: true,
    score: 100,
    distance: 100,
    bones: 1,
    gifts: 0,
    clears: 0,
    turns: 0,
    weaves: 0,
    regionalCourses: [],
  };
  const receipt = bankRun(p, completed, [], day(2));
  assert.equal(receipt.adventureStreak.count, 3);
  assert.equal(receipt.adventureStreak.reward, 250);
  assert.equal(receipt.totalPoints, 350);
  assert.equal(p.credits, 350);
  assert.equal(bankRun(p, completed, [], day(2)), receipt);
  assert.equal(p.credits, 350);
});
