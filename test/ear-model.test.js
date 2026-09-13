import test from "node:test";
import assert from "node:assert/strict";
import { createClassicEarGeometries } from "../src/runner/ear-model.js";

test("classic ear profiles are smooth, rooted and distinct", () => {
  const {floppy, upright} = createClassicEarGeometries();
  for (const geometry of [floppy, upright]) {
    assert.ok(geometry.attributes.position.count >= 160);
    assert.ok(geometry.attributes.normal.count === geometry.attributes.position.count);
    assert.ok([...geometry.attributes.position.array].every(Number.isFinite));
  }
  floppy.computeBoundingBox();
  upright.computeBoundingBox();
  assert.equal(floppy.boundingBox.max.y, 0);
  assert.equal(upright.boundingBox.min.y, 0);
  assert.notEqual(floppy.uuid, upright.uuid);
});

