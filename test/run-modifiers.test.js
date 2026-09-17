import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from '../src/runner/world.js';
import {
  DEFAULT_RUN_MODIFIER,
  RUN_MODIFIERS,
  applyRunModifier,
  modifierFor,
  modifierFrom,
} from '../src/runner/run-modifiers.js';

test('the saved modifier id is constrained to the known, friendly choices', () => {
  assert.equal(modifierFrom(undefined), DEFAULT_RUN_MODIFIER);
  assert.equal(modifierFrom('not-a-perk'), DEFAULT_RUN_MODIFIER);
  for (const definition of RUN_MODIFIERS) {
    assert.equal(modifierFrom(definition.id), definition.id);
    assert.equal(modifierFor(definition.id).name, definition.name);
    assert.ok(definition.effect.length > 12);
  }
});

test('each selected perk changes the opening state without changing the base score model', () => {
  const plain = createRun(1989);
  const treat = createRun(1989, {}, 4, 'treat-pouch');
  const scent = createRun(1989, {}, 4, 'scent-burst');
  const calm = createRun(1989, {}, 4, 'calm-start');

  assert.equal(plain.modifier, null);
  assert.equal(treat.modifier.id, 'treat-pouch');
  assert.equal(treat.shield, 1);
  assert.equal(scent.modifier.id, 'scent-burst');
  assert.equal(scent.magnet, 8);
  assert.equal(calm.modifier.id, 'calm-start');
  assert.equal(calm.invulnerable, 4);
  assert.equal(treat.events.at(-1), 'modifier-start');
  assert.deepEqual(treat.objects, plain.objects, 'the perk must not rewrite the seeded trail');
  assert.equal(treat.bonusPoints, plain.bonusPoints);
});

test('null modifiers remain a safe no-op for older callers', () => {
  const run = {shield: 0, magnet: 0, invulnerable: 0, events: []};
  assert.equal(applyRunModifier(run, null), null);
  assert.deepEqual(run, {shield: 0, magnet: 0, invulnerable: 0, events: []});
});

