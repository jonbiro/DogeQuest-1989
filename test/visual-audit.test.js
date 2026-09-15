import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const app = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');
const artwork = readFileSync(new URL('../src/runner/puppy-artwork.js', import.meta.url), 'utf8');

test('clubhouse surfaces expose stable hooks for their intentional layouts', () => {
  assert.match(app, /content\.dataset\.category = clubhouseCategory/);
  assert.match(app, /masteryIntro\.className='mastery-intro'/);
  assert.match(app, /section\.dataset\.complete=String/);
  assert.match(app, /card\.className = "prize-card"/);
  assert.match(app, /card\.append\(cardHeading, meter, status\)/);
  assert.match(app, /row\.dataset\.kind = kind/);
});

test('the audit CSS keeps passport, prizes, help and focus treatments readable', () => {
  assert.match(css, /#overlay\[data-kind="kennel"\] \.modal-content #collection\[data-category="passport"\]/);
  assert.match(css, /#overlay\[data-kind="kennel"\] \.modal-content #collection\[data-category="prizes"\]/);
  assert.match(css, /grid-template-columns:\s*minmax\(104px, 108px\)/);
  assert.match(css, /\.collection-card img \{\s*width: 104px;/);
  assert.match(css, /\.prize-card\s*\{[\s\S]*?grid-template-areas:/);
  assert.match(css, /#collection\[data-category="prizes"\] \.prize-card \{\s*padding: 9px 14px;/);
  assert.match(css, /#overlay \.modal-actions \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(css, /#overlay\[data-kind="help"\] \.basic-moves/);
  assert.match(css, /outline: 2px solid #ffe0a0/);
  assert.match(css, /canvas:focus-visible \{[\s\S]*?outline: none;/);
  assert.match(css, /padding: 0 3px 24px/);
});

test('painted puppy poses inherit world atmosphere and ease frame transforms', () => {
  assert.match(artwork, /alphaTest: 0\.06/);
  assert.match(artwork, /fog: true/);
  assert.match(artwork, /toneMapped: true/);
  assert.match(artwork, /puppyInkAmount/);
  assert.match(artwork, /customProgramCacheKey = \(\) => 'puppy-ink-grade-v1'/);
  assert.match(artwork, /transitionDuration = reducedMotion \? 0 : \.11/);
  assert.match(artwork, /THREE\.MathUtils\.lerp\(poseTransitionFrom\.scaleX/);
});
