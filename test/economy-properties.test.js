import test from 'node:test';
import assert from 'node:assert/strict';
import {UPGRADES, levels, price, purchase, refundUpgrade} from '../src/runner/progression.js';
import {createRun, fillTrack, step, act} from '../src/runner/world.js';
import {bankRun} from '../src/runner/rewards.js';
import {missionPackFor, missionProgress} from '../src/runner/missions.js';
import {collectionFrom} from '../src/runner/collection.js';

// The upgrade shop and the end-of-run banking are the two places the game
// creates or destroys a player's currency. Individual cases are covered
// elsewhere; these are the properties that must hold for every sequence,
// because a slow leak in either one is invisible until a save is ruined.

const KEYS = Object.keys(UPGRADES);

// A small deterministic generator, so a failure names a seed that reproduces.
function randomFor(seed) {
  let state = seed >>> 0;
  return () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
}

test('buying and refunding upgrades conserves every credit', () => {
  for (let seed = 0; seed < 600; seed++) {
    const random = randomFor(seed);
    const profile = {credits: Math.floor(random() * 6000), upgrades: levels({})};
    const opening = profile.credits;
    for (let move = 0; move < 40; move++) {
      const key = KEYS[Math.floor(random() * KEYS.length)];
      const creditsBefore = profile.credits, levelBefore = profile.upgrades[key];
      if (random() < .5) {
        if (purchase(profile, key)) {
          assert.equal(profile.upgrades[key], levelBefore + 1, `seed ${seed}: purchase moved one level`);
          assert.equal(creditsBefore - profile.credits, price(levelBefore),
            `seed ${seed}: purchase charged the listed price`);
        } else {
          assert.equal(profile.credits, creditsBefore, `seed ${seed}: a refused purchase must not charge`);
          assert.equal(profile.upgrades[key], levelBefore, `seed ${seed}: a refused purchase must not upgrade`);
        }
      } else {
        const refund = refundUpgrade(profile, key);
        if (refund > 0) {
          assert.equal(profile.upgrades[key], levelBefore - 1, `seed ${seed}: refund moved one level`);
          assert.equal(refund, price(levelBefore - 1), `seed ${seed}: refund returned the listed price`);
        } else {
          assert.equal(profile.credits, creditsBefore, `seed ${seed}: a refused refund must not pay`);
          assert.equal(profile.upgrades[key], levelBefore, `seed ${seed}: a refused refund must not downgrade`);
        }
      }
      assert.ok(profile.credits >= 0, `seed ${seed}: credits must never go negative`);
      for (const other of KEYS)
        assert.ok(profile.upgrades[other] >= 0 && profile.upgrades[other] <= 3,
          `seed ${seed}: ${other} left its level range at ${profile.upgrades[other]}`);
    }
    // Refunds are full, so unwinding every owned level restores the opening
    // balance exactly. Any rounding or off-by-one in the price table shows up
    // here as a player who can mint or lose points by toggling an upgrade.
    for (const key of KEYS) while (refundUpgrade(profile, key) > 0);
    assert.equal(profile.credits, opening, `seed ${seed}: credits were not conserved`);
    for (const key of KEYS) assert.equal(profile.upgrades[key], 0, `seed ${seed}: ${key} did not unwind`);
  }
});

test('an upgrade level is never created by a refused purchase at the price boundary', () => {
  // The exact-cost boundary is where an off-by-one would let a player buy a
  // level they cannot afford, or refuse one they can.
  for (const level of [0, 1, 2]) {
    const cost = price(level);
    const poor = {credits: cost - 1, upgrades: {...levels({}), leap: level}};
    assert.equal(purchase(poor, 'leap'), false, `level ${level} must not be affordable one point short`);
    assert.equal(poor.upgrades.leap, level);
    const exact = {credits: cost, upgrades: {...levels({}), leap: level}};
    assert.equal(purchase(exact, 'leap'), true, `level ${level} must be affordable at exactly its price`);
    assert.equal(exact.credits, 0);
  }
  // A maxed upgrade has no next price and must refuse any purchase.
  const maxed = {credits: 99999, upgrades: {...levels({}), leap: 3}};
  assert.equal(price(3), null);
  assert.equal(purchase(maxed, 'leap'), false, 'a maxed upgrade cannot be bought again');
  assert.equal(maxed.credits, 99999);
});

function freshProfile() {
  return {best: 0, distance: 0, bones: 0, bestRunBones: 0, credits: 0, challenges: 0,
    collection: collectionFrom()};
}

// Play a varied run so the banking properties see real, differing results
// rather than one hand-built fixture.
function playVaried(seed) {
  const run = createRun(seed);
  run.nextChoice = Infinity;
  run.missions = missionPackFor(0);
  let frame = 0;
  while (!run.ended && run.distance < 2000 && frame++ < 300000) {
    fillTrack(run);
    if (frame % 37 === 0) act(run, ['left', 'right', 'jump', 'slide'][frame % 4]);
    step(run, 1 / 120);
    run.objects = run.objects.filter(object => object.at > run.distance - 20);
  }
  if (!run.ended) {
    run.ended = true;
    run.score = Math.floor(run.distance) + run.bonePoints + run.bonusPoints;
  }
  return run;
}

test('a finished run scores exactly its distance plus bone and bonus points', () => {
  for (let seed = 0; seed < 60; seed++) {
    const run = playVaried(seed);
    assert.equal(run.score, Math.floor(run.distance) + run.bonePoints + run.bonusPoints,
      `seed ${seed}: score drifted from its parts`);
    assert.ok(run.score >= 0, `seed ${seed}: a run cannot score below zero`);
  }
});

test('banking a run is idempotent and never pays twice', () => {
  for (let seed = 0; seed < 60; seed++) {
    const run = playVaried(seed);
    const profile = freshProfile();
    const first = bankRun(profile, run, run.missions);
    const afterFirst = JSON.stringify(profile);
    const second = bankRun(profile, run, run.missions);
    assert.equal(JSON.stringify(profile), afterFirst, `seed ${seed}: a second bank changed the profile`);
    assert.deepEqual(second, first, `seed ${seed}: the receipt must stay stable`);
    assert.equal(profile.best, run.score, `seed ${seed}: best should match the banked score`);
    assert.ok(profile.credits >= run.score, `seed ${seed}: credits must include the run's score`);
    assert.equal(first.totalPoints, profile.credits,
      `seed ${seed}: the receipt total must equal what was actually paid`);
    assert.ok(profile.bones >= 0 && profile.credits >= 0, `seed ${seed}: totals went negative`);
  }
});

test('mission progress stays a whole number inside its own target', () => {
  for (let seed = 0; seed < 60; seed++) {
    const run = playVaried(seed);
    for (const mission of run.missions) {
      const progress = missionProgress(run, mission);
      assert.ok(Number.isInteger(progress), `seed ${seed}: progress ${progress} is not a whole number`);
      assert.ok(progress >= 0 && progress <= mission.target,
        `seed ${seed}: progress ${progress} escaped [0, ${mission.target}]`);
    }
  }
});

test('practice and unfinished runs are never banked', () => {
  const unfinished = playVaried(3);
  unfinished.ended = false;
  unfinished.receipt = null;
  const profile = freshProfile();
  assert.equal(bankRun(profile, unfinished, unfinished.missions), null);
  assert.deepEqual(profile, freshProfile(), 'an unfinished run must not touch the profile');

  const practice = playVaried(4);
  practice.receipt = null;
  practice.practice = {kind: 'jump'};
  const practiceProfile = freshProfile();
  assert.equal(bankRun(practiceProfile, practice, practice.missions), null);
  assert.deepEqual(practiceProfile, freshProfile(), 'practice must never change progress');
});
