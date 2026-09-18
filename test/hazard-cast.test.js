import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HAZARD_CAST,
  SOLID_HAZARDS,
  CHARACTER_HAZARDS,
  HAZARDS,
  TRAIL_HAZARDS,
  OVERHEAD_HAZARDS,
  CLEARED_BY_JUMP,
  CLEARED_BY_SLIDE,
  clearedBy,
  jumpHeightFor,
  collisionWidthFor,
  appearanceFor,
  baseTypeFor,
} from '../src/runner/hazard-cast.js';
import {AREA_GAMEPLAY} from '../src/runner/areas.js';
import {COURSES} from '../src/runner/courses.js';

test('every cast member carries a clearing rule, collision box and label', () => {
  for (const [type, entry] of Object.entries(HAZARD_CAST)) {
    assert.ok(['jump', 'slide', 'steer'].includes(entry.clear), `${type} needs a clearing rule`);
    assert.ok(Number.isFinite(entry.width) && entry.width > 0, `${type} needs a collision box`);
    assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `${type} needs a label`);
    assert.ok(['stone', 'organic', 'none'].includes(entry.palette), `${type} needs a palette family`);
    if (entry.clear === 'jump') {
      assert.ok(Number.isFinite(entry.jumpHeight) && entry.jumpHeight > 0, `${type} needs a jump height`);
    }
  }
});

test('legacy solid hazards keep their exact order for seeded streams', () => {
  assert.deepEqual([...SOLID_HAZARDS], ['rock', 'log', 'arch', 'branch', 'gate']);
  assert.deepEqual([...CHARACTER_HAZARDS], ['pound-worker']);
  assert.deepEqual([...HAZARDS], [
    'rock', 'log', 'arch', 'branch', 'gate', 'pound-worker',
    'moving-gate', 'gap', 'mogul', 'ice', 'ski-gate', 'yeti', 'snowball', 'snowman',
  ]);
});

test('clearing sets match the cast rules', () => {
  for (const type of Object.keys(HAZARD_CAST)) {
    if (HAZARD_CAST[type].clear === 'jump') assert.ok(CLEARED_BY_JUMP.has(type), `${type} should clear by jump`);
    if (HAZARD_CAST[type].clear === 'slide') assert.ok(CLEARED_BY_SLIDE.has(type), `${type} should clear by slide`);
  }
  // The classic probe vocabulary is unchanged by the refactor.
  for (const type of ['rock', 'log', 'gap']) assert.ok(CLEARED_BY_JUMP.has(type));
  for (const type of ['arch', 'branch', 'gate']) assert.ok(CLEARED_BY_SLIDE.has(type));
});

test('jump thresholds preserve the established collision tuning', () => {
  assert.equal(jumpHeightFor('rock'), 1.25);
  assert.equal(jumpHeightFor('log'), 0.65);
  assert.equal(jumpHeightFor('pound-worker'), 0.65);
  assert.equal(jumpHeightFor('gap'), 0.8);
  assert.equal(jumpHeightFor('mogul'), 0.58);
  assert.equal(jumpHeightFor('snowball'), 0.58);
  assert.equal(clearedBy('moving-gate'), 'slide');
  assert.equal(clearedBy('ice'), 'steer');
});

test('collision widths preserve the established lane envelopes', () => {
  assert.equal(collisionWidthFor('rock'), 0.95);
  assert.equal(collisionWidthFor('yeti'), 1.45);
  assert.equal(collisionWidthFor('unknown-type'), 0.95);
});

test('appearance preserves the crystal-rock exception and identity mapping', () => {
  assert.equal(appearanceFor({type: 'rock', courseRegion: 2}, 0), 'crystal-rock');
  assert.equal(appearanceFor({type: 'rock', courseRegion: 0}, 0), 'rock');
  assert.equal(appearanceFor({type: 'rock'}, 0), 'rock');
  assert.equal(appearanceFor('gate', 1), 'gate');
  assert.equal(appearanceFor('pound-worker', 0), 'pound-worker');
  assert.equal(appearanceFor({type: 'log'}, 3), 'log');
  assert.equal(baseTypeFor('crystal-rock'), 'rock');
  assert.equal(baseTypeFor('gate'), 'gate');
});

test('every authored course and area hazard exists in the cast', () => {
  const courseTypes = new Set();
  for (const course of COURSES) {
    for (const type of course.types || []) courseTypes.add(type);
    for (const beat of course.beats || []) {
      if (beat.type) courseTypes.add(beat.type);
    }
  }
  for (const profile of AREA_GAMEPLAY) {
    for (const type of profile.hazards || []) courseTypes.add(type);
    for (const pattern of profile.patterns || []) {
      for (const type of pattern.hazardOrder || []) courseTypes.add(type);
    }
  }
  for (const type of courseTypes) {
    assert.ok(HAZARD_CAST[type], `authored hazard ${type} must exist in the cast`);
  }
  for (const type of TRAIL_HAZARDS) {
    assert.ok(HAZARD_CAST[type], `trail hazard ${type} must exist in the cast`);
  }
  for (const type of OVERHEAD_HAZARDS) {
    assert.equal(HAZARD_CAST[type]?.clear, 'slide', `${type} overhead must clear by slide`);
  }
});
