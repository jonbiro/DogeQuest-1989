import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun, step, LANES} from '../src/runner/world.js';
import {routeBranchFor, routeTrailFor} from '../src/runner/route-branch.js';

test('branch plans are deterministic and make the scenic/challenge tradeoff legible', () => {
  const scenic = routeBranchFor('scenic', 350);
  const challenge = routeBranchFor('challenge', 350);
  assert.deepEqual(routeTrailFor(scenic).map(({lane}) => lane), [0, 0, 1, 1, 0, 1, 0, 0]);
  assert.deepEqual(routeTrailFor(challenge).map(({lane}) => lane), [2, 2, 1, 2, 1, 2, 2, 1]);
  assert.equal(scenic.shortcut, true);
  assert.equal(challenge.shortcut, false);
  assert.match(scenic.branchDetail, /Fewer hazards/);
  assert.match(challenge.branchDetail, /60 points/);
  assert.equal(routeBranchFor('scenic', 350).branchId, scenic.branchId);
  assert.equal(routeTrailFor(scenic).at(-1).at, 540);
});

function commitRoute(version, lane) {
  const run = createRun(8, {}, version);
  Object.assign(run, {
    distance: 349.9,
    nextRow: 320,
    objects: [],
    choicePending: 350,
    lane,
    x: LANES[lane],
  });
  step(run, 1 / 120);
  return run;
}

test('version-four branches add optional bones and record their real value', () => {
  const run = commitRoute(4, 2);
  const trail = run.objects.filter(object => object.routeTrail);
  assert.equal(run.route.kind, 'challenge');
  assert.equal(trail.length, 8);
  assert.equal(new Set(trail.map(object => object.routeBranchId)).size, 1);
  assert.ok(trail.every(object => object.optional && object.encounter === 'GOLDEN RISK RUN'));
  const first = trail[0];
  run.distance = first.at - 0.4;
  run.x = LANES[first.lane];
  run.lane = first.lane;
  step(run, 1 / 30);
  assert.equal(run.routeTrailBones, 1);
  assert.equal(run.routeTrailPoints, 25);
});

test('legacy branches keep their original compact route shape and no optional trail', () => {
  const run = commitRoute(3, 2);
  assert.deepEqual(run.route, {kind: 'challenge', until: 570});
  assert.equal(run.objects.some(object => object.routeTrail), false);
});
