import test from "node:test";
import assert from "node:assert/strict";
import { createRun, fillTrack, HAZARDS } from "../src/runner/world.js";

test("late ordinary rows block two lanes and move the escape lane", () => {
  for (let seed = 0; seed < 100; seed++) {
    const run = createRun(seed);
    Object.assign(run, {distance: 1000, nextRow: 1020, row: 17,
      nextChoice: 5000, nextZipline: 6000, choicePending: null,
      objects: [], lastSafeLane: 1});
    fillTrack(run);
    const rows = new Map();
    for (const object of run.objects.filter(o => HAZARDS.includes(o.type))) {
      if (!rows.has(object.at)) rows.set(object.at, []);
      rows.get(object.at).push(object.lane);
    }
    let previous = 1;
    for (const blocked of rows.values()) {
      assert.ok(blocked.length >= 2);
      if (blocked.length === 3) { previous = null; continue; }
      const safe = [0, 1, 2].find(lane => !blocked.includes(lane));
      if (previous !== null) assert.notEqual(safe, previous);
      previous = safe;
    }
  }
});
