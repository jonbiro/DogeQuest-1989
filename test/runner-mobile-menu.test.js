import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');
const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
const marker = 'Recording audit: portrait camp composition';

test('portrait camp reserves separate pockets for copy, puppy and actions', () => {
  const layer = css.slice(css.lastIndexOf(marker));
  assert.ok(layer.startsWith(marker), 'the recording audit layer must remain the final menu cascade');
  assert.match(layer, /#game\[data-state="menu"\] h1[\s\S]*?font-size:\s*clamp\(42px, 11\.5vw, 48px\)/);
  assert.match(layer, /#game\[data-state="menu"\] h1[\s\S]*?white-space:\s*nowrap/);
  assert.match(layer, /#game\[data-state="menu"\] \.touch-launch-hint[\s\S]*?max-width:\s*210px/);
  assert.match(layer, /#game\[data-state="menu"\] \.start-actions[\s\S]*?margin-top:\s*8px/);
  assert.match(layer, /#game\[data-state="menu"\] \.trail-tag[\s\S]*?display:\s*grid/);
  assert.match(layer, /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(layer, /#game\[data-state="menu"\] #daily-camp[\s\S]*?grid-column:\s*2/);
  assert.match(layer, /#game\[data-state="menu"\] \.back-link[\s\S]*?width:\s*94px/);
  assert.match(layer, /#game\[data-state="menu"\] \.back-link[\s\S]*?white-space:\s*nowrap/);
});

test('the portrait menu moves Less motion out of the challenge card', () => {
  const layer = css.slice(css.lastIndexOf(marker));
  assert.match(layer, /#game\[data-state="menu"\] footer[\s\S]*?top:\s*calc\(82px \+ var\(--safe-top\)\)/);
  assert.match(layer, /#game\[data-state="menu"\] footer[\s\S]*?bottom:\s*auto/);
  assert.match(layer, /#game\[data-state="menu"\] footer[\s\S]*?z-index:\s*4/);
  assert.match(layer, /@media \(max-width: 700px\) and \(orientation: portrait\) and \(max-height: 700px\)[\s\S]*?top:\s*calc\(66px \+ var\(--safe-top\)\)/);
  assert.doesNotMatch(layer, /#game\[data-state="menu"\] footer[\s\S]*?position:\s*fixed/);
});

test('the normal portrait hero uses a smaller, higher Mochi stage mark', () => {
  assert.match(render, /const heroOffsetY = mobileHero \? \(compactHero \? \.44 : shortHero \? 3\.25 : 2\.35\) : 0/);
  assert.match(render, /const shortHero = mobileHero && !compactHero && canvas\.clientHeight <= 700/);
  assert.match(render, /const heroVisualX = heroOffsetX \+ \(mobileHero \? \(compactHero \? \.22 : shortHero \? \.55 : \.24\) : 0\)/);
  assert.match(render, /const menuHeroScale = hero && mobileHero && !compactHero \? \.65 : 1/);
});
