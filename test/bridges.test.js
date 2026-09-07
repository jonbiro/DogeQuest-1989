import test from "node:test";
import assert from "node:assert/strict";
import {isBridge} from "../src/runner/bridges.js";

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
