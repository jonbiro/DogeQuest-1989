import test from 'node:test';
import assert from 'node:assert/strict';
import {laneTargetFor} from '../src/runner/lane-target.js';

test('lane target stays on the current pad during a quiet opening', () => {
  const info = laneTargetFor({lane: 1, distance: 8, objects: []});
  assert.equal(info.current, 1);
  assert.equal(info.target, 1);
  assert.equal(info.source, 'steady');
  assert.equal(info.recommended, false);
});

test('lane target follows authored safe lanes before a course hazard', () => {
  const info = laneTargetFor({
    lane: 0,
    distance: 100,
    objects: [{type: 'rock', lane: 1, safeLane: 2, at: 120, used: false}],
  });
  assert.equal(info.target, 2);
  assert.equal(info.source, 'hazard');
  assert.equal(info.distance, 20);
  assert.equal(info.recommended, true);
});

test('moving gates recommend the closest open lane', () => {
  const info = laneTargetFor({
    lane: 2,
    distance: 2860,
    objects: [{
      type: 'moving-gate', lane: 2, at: 2880, movingGate: true,
      start: 2850, end: 2906, startLane: 0, endLane: 2,
      startX: -2.4, endX: 2.4, used: false,
    }],
  });
  assert.equal(info.source, 'gate');
  assert.notEqual(info.target, 2);
  assert.equal(info.recommended, true);
});

test('Frostpeak characters expose their authored safe lane', () => {
  const info = laneTargetFor({
    lane: 1,
    distance: 8700,
    objects: [{
      type: 'yeti', lane: 1, at: 8720, skiObstacle: true,
      skiYeti: true, skiSafeLane: 0, used: false,
    }],
  });
  assert.equal(info.source, 'ski');
  assert.equal(info.target, 0);
  assert.equal(info.distance, 20);
  assert.equal(info.recommended, true);
});

test('a pickup can light a lane when no hazard owns the decision', () => {
  const info = laneTargetFor({
    lane: 1,
    distance: 50,
    objects: [{type: 'magnet', lane: 0, at: 67, used: false}],
  });
  assert.equal(info.source, 'pickup');
  assert.equal(info.target, 0);
  assert.equal(info.recommended, true);
});

test('full-width rows do not invent a lane instruction', () => {
  const info = laneTargetFor({
    lane: 1,
    distance: 100,
    objects: [0, 1, 2].map(lane => ({type: 'log', lane, at: 120, used: false})),
  });
  assert.equal(info.target, 1);
  assert.equal(info.source, 'steady');
  assert.equal(info.recommended, false);
});
