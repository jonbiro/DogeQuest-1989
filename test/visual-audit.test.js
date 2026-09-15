import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const app = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');
const artwork = readFileSync(new URL('../src/runner/puppy-artwork.js', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../runner/index.html', import.meta.url), 'utf8');

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
  assert.match(css, /#collection\[data-category="prizes"\]\s*\{[\s\S]*?padding-bottom: 92px;/);
  assert.match(css, /#collection\[data-category="passport"\],\s*#collection\[data-category="prizes"\]\s*\{\s*padding-bottom: 108px;/);
  assert.match(css, /#overlay \.modal-actions \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(css, /#overlay\[data-kind="help"\] \.basic-moves/);
  assert.match(css, /outline: 2px solid #ffe0a0/);
  assert.match(css, /canvas:focus-visible \{[\s\S]*?outline: none;/);
  assert.match(css, /padding: 0 3px 24px/);
  assert.match(css, /#mission-label-mobile \{ display: none; \}/);
  assert.match(css, /#mission-hud\[data-dock="mission-summary"\] #mission-label-mobile/);
  assert.match(app, /setText\('mission-label-mobile', missionSummaryLabel/);
  assert.match(css, /#overlay\[data-kind="help"\] \.basic-moves img \{ grid-column: 1; grid-row: 1 \/ span 3; width: 84px; height: 70px;/);
  assert.match(css, /@media \(max-width: 430px\) and \(orientation: portrait\)[\s\S]*?#overlay\[data-kind="help"\] \.basic-moves \{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /#overlay\[data-kind="help"\] \.basic-moves p \{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(app, /Tap LEFT or RIGHT to steer\. Tap JUMP over logs and gaps, or SLIDE under overhead gates\. Swipes are optional/);
  assert.match(shell, /Tap LEFT or RIGHT for one lane\. One short swipe also works/);
  assert.match(shell, /Tap JUMP over logs and gaps\. Swipe up is optional/);
  assert.match(shell, /Tap SLIDE under overhead gates\. Swipe down is optional/);
  assert.match(app, /fetchButton\.style\?\.setProperty\?\.\('--fetch-progress'/);
  assert.match(app, /fetchButton\.dataset\.fetchState/);
  assert.match(css, /#controls #fetch::before/);
  assert.match(css, /conic-gradient\(from -90deg, #8fe7db var\(--fetch-progress\)/);
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

test('the live runner never layers Mochi’s legacy polygon rig under the paintings', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /mochi\.group\.visible = false/);
  assert.doesNotMatch(render, /mochi\.group\.visible = isMochi/);
  assert.match(render, /camera\.fov=48;camera\.aspect = 1; camera\.position\.set\(0,2\.0,3\.1\)/);
});

test('the mobile menu keeps the featured puppy visible without competing with the title', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /menu-puppy-spotlight/);
  assert.match(render, /menuGlow\.visible = state === "menu"/);
  assert.match(render, /if \(menu\) dog\.scale\.multiplyScalar\(camera\.aspect < \.85 \? 1\.1 : 1\.06\)/);
  assert.match(render, /camera\.lookAt\(mobile \? -1\.2 : -3\.5, mobile \? compact \? \.5 : 2\.08 : 1\.25, 0\)/);
});

test('gameplay keeps the painted puppy readable with a quiet scene-locked focus', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /runner-puppy-focus/);
  assert.match(render, /map: menuGlow\.material\.map/);
  assert.match(render, /const focusVisible = !menu && \(state === "playing" \|\| state === "paused"\)/);
  assert.match(render, /else dog\.scale\.multiplyScalar\(camera\.aspect < \.85 \? 1\.05 : 1\.02\)/);
  assert.match(render, /puppyFocus\.material\.opacity = reducedMotion \? \.10 : y > \.1 \? \.15 : \.13/);
});

test('trail collectibles get a visible authored scale and gentle pulse', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /templates\.bone\.scale\.setScalar\(1\.88\)/);
  assert.match(render, /const bonePulse = reducedMotion/);
  assert.match(render, /Math\.sin\(time \* 2\.6 \+ \(Number\(object\.id\) \|\| 0\) \* \.61\)/);
  assert.match(render, /let boneGlintCount = 0/);
  assert.match(render, /approach > 2 && approach < 42 && boneGlintCount < 6 && sparkCount < 192/);
  assert.match(render, /flashColor\.set\('#fff0b7'\)/);
  assert.match(render, /let hazardCueCount = 0/);
  assert.match(render, /solidHazard = \['rock', 'log', 'arch', 'branch', 'gate'\]\.includes\(object\.type\)/);
  assert.match(render, /approach > 5 && approach < 32 && sparkCount < 192/);
  assert.match(render, /flashColor\.set\(overhead \? '#8ff2d2' : '#ffd38b'\)/);
  assert.match(render, /pickupPulse\(object\.type, time, object\.id, reducedMotion\)/);
  assert.match(render, /pawDust\(time\)/);
  assert.match(render, /flashColor\.set\('#b98a5e'\)/);
});

test('ended mobile sheets keep the details affordance above the fixed action shelf', () => {
  assert.match(css, /#overlay\[data-kind="ended"\] \.modal-content \{\s*padding-bottom: 42px;/);
  assert.match(css, /#overlay\[data-kind="ended"\] \.modal h2 \{\s*font-size: 30px;/);
  assert.match(css, /#overlay\[data-kind="ended"\] #run-breakdown summary \{\s*min-height: 40px;/);
});
