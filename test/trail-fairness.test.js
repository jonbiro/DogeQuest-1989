import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun, fillTrack, step, act, BASE_SLIDE_DURATION} from '../src/runner/world.js';
import {CLEARED_BY_JUMP, CLEARED_BY_SLIDE} from '../src/runner/hazard-cast.js';
import {turnPrompt} from '../src/runner/turns.js';

// Generation fairness is a property of the whole trail, not of any one row, so
// it is checked by playing the trail rather than by reading the generator. A
// player who always picks a clearable lane and acts in time must never lose a
// heart; if a seed can produce an unavoidable hazard, this is what catches it.

const SOLID = ['rock', 'log', 'arch', 'branch', 'gate'];
// Shelter beats add character hazards to live rows; the probe reads them too
// so the officer and cart can never hide from the survival assertions.
const BEAT = ['pound-worker', 'pound-officer', 'crate-cart'];
const HAZARD = new Set([...SOLID, 'gap', ...BEAT]);
// Clearing rules live in `hazard-cast.js`; the probe consumes the same sets
// the game does so a new cast member cannot silently escape the probe.

// Drive a run with a policy. `policy` decides what the player does each frame;
// returning the run lets a caller assert on hearts, distance and mistakes.
function play(seed, {maxDistance = 2500, policy = perfectPolicy, upgrades = {}} = {}) {
  const run = createRun(seed, upgrades);
  // Route gates ask for a player preference rather than a skill, and an
  // unanswered one is not a fairness failure. Keep them out of this probe.
  run.nextChoice = Infinity;
  const dt = 1 / 120;
  const done = new Set();
  let guard = 0;
  while (!run.ended && run.distance < maxDistance && guard++ < 600000) {
    fillTrack(run);
    policy(run, done);
    step(run, dt);
    // Keep the object list bounded; passed hazards can never be hit again.
    run.objects = run.objects.filter(object => object.at > run.distance - 20);
  }
  return run;
}

function nextRow(run) {
  const ahead = run.objects.filter(object => HAZARD.has(object.type) && object.at > run.distance + .01);
  if (!ahead.length) return null;
  const at = Math.min(...ahead.map(object => object.at));
  const lanes = new Map(ahead.filter(object => Math.abs(object.at - at) < 1e-9)
    .map(object => [object.lane, object.type]));
  return {at, lanes};
}

function perfectPolicy(run, done) {
  const turn = turnPrompt(run);
  const turnPending = Boolean(turn && turn.status !== 'accepted');
  if (turnPending) {
    const key = `turn:${turn.index}`;
    if (!done.has(key)) {
      done.add(key);
      act(run, turn.direction);
    }
  }
  // Aboard a raft, minecart or ski descent no ordinary jump or slide answer
  // applies the same way; the only answer is the ride's safe lane, plus a
  // short hop for jumpable snow. Frostpeak rides at 3350, so the probe must
  // play them like the other rides instead of reading them as trail rows.
  if (run.raft || run.minecart || run.ski) {
    const ride = run.objects
      .filter(object => (object.raftHazard || object.minecartHazard || object.skiHazard || object.skiObstacle) && object.at > run.distance + .01)
      .sort((a, b) => a.at - b.at)[0];
    const safe = ride?.raftSafeLane ?? ride?.minecartSafeLane ?? ride?.skiSafeLane;
    if (safe !== undefined && run.lane !== safe) act(run, safe < run.lane ? 'left' : 'right');
    else if (ride && (ride.type === 'mogul' || ride.type === 'snowball') &&
      ride.at - run.distance < run.speed * .4 && ride.at - run.distance > .05 && (run.skiHop || 0) <= 0) act(run, 'jump');
    return;
  }
  const row = nextRow(run);
  if (!row) return;
  let target = [0, 1, 2].find(lane => !row.lanes.has(lane));
  if (target === undefined) {
    const options = [0, 1, 2]
      .filter(lane => CLEARED_BY_JUMP.has(row.lanes.get(lane)) || CLEARED_BY_SLIDE.has(row.lanes.get(lane)))
      .sort((a, b) => Math.abs(a - run.lane) - Math.abs(b - run.lane));
    target = options[0];
  }
  // A pending corner owns the horizontal axis: a lane input during one reads as
  // a turn attempt, and a wrong attempt costs a heart.
  if (!turnPending && target !== undefined && run.lane !== target && !run.zipline)
    act(run, target < run.lane ? 'left' : 'right');
  const needed = row.lanes.get(run.lane);
  const eta = (row.at - run.distance) / Math.max(1, run.speed);
  const key = `${row.at.toFixed(3)}:${run.lane}`;
  if (needed && eta <= .34 && eta > .05 && !done.has(key) && !run.zipline) {
    done.add(key);
    if (CLEARED_BY_JUMP.has(needed)) act(run, 'jump');
    else if (CLEARED_BY_SLIDE.has(needed)) act(run, 'slide');
  }
}

// The baseline probe intentionally disables optional rides so its obstacle
// assertions stay focused. This companion policy exercises those sections too:
// choose the readable centre route, jump into every cable, and follow its
// airborne bone line while retaining the same hazard policy as above.
function optionalPerfectPolicy(run, done) {
  const turn = turnPrompt(run);
  if (turn && turn.status !== 'accepted') {
    const key = `turn:${turn.index}`;
    if (!done.has(key)) {
      done.add(key);
      act(run, turn.direction);
    }
  }
  if (run.choicePending !== null && run.choicePending - run.distance < 42) {
    if (run.lane !== 1) act(run, run.lane < 1 ? 'right' : 'left');
    return;
  }
  if (run.zipline) {
    const bone = run.objects
      .filter(object => object.type === 'bone' && object.airborne && !object.used && object.at > run.distance + .01)
      .sort((a, b) => a.at - b.at)[0];
    if (bone && Math.abs(bone.at - run.distance) < 18 && run.lane !== bone.lane)
      act(run, bone.lane < run.lane ? 'left' : 'right');
    return;
  }
  const cable = run.objects
    .filter(object => object.type === 'zipline-start' && !object.caught && object.at > run.distance + .01)
    .sort((a, b) => a.at - b.at)[0];
  if (cable && cable.at - run.distance < Math.max(12, run.speed * .48)) {
    if (run.y === 0) act(run, 'jump');
    return;
  }
  perfectPolicy(run, done);
}

function playOptional(seed, {maxDistance = 8000} = {}) {
  const run = createRun(seed);
  const done = new Set();
  let guard = 0;
  while (!run.ended && run.distance < maxDistance && guard++ < 600000) {
    fillTrack(run);
    optionalPerfectPolicy(run, done);
    step(run, 1 / 120);
    run.objects = run.objects.filter(object => object.at > run.distance - 20);
  }
  return run;
}

// Steers correctly but never jumps or slides. Used only to prove the harness
// above can actually detect a heart loss, so a green fairness run can never be
// the result of a policy that silently stopped driving the game.
function passivePolicy(run, done) {
  const turn = turnPrompt(run);
  if (turn && turn.status !== 'accepted') {
    const key = `turn:${turn.index}`;
    if (!done.has(key)) {
      done.add(key);
      act(run, turn.direction);
    }
  }
}

test('the fairness harness can detect an avoidable hazard being missed', () => {
  // Sensitivity check: without jumps or slides a player must get hurt. If this
  // ever passes, the survival assertions below are meaningless.
  let hurt = 0;
  for (let seed = 0; seed < 8; seed++)
    if (play(seed, {maxDistance: 1200, policy: passivePolicy}).hearts < 3) hurt++;
  assert.equal(hurt, 8, 'a player who never jumps or slides must lose hearts on every seed');
});

test('a player who always picks a clearable lane never loses a heart', () => {
  const losses = [];
  for (let seed = 0; seed < 40; seed++) {
    const run = play(seed, {maxDistance: 2500});
    assert.ok(run.distance > 1200, `seed ${seed} should reach a long run, stopped at ${run.distance}`);
    if (run.hearts < 3)
      losses.push({seed, hearts: run.hearts, at: Math.round(run.distance), cause: run.lastMistake});
  }
  assert.deepEqual(losses, [], `unavoidable damage: ${JSON.stringify(losses)}`);
});

test('live trails stay survivable with the full shelter cast in the mix', () => {
  // Current browser runs opt into encounter pacing: shelter beats stage the
  // worker, then the slide-demanding officer, then the crate cart in rotation.
  // Crossings land hundreds of meters apart, so the probe runs to 3,200m. A
  // perfect player must still never lose a heart, and every seed must actually
  // meet the officer and the cart.
  const losses = [];
  let officers = 0, carts = 0;
  for (let seed = 0; seed < 40; seed++) {
    const run = createRun(seed, {}, 5, null, {encounterPacing: true});
    run.nextChoice = Infinity;
    const done = new Set();
    const seen = new Set();
    const dt = 1 / 120;
    let guard = 0;
    while (!run.ended && run.distance < 3200 && guard++ < 600000) {
      fillTrack(run);
      for (const object of run.objects)
        if (BEAT.includes(object.type) && object.at < run.distance + 170) seen.add(object.type);
      perfectPolicy(run, done);
      step(run, dt);
      run.objects = run.objects.filter(object => object.at > run.distance - 20);
    }
    assert.ok(run.distance > 1200, `seed ${seed} should reach a long run, stopped at ${run.distance}`);
    assert.ok(seen.has('pound-worker'), `seed ${seed} never met the shelter worker`);
    assert.ok(seen.has('pound-officer'), `seed ${seed} never met the pound officer`);
    assert.ok(seen.has('crate-cart'), `seed ${seed} never met the crate cart`);
    if (seen.has('pound-officer')) officers++;
    if (seen.has('crate-cart')) carts++;
    if (run.hearts < 3)
      losses.push({seed, hearts: run.hearts, at: Math.round(run.distance), cause: run.lastMistake});
  }
  assert.equal(officers, 40, 'every live seed should patrol past the officer');
  assert.equal(carts, 40, 'every live seed should dodge the crate cart');
  assert.deepEqual(losses, [], `unavoidable damage with the cast: ${JSON.stringify(losses)}`);
});

test('a perfect player can solve route gates and ziplines without skipping them', () => {
  for (const seed of Array.from({length: 10}, (_, index) => index)) {
    const run = playOptional(seed);
    assert.ok(run.distance >= 7900, `seed ${seed} should reach the full probe, stopped at ${run.distance}`);
    assert.equal(run.hearts, 3, `seed ${seed} lost a heart in an optional section at ${run.distance}`);
    assert.ok(run.routeChoices >= 10, `seed ${seed} never exercised route gates`);
    assert.ok(run.ziplines >= 5, `seed ${seed} never exercised ziplines`);
  }
});

test('no generated row demands a slide while the player is still committed to a jump', () => {
  // A jump keeps the puppy airborne longer than the tightest gap between
  // consecutive hazard rows, so an all-jump row followed closely by an
  // all-slide row would be unsurvivable no matter how well it was played.
  const airtime = measureJumpAirtime();
  assert.ok(airtime > .6, `a jump should carry real airtime, measured ${airtime}`);
  const speedAt = distance => Math.min(36, 22 + distance / 90);
  let tight = 0, impossible = [];
  for (let seed = 0; seed < 60; seed++) {
    for (const [previous, current, at] of consecutiveRows(seed, 4000)) {
      const gap = (at.to - at.from) / speedAt(at.to);
      if (gap <= 0 || gap >= airtime) continue;
      tight++;
      const forcesJump = [0, 1, 2].every(lane => CLEARED_BY_JUMP.has(previous.get(lane)));
      const slideOnly = [0, 1, 2].every(lane => CLEARED_BY_SLIDE.has(current.get(lane)));
      if (forcesJump && slideOnly) impossible.push({seed, ...at, gap: +gap.toFixed(3)});
    }
  }
  assert.ok(tight > 100, `expected many closely spaced rows to examine, saw ${tight}`);
  assert.deepEqual(impossible, [], `rows that cannot be cleared: ${JSON.stringify(impossible.slice(0, 3))}`);
});

test('a jump clears the tallest jumpable hazard and a slide stays low long enough to read', () => {
  assert.ok(BASE_SLIDE_DURATION > .5, 'a slide should stay low long enough to read');
  const apex = measureJumpApex();
  // The collision rules clear a gap above .8, a log above .65 and a rock above
  // 1.25. A jump has to beat the highest of those or rocks become undodgeable.
  assert.ok(apex > 1.25, `a jump must clear a rock, apex was ${apex}`);
});

function measureJumpAirtime() {
  const run = createRun(1);
  run.nextRow = 99999;
  run.objects = [];
  act(run, 'jump');
  let elapsed = 0, airborne = 0;
  for (let i = 0; i < 600; i++) {
    step(run, 1 / 120);
    elapsed += 1 / 120;
    if (run.y > 0) airborne = elapsed;
  }
  return airborne;
}

function measureJumpApex() {
  const run = createRun(1);
  run.nextRow = 99999;
  run.objects = [];
  act(run, 'jump');
  let apex = 0;
  for (let i = 0; i < 600; i++) {
    step(run, 1 / 120);
    apex = Math.max(apex, run.y);
  }
  return apex;
}

// Every adjacent pair of hazard rows in one seed, as lane -> type maps.
function* consecutiveRows(seed, distance) {
  const run = createRun(seed);
  run.nextChoice = Infinity;
  const rows = new Map();
  for (let at = 0; at < distance; at += 150) {
    run.distance = at;
    fillTrack(run);
    for (const object of run.objects) {
      if (!HAZARD.has(object.type)) continue;
      const key = Math.round(object.at * 1000) / 1000;
      if (!rows.has(key)) rows.set(key, new Map());
      rows.get(key).set(object.lane, object.type);
    }
    run.objects = run.objects.filter(object => object.at > at);
  }
  const ordered = [...rows.keys()].sort((a, b) => a - b);
  for (let i = 1; i < ordered.length; i++)
    yield [rows.get(ordered[i - 1]), rows.get(ordered[i]), {from: ordered[i - 1], to: ordered[i]}];
}

test('every hazard type is actually clearable by the action it asks for', () => {
  // The survival probe above picks the easiest lane, so it can pass without
  // ever needing a particular clearing rule. This pins each rule directly: put
  // one hazard in the puppy's lane, perform its action, and require a clean
  // clear. Raising a threshold out of reach fails here even though a lane-
  // picking player would never have noticed.
  const actionFor = type => CLEARED_BY_JUMP.has(type) ? 'jump' : 'slide';
  for (const type of [...SOLID, 'gap', 'pound-worker', 'pound-officer', 'crate-cart']) {
    for (const speed of [22, 36]) {
      const run = createRun(1);
      run.speed = speed;
      run.distance = speed === 36 ? 2000 : 0;
      run.nextRow = 99999;
      run.nextChoice = Infinity;
      // A gap spans the whole trail; the others sit in the puppy's lane only.
      run.objects = type === 'gap'
        ? [0, 1, 2].map(lane => ({id: lane, type, lane, at: run.distance + speed * .4}))
        : [{id: 0, type, lane: run.lane, at: run.distance + speed * .4}];
      act(run, actionFor(type));
      for (let i = 0; i < 150; i++) step(run, 1 / 120);
      assert.equal(run.hearts, 3, `${type} at ${speed}m/s was not cleared by a ${actionFor(type)}`);
      assert.ok(run.clears >= 1, `${type} at ${speed}m/s did not register as a clear`);
    }
  }
});

test('a hazard met with the wrong action still costs a heart', () => {
  // The counterpart to the rule above: if this ever passes, the clearing test
  // proves nothing, because every action would clear everything.
  for (const type of [...SOLID, 'gap', 'pound-worker', 'pound-officer', 'crate-cart']) {
    const wrong = CLEARED_BY_JUMP.has(type) ? 'slide' : 'jump';
    const run = createRun(1);
    run.speed = 22;
    run.nextRow = 99999;
    run.nextChoice = Infinity;
    run.objects = type === 'gap'
      ? [0, 1, 2].map(lane => ({id: lane, type, lane, at: 22 * .4}))
      : [{id: 0, type, lane: run.lane, at: 22 * .4}];
    act(run, wrong);
    for (let i = 0; i < 150; i++) step(run, 1 / 120);
    assert.equal(run.hearts, 2, `${type} should not be cleared by a ${wrong}`);
  }
});
