import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath, URL} from 'node:url';

const css = readFileSync(fileURLToPath(new URL('../src/runner/ui.css', import.meta.url)), 'utf8');

function lastCssValue(selector, property) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}\\s*\\{[^}]*?(?<![-\\w])${property}\\s*:\\s*([^;]+)`, 'g');
  let value = '';
  for (const match of css.matchAll(pattern)) value = match[1].trim();
  assert.ok(value, `${selector} has a ${property} declaration`);
  return value;
}

function color(value) {
  const match = value.match(/#([0-9a-f]{6})/i);
  assert.ok(match, `expected a solid color in ${value}`);
  const number = Number.parseInt(match[1], 16);
  return [number >> 16 & 255, number >> 8 & 255, number & 255];
}

function luminance(rgb) {
  return rgb.reduce((sum, channel, index) => {
    channel /= 255;
    const linear = channel <= .03928 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    return sum + linear * [.2126, .7152, .0722][index];
  }, 0);
}

function contrast(foreground, background) {
  const foregroundLuminance = luminance(color(foreground));
  const backgroundLuminance = luminance(color(background));
  return (Math.max(foregroundLuminance, backgroundLuminance) + .05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + .05);
}

test('critical runner labels keep measurable contrast in the final visual layer', () => {
  const missionBackground = lastCssValue('#mission-hud', 'background');
  const missionLabel = lastCssValue('#mission-label', 'color');
  const routeChoice = lastCssValue('#route-choice', 'color');
  const controlLabel = lastCssValue('#controls button:not(.jump):not(.ready):not([data-control-state="queued"]):not(.turn-ready)', 'color');
  const actionLabel = lastCssValue('#controls button[data-action].action-cue:not(:disabled)', 'color');

  assert.ok(contrast(missionLabel, missionBackground) >= 4.5, 'mission progress label must meet AA contrast');
  assert.ok(contrast(routeChoice, missionBackground) >= 4.5, 'route choice must meet AA contrast');
  assert.ok(contrast(controlLabel, '#17323d') >= 4.5, 'secondary control labels must meet AA contrast');
  assert.ok(contrast(actionLabel, '#ffe9b5') >= 4.5, 'amber action cue labels must meet AA contrast');
});
