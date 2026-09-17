import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');
const marker = '/* Portrait phones need the lower trail for reaction time.';

test('portrait run notices use one upper rail above the reaction zone', () => {
  const rail = css.slice(css.lastIndexOf(marker));
  assert.ok(rail.startsWith(marker), 'the mobile rail must remain the final cascade layer');
  assert.match(rail, /@media \(max-width: 700px\) and \(orientation: portrait\)/);
  assert.match(rail, /#mission-hud\s*\{[\s\S]*?top:\s*calc\(236px \+ var\(--safe-top\)\);[\s\S]*?bottom:\s*auto;/);
  assert.match(rail, /#mission-hud\[data-dock="mission-summary"\][\s\S]*?top:\s*calc\(230px \+ var\(--safe-top\)\);/);
  assert.match(rail, /#mission-hud\[data-dock="cue"\],[\s\S]*?#mission-hud\[data-dock="toast"\][\s\S]*?transform:\s*translateX\(-50%\);/);
  assert.match(rail, /#pickup-guide\s*\{\s*top:\s*180px;/);
});

test('the portrait rail leaves the thumb controls in the lower dock', () => {
  const rail = css.slice(css.lastIndexOf(marker));
  assert.doesNotMatch(rail, /#controls\s*\{/,
    'the upper-rail override must not move or shrink the action controls');
  assert.match(rail, /#mission-hud\[data-dock="toast"\][\s\S]*?width:\s*min\(340px, calc\(100vw - 28px\)\)/);
});
