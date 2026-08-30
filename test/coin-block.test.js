import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeLevel } from '../scripts/level-fixtures.js';

test('triggering the final active coin block completes the level exactly once', () => {
  const { gameInfo, level } = makeLevel(['@?', 'xx'], {
    audio: null,
    particleSystem: null,
    display: null
  });
  const block = level.actors.find((actor) => actor.type === 'coinblock');

  assert.equal(gameInfo.bone, 1);
  block.trigger(level);

  assert.equal(block.active, false);
  assert.equal(gameInfo.bone, 0);
  assert.equal(level.combo, 1);
  assert.equal(level.status, 'won');
  assert.equal(level.finishDelay, 1);

  block.trigger(level);
  assert.equal(gameInfo.bone, 0);
  assert.equal(level.combo, 1);
});
