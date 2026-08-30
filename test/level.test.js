import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Vector } from '../src/utils/Vector.js';
import { makeLevel } from '../scripts/level-fixtures.js';

test('Level counts bone actors and coin blocks as collectibles', () => {
  const { gameInfo, level } = makeLevel(['@o?', 'xxx']);

  assert.equal(gameInfo.bone, 2);
  assert.equal(gameInfo.totalBone, 2);
  assert.deepEqual(
    level.actors.map((actor) => actor.type),
    ['player', 'bone', 'coinblock']
  );
});

test('Level.obstacleAt handles walls, empty space, and out-of-bounds positions', () => {
  const { level } = makeLevel(['@ x', 'xxx']);

  assert.equal(level.obstacleAt(new Vector(1, 0), new Vector(1, 1)), undefined);
  assert.equal(level.obstacleAt(new Vector(2, 0), new Vector(1, 1)), 'wall');
  assert.equal(level.obstacleAt(new Vector(-0.1, 0), new Vector(1, 1)), 'wall');
  assert.equal(level.obstacleAt(new Vector(0, -0.1), new Vector(1, 1)), 'wall');
  assert.equal(level.obstacleAt(new Vector(0, 2), new Vector(1, 1)), 'lava');
});

test('Level.actorAt finds overlapping actors and ignores the actor itself', () => {
  const { level } = makeLevel(['@o', '  ']);
  const bone = level.actors.find((actor) => actor.type === 'bone');

  level.player.pos = new Vector(0, 0);
  bone.pos = new Vector(0.5, 0.2);

  assert.equal(level.actorAt(level.player), bone);
  assert.equal(level.actorAt(bone), level.player);
});

test('collecting bones updates the combo and wins when the last bone is collected', () => {
  const { gameInfo, level } = makeLevel(['@oo', 'xxx']);
  const bones = level.actors.filter((actor) => actor.type === 'bone');

  level.playerTouched('bone', bones[0]);
  assert.equal(gameInfo.bone, 1);
  assert.equal(level.combo, 1);
  assert.equal(level.status, null);
  assert.equal(level.actors.includes(bones[0]), false);

  level.playerTouched('bone', bones[1]);
  assert.equal(gameInfo.bone, 0);
  assert.equal(level.combo, 2);
  assert.equal(level.status, 'won');
  assert.equal(level.finishDelay, 1);
});

test('hazards kill an unshielded player but a shield absorbs one hit', () => {
  const { level } = makeLevel(['@S', 'xx']);
  const spike = level.actors.find((actor) => actor.type === 'spike');

  level.player.shieldTimer = 1;
  level.playerTouched('spike', spike);
  assert.equal(level.player.shieldTimer, 0);
  assert.equal(level.status, null);

  const unshielded = makeLevel(['@S', 'xx']).level;
  const unshieldedSpike = unshielded.actors.find((actor) => actor.type === 'spike');
  unshielded.playerTouched('spike', unshieldedSpike);
  assert.equal(unshielded.status, 'lost');
  assert.equal(unshielded.finishDelay, 1);
});

test('animate advances time, decays expired combos, and removes broken walls', () => {
  const { level } = makeLevel(['@B', 'xx']);
  const wall = level.actors.find((actor) => actor.type === 'breakablewall');

  level.combo = 3;
  level.comboTimer = 0.1;
  wall.broken = true;
  level.animate(0.2, {});

  assert.equal(level.timer, 0.2);
  assert.equal(level.combo, 0);
  assert.equal(level.actors.includes(wall), false);
});

test('isFinished becomes true only after the finish delay expires', () => {
  const { level } = makeLevel(['@']);

  level.status = 'won';
  level.finishDelay = 0.1;
  level.animate(0.05, {});
  assert.equal(level.isFinished(), false);
  level.animate(0.06, {});
  assert.equal(level.isFinished(), true);
});
