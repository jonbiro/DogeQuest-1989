import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath, URL} from 'node:url';
import {Color} from 'three';
import {BONE_RIM} from '../src/runner/bone-model.js';
import {HAZARD_PALETTES} from '../src/runner/hazard-palette.js';
import {TRAIL_STONES, trailColors} from '../src/runner/trail-palette.js';

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

const roadColors = [
  ...TRAIL_STONES,
  ...trailColors(new Color('#c1ba88')).map(value => `#${value.getHexString()}`),
  // Bridge planks are a separate paving material but still carry the runner.
  '#c9915e', '#b77c4c',
];
const paintedDogContour = '#241914';

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

test('canvas collectibles and obstacle silhouettes keep a measurable road edge', () => {
  const boneContrast = Math.min(...roadColors.map(background => contrast(BONE_RIM, background)));
  assert.ok(boneContrast >= 2.25, `bone rim contrast fell to ${boneContrast.toFixed(2)} against a paving color`);

  const hazardContrast = Math.min(
    ...HAZARD_PALETTES.flatMap(palette => roadColors.map(background => contrast(palette[0], background))),
  );
  assert.ok(hazardContrast >= 2.25,
    `the darkest authored obstacle face must stay distinct from paving (min ${hazardContrast.toFixed(2)})`);

  // The supplied paintings all carry a near-black ink contour. Check that
  // shared silhouette edge against every road treatment, including bridges,
  // while the coat-specific colors remain free to vary by puppy.
  const dogContrast = Math.min(...roadColors.map(background => contrast(paintedDogContour, background)));
  assert.ok(dogContrast >= 3, `painted puppy contour contrast fell to ${dogContrast.toFixed(2)}`);
});
