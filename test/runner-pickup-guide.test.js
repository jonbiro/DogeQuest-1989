import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {PICKUP_DEFINITIONS, PICKUP_TYPES, pickupBadgeFor, pickupGuideFor, pickupNoticeFor} from '../src/runner/pickup-guide.js';

const appSource = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../runner/index.html', import.meta.url), 'utf8');

test('every special pickup has a plain-language effect and distinct visual identity', () => {
  assert.equal(PICKUP_TYPES.length, 8);
  for (const type of PICKUP_TYPES) {
    const definition = PICKUP_DEFINITIONS[type];
    assert.ok(definition.label);
    assert.ok(definition.icon);
    assert.ok(definition.effect);
    assert.match(definition.color, /^#[0-9a-f]{6}$/i);
  }
  assert.equal(PICKUP_DEFINITIONS.double.label, 'Bone doubler');
  assert.match(PICKUP_DEFINITIONS.double.effect, /2× bone points/);
  assert.match(PICKUP_DEFINITIONS.magnet.detail, /live timer/i,
    'the magnet guide must not promise a fixed duration when upgrades can extend it');
});

test('the help key is rebuilt from the pickup definitions instead of drifting in the HTML shell', () => {
  assert.match(shellSource, /id="pickup-key-grid"/);
  assert.match(appSource, /import \{PICKUP_DEFINITIONS,PICKUP_TYPES,pickupGuideFor/);
  assert.match(appSource, /function syncPickupKey\(\)/);
  assert.match(appSource, /const items = PICKUP_TYPES\.map\(type =>/);
  assert.match(appSource, /item\.setAttribute\('aria-label', `\$\{definition\.label\}/);
  assert.match(appSource, /syncPickupKey\(\);/);
});

test('upcoming pickup guide names the effect and the lane without taking over urgent play', () => {
  const run = {
    distance: 100,
    lane: 1,
    objects: [
      {type: 'gem', lane: 0, at: 134, used: false, passed: false},
      {type: 'magnet', lane: 2, at: 150, used: false, passed: false},
    ],
  };
  const guide = pickupGuideFor(run);
  assert.equal(guide.type, 'gem');
  assert.equal(guide.label, 'Gem');
  assert.equal(guide.title, 'Gem');
  assert.match(guide.copy, /\+250 points/);
  assert.match(guide.copy, /left/);
  assert.match(guide.copy, /← left/);
  assert.match(guide.ariaLabel, /250-point bonus/);
});

test('guide stays quiet when the pickup is too close, collected, or part of a ride', () => {
  const base = {distance: 100, lane: 1, objects: [{type: 'heart', lane: 1, at: 101, used: false}]};
  assert.equal(pickupGuideFor(base), null);
  assert.equal(pickupGuideFor({...base, objects: [{...base.objects[0], at: 140, used: true}]}), null);
  assert.equal(pickupGuideFor({...base, raft: {start: 100, end: 200}}), null);
});

test('guide stays out of the HUD until a pickup is close enough to act on', () => {
  const run = {distance: 100, lane: 1, objects: [{type: 'magnet', lane: 1, at: 159, used: false}]};
  assert.equal(pickupGuideFor(run), null);
  assert.equal(pickupGuideFor({...run, objects: [{...run.objects[0], at: 158}]}).meters, 58);
});

test('a recent pickup explains its result in the quiet HUD card', () => {
  const run = {
    time: 14.2,
    lastPickup: {type: 'gem', time: 13.4, result: '+250 points'},
  };
  const notice = pickupNoticeFor(run);
  assert.equal(notice.label, 'Gem collected');
  assert.equal(notice.copy, '+250 points');
  assert.match(notice.ariaLabel, /250 points/);
  assert.equal(pickupNoticeFor({...run, time: 14.8}), null);
  assert.equal(pickupNoticeFor({...run, practice: {kind: 'jump'}}), null);
});

test('scene badge names the nearest actionable special pickup and its action', () => {
  const run = {
    distance: 100,
    objects: [
      {type: 'gift', lane: 0, at: 126, used: false, passed: false},
      {type: 'zoomies', lane: 2, at: 118, used: false, passed: false},
    ],
  };
  const badge = pickupBadgeFor(run);
  assert.equal(badge.type, 'zoomies');
  assert.equal(badge.label, 'Zoomies');
  assert.equal(badge.action, 'COLLECT');
  assert.equal(badge.lane, 'right →');
  assert.match(badge.copy, /Speed \+ smash/);
  assert.match(badge.copy, /right →/);
  assert.match(badge.ariaLabel, /right/);
  assert.equal(badge.object.at, 118);
});

test('scene badge tells the player when a reward is above the trail and stays quiet during rides', () => {
  const run = {
    distance: 100,
    objects: [{type: 'gift', lane: 1, at: 120, airborne: true, used: false, passed: false}],
  };
  assert.equal(pickupBadgeFor(run).action, 'JUMP TO COLLECT');
  assert.equal(pickupBadgeFor({...run, zipline: {start: 100, end: 160}}), null);
  assert.equal(pickupBadgeFor({...run, objects: [{...run.objects[0], used: true}]}), null);
});
