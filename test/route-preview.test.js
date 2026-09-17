import test from 'node:test';
import assert from 'node:assert/strict';
import {routeChoiceMarkup, routeChoicePreview} from '../src/runner/route-preview.js';

test('route preview appears only during the readable gate approach', () => {
  for (const remaining of [41, 0, -1])
    assert.equal(routeChoicePreview({choicePending:350, distance:350 - remaining}), null);
  const preview = routeChoicePreview({choicePending:350, distance:325.2});
  assert.equal(preview.remaining, 25);
  assert.deepEqual(preview.options.map(option => option.kind), ['scenic', 'challenge']);
});

test('route markup previews the tradeoff and preserves lane direction', () => {
  const markup = routeChoiceMarkup({choicePending:350, distance:325.2});
  assert.match(markup, /FORK AHEAD/);
  assert.match(markup, /25m/);
  assert.match(markup, /SCENIC[\s\S]*Fewer hazards/);
  assert.match(markup, /CHALLENGE[\s\S]*\+60 pts per clear/);
  assert.match(markup, /data-lane="0"/);
  assert.match(markup, /data-lane="2"/);
  assert.equal(routeChoiceMarkup({choicePending:null, distance:325}), '');
});

test('fork preview names the destination-specific detour without changing its tradeoff', () => {
  const preview = routeChoicePreview({choicePending:500, distance:475.2});
  assert.equal(preview.context.area, 'BROKEN RIDGE');
  assert.match(preview.options[0].reward, /CANYON SHORTCUT/);
  assert.match(preview.options[1].reward, /RIDGE RUN/);
  const markup = routeChoiceMarkup({choicePending:500, distance:475.2});
  assert.match(markup, /FORK AHEAD · BROKEN RIDGE/);
  assert.match(markup, /Fewer hazards/);
  assert.match(markup, /\+60 pts per clear/);
});
