import test from "node:test";
import assert from "node:assert/strict";
import {TOKENS, hazardTone} from "../src/runner/theme-tokens.js";
import {toneFor, HAZARD_CAST} from "../src/runner/hazard-cast.js";
import {BONE_IVORY, BONE_RIM} from "../src/runner/bone-model.js";
import {RENDERER_BUDGET} from "../scripts/runner-resource-budget.js";

test('restyle tokens exist and map to CSS variables', () => {
  assert.equal(TOKENS.color.ink, '#102a28');
  assert.equal(TOKENS.color.lime, '#e2f7a5');
  assert.equal(TOKENS.type.hudMin, 12);
  assert.ok(TOKENS.color.boneFace);
  assert.ok(TOKENS.color.boneEdge);
});

test('every hazard has a restyle tone matching its clearing rule', () => {
  for (const [type, entry] of Object.entries(HAZARD_CAST)) {
    const tone = toneFor(type);
    assert.ok(['warm', 'cool', 'neutral'].includes(tone), `${type} tone`);
    if (entry.clear === 'jump') assert.notEqual(tone, 'cool', `${type} jump should not read as overhead`);
    if (entry.clear === 'slide' && ['arch', 'branch', 'gate'].includes(type))
      assert.equal(tone, 'cool', `${type} overhead reads cool`);
  }
  assert.equal(hazardTone('rock'), 'warm');
  assert.equal(hazardTone('arch'), 'cool');
  assert.equal(hazardTone('ice'), 'neutral');
});

test('bone uses dark edge for warm-paving legibility', () => {
  assert.equal(BONE_RIM, TOKENS.color.boneEdge);
  assert.ok(BONE_IVORY);
});

test('renderer budget still caps new-verb work (no new geo/tex without a cut)', () => {
  assert.deepEqual(RENDERER_BUDGET, {geometries: 37, textures: 10, drawCalls: 260, objects: 200});
});
