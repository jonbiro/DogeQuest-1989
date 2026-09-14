import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../runner/index.html', import.meta.url), 'utf8');

// Selectors whose elements sit over the live WebGL canvas for the whole of a
// run. On iOS a blurred backdrop over an animating GL surface forces the
// compositor to read back and blur that region every frame: continuous GPU
// work plus an extra surface, on exactly the devices that lose the context.
// Anything that is only shown while the run is paused or finished may blur.
const OVER_LIVE_CANVAS = ['#controls', '.icon-button', '#hud', '#mission-hud', '#touch-ghost', '#power'];

function ruleBodies(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...css.matchAll(new RegExp(`(^|[,{}])\\s*${escaped}\\s*\\{([^}]*)\\}`, 'gm'))]
    .map(match => match[2]);
}

test('nothing drawn over a running trail asks the compositor for a backdrop blur', () => {
  for (const selector of OVER_LIVE_CANVAS) {
    for (const body of ruleBodies(selector)) {
      const blur = body.match(/backdrop-filter:\s*([^;]+)/);
      if (!blur) continue;
      assert.equal(blur[1].trim(), 'none',
        `${selector} sits over the live canvas and must not blur its backdrop`);
    }
  }
});

test('the paused and finished overlay may still blur, because the trail is not animating', () => {
  // This is the counterpart to the rule above: the check must be specific, not
  // a blanket ban that would flatten the overlay's depth for no benefit.
  const overlay = ruleBodies('.overlay').join('\n');
  assert.match(overlay, /backdrop-filter:\s*blur/, 'the modal overlay keeps its blur');
  // ...and it is genuinely removed from rendering during play, so it costs
  // nothing then.
  assert.match(html, /id="overlay"[\s\S]{0,200}?\bhidden\b/, 'the overlay starts hidden');
  assert.match(css, /\[hidden\][^{]*\{[^}]*display:\s*none/,
    'the hidden attribute removes an element from rendering');
});

test('the control panel stays legible without the blur it used to rely on', () => {
  const controls = ruleBodies('#controls').join('\n');
  const background = controls.match(/background:\s*([^;]+)/)?.[1] ?? '';
  const stops = [...background.matchAll(/#[0-9a-f]{6}([0-9a-f]{2})\b/g)].map(m => parseInt(m[1], 16));
  assert.ok(stops.length >= 2, 'the panel still paints its own background');
  // Removing a backdrop blur must not leave the panel translucent enough that
  // the trail shows through the labels.
  for (const alpha of stops)
    assert.ok(alpha >= 0xf0, `panel background stop ${alpha.toString(16)} is too transparent`);
});
