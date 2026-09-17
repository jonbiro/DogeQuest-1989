import test from "node:test";
import assert from "node:assert/strict";
import {
  isBridge,
  bridgeCollapseByIndex,
  bridgeCollapseState,
} from "../src/runner/bridges.js";
import {createRun, fillTrack} from "../src/runner/world.js";
import {actionCue} from "../src/runner/guidance.js";

test("bridge decks have exact grid-aligned entrances, exits and repeat intervals", () => {
  for (let cycle = 0; cycle < 20; cycle++) {
    const base = cycle * 900;
    assert.equal(isBridge(base + 179.999), false);
    assert.equal(isBridge(base + 180), true);
    assert.equal(isBridge(base + 279.999), true);
    assert.equal(isBridge(base + 280), false);
    assert.equal(Array.from({length: 180}, (_, i) => base + i * 5).filter(isBridge).length, 20);
  }
  assert.equal(isBridge(-10), false);
});

test("collapsing bridge beats stay on the bridge grid and animate in a bounded window", () => {
  const first = bridgeCollapseByIndex(0);
  const second = bridgeCollapseByIndex(1);
  assert.deepEqual(
    {at:first.at, bridgeStart:first.bridgeStart, bridgeEnd:first.bridgeEnd},
    {at:230, bridgeStart:180, bridgeEnd:280},
  );
  assert.equal(second.at - first.at, 1800);
  assert.equal(isBridge(first.at), true);
  assert.equal(bridgeCollapseState(first.at - 51, [first.at]), null);
  for (const station of [first.at - 34, first.at, first.at + 34]) {
    const state = bridgeCollapseState(station, [first.at]);
    assert.ok(state);
    assert.ok(state.progress >= 0 && state.progress <= 1);
    assert.ok(state.eased >= 0 && state.eased <= 1);
  }
});

test("version-four trails generate one full-width bridge gap with a clear cue", () => {
  const run = createRun(17, {}, 4);
  run.distance = 50;
  fillTrack(run);
  const gaps = run.objects.filter(object => object.bridgeCollapse);
  assert.equal(gaps.length, 3);
  assert.deepEqual(gaps.map(object => object.lane), [0, 1, 2]);
  assert.ok(gaps.every(object => object.at === 230 && object.type === "gap"));
  assert.match(actionCue({
    distance:220,
    speed:22,
    x:0,
    vx:0,
    lane:1,
    y:0,
    vy:0,
    slide:0,
    slideNext:0,
    diving:false,
    objects:[{type:"gap",lane:1,at:230,bridgeCollapse:true,used:false,passed:false}],
  }), /BRIDGE COLLAPSING/);
  const legacy = createRun(17, {}, 3);
  legacy.distance = 50;
  fillTrack(legacy);
  assert.equal(legacy.objects.some(object => object.bridgeCollapse), false);
});
