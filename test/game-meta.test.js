import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calculateLevelResult,
  formatTime,
  getLevelMeta,
  rankForTime,
  scoreForEvent,
  TOTAL_LEVELS
} from '../src/GameMeta.js';

test('all ten worlds expose distinct presentation metadata', () => {
  const levels = Array.from({ length: TOTAL_LEVELS }, (_, index) => getLevelMeta(index));
  assert.equal(TOTAL_LEVELS, 10);
  assert.equal(new Set(levels.map((level) => level.name)).size, TOTAL_LEVELS);
  assert.ok(levels.every((level) => level.tagline && level.parTime > 0));
  assert.ok(levels.every((level) => level.palette.primary && level.palette.secondary));
});

test('event scoring rewards combos but caps the multiplier', () => {
  assert.equal(scoreForEvent('bone', 1), 100);
  assert.equal(scoreForEvent('bone', 4), 400);
  assert.equal(scoreForEvent('bone', 99), 500);
  assert.equal(scoreForEvent('goldenBone', 2), 1000);
  assert.equal(scoreForEvent('unknown', 3), 0);
});

test('time ranks use stable speedrun thresholds', () => {
  assert.equal(rankForTime(30, 60), 'S');
  assert.equal(rankForTime(45, 60), 'S');
  assert.equal(rankForTime(60, 60), 'A');
  assert.equal(rankForTime(78, 60), 'B');
  assert.equal(rankForTime(79, 60), 'C');
});

test('level results combine score, time, and combo bonuses', () => {
  assert.deepEqual(calculateLevelResult({ time: 50.2, parTime: 60, score: 1200, bestCombo: 5 }), {
    rank: 'A',
    timeBonus: 250,
    comboBonus: 200,
    totalScore: 1650
  });
});

test('time formatting supports HUD and result precision', () => {
  assert.equal(formatTime(65.91), '1:05');
  assert.equal(formatTime(65.91, true), '1:05.9');
});
