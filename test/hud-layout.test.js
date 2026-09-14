import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {hudReserve, hudReserveApplies, HUD_STACK_GAP, HUD_RESERVE_LIMIT} from '../src/runner/hud-layout.js';

// Measured on the shipped portrait layout at 390x844 with no safe-area inset:
// the five-button control row occupies 740..822 and the gesture coach banner
// sits 8px above it. The mission dock's old fixed 96px offset put its bottom
// edge at 748, so the coach printed straight over the mission line.
const CONTROLS_TOP = 740, COACH_TOP = 702, VIEWPORT = 844;

test('the dock clears the button row even when no coach banner is showing', () => {
  const reserve = hudReserve(VIEWPORT, [CONTROLS_TOP, NaN]);
  assert.equal(reserve, VIEWPORT - CONTROLS_TOP + HUD_STACK_GAP);
  assert.ok(reserve > 96, 'the old fixed portrait offset was already too small');
});

test('a visible coach banner pushes the dock above it', () => {
  const withCoach = hudReserve(VIEWPORT, [CONTROLS_TOP, COACH_TOP]);
  const withoutCoach = hudReserve(VIEWPORT, [CONTROLS_TOP, NaN]);
  assert.equal(withCoach, VIEWPORT - COACH_TOP + HUD_STACK_GAP);
  assert.ok(withCoach > withoutCoach, 'the banner must widen the reserve, not be ignored');
  // The dock's bottom edge now sits above the banner's top edge.
  assert.ok(VIEWPORT - withCoach <= COACH_TOP, 'the dock must not overlap the coach banner');
});

test('an untrustworthy measurement leaves the CSS fallback in place', () => {
  for (const tops of [[], [NaN], [0], [-40], [Infinity], [VIEWPORT], [VIEWPORT + 10]])
    assert.equal(hudReserve(VIEWPORT, tops), null, `tops ${JSON.stringify(tops)} is not measurable`);
  for (const height of [0, -1, NaN, Infinity, undefined, null])
    assert.equal(hudReserve(height, [CONTROLS_TOP]), null, `viewport ${height} is not measurable`);
});

test('a runaway measurement can never push the dock off the top of the screen', () => {
  const reserve = hudReserve(VIEWPORT, [1]);
  assert.equal(reserve, Math.round(VIEWPORT * HUD_RESERVE_LIMIT));
  assert.ok(reserve < VIEWPORT, 'the dock stays on screen');
});

test('the reserve only applies to the portrait phone layout', () => {
  for (const [w, h] of [[320, 568], [360, 780], [390, 844], [430, 932]])
    assert.equal(hudReserveApplies(w, h), true, `${w}x${h} is a portrait phone`);
  // Landscape anchors the dock to the top of the screen, and a desktop window
  // has room for both; a reserve there would fight the stylesheet.
  for (const [w, h] of [[844, 390], [1280, 800], [768, 1024], [NaN, 844], [390, NaN]])
    assert.equal(hudReserveApplies(w, h), false, `${w}x${h} must keep the stylesheet's own offset`);
});

test('every phone width in the supported range keeps the dock clear of the stack', () => {
  // The control row grows a little as the viewport narrows and its labels wrap;
  // the reserve is measured, so it tracks that instead of guessing.
  for (const width of [320, 360, 375, 390, 414, 430]) {
    const height = Math.round(width * 2.1);
    for (const stackHeight of [82, 96, 120, 152]) {
      const top = height - stackHeight;
      const reserve = hudReserve(height, [top]);
      assert.ok(reserve !== null, `${width}px measured`);
      assert.ok(height - reserve <= top, `${width}px x ${stackHeight}px stack stays clear`);
      assert.ok(reserve <= height * HUD_RESERVE_LIMIT + 1, `${width}px stays on screen`);
    }
  }
});

test('the stylesheet reads the measured reserve and keeps a safe fallback', () => {
  const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');
  const bottoms = [...css.matchAll(/#mission-hud[^{]*\{[^}]*?bottom:\s*([^;]+);/g)].map(m => m[1].trim());
  assert.ok(bottoms.length >= 2, `expected the base and portrait offsets, found ${bottoms.length}`);
  const reserved = bottoms.filter(value => value.includes('--hud-reserve'));
  assert.equal(reserved.length, 2, 'both bottom-anchored dock rules read the measured reserve');
  for (const value of reserved)
    assert.match(value, /var\(--hud-reserve,\s*calc\(/, 'each keeps a static fallback offset');
  // Landscape deliberately anchors the dock to the top of the screen instead.
  assert.ok(bottoms.includes('auto'), 'landscape still anchors the dock to the top');
});
