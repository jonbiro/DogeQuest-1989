import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');
const marker = '/* Portrait phones need the lower trail for reaction time.';
const sightlineMarker = '/* -------------------------------------------------------------------------\n   Mobile gameplay HUD: a clear sightline';

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

test('portrait gameplay keeps the road clear with one compact status rail', () => {
  const rail = css.slice(css.lastIndexOf(sightlineMarker));
  assert.ok(rail.startsWith(sightlineMarker),
    'the clear-sightline treatment must remain the final mobile gameplay layer');
  assert.match(rail, /#game\[data-state="playing"\] #hud\s*\{[\s\S]*?grid-template-areas:\s*[\s\S]*?"score stats"[\s\S]*?"power guide"/);
  assert.match(rail, /#game\[data-state="playing"\] #hud \.score\s*\{[\s\S]*?height:\s*40px/);
  assert.match(rail, /#game\[data-state="playing"\] #area-rhythm,[\s\S]*?#game\[data-state="playing"\] #ghost-status\s*\{[\s\S]*?display:\s*none !important;/);
  assert.match(rail, /#game\[data-state="playing"\] #power \.power-chip small,[\s\S]*?#game\[data-state="playing"\] #power \.power-chip progress\s*\{[\s\S]*?display:\s*none !important;/);
  assert.match(rail, /#game\[data-state="playing"\] #pickup-guide\s*\{[\s\S]*?height:\s*30px/);
  assert.match(rail, /#game\[data-state="playing"\] #mission-hud\[data-dock="mission-summary"\]\s*\{[\s\S]*?display:\s*none !important;/);
  assert.match(rail, /#game\[data-state="playing"\] #mission-hud\[data-dock="cue"\],[\s\S]*?#game\[data-state="playing"\] #mission-hud\[data-dock="toast"\]\s*\{[\s\S]*?max-height:\s*38px/);
});
