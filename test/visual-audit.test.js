import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const app = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');
const artwork = readFileSync(new URL('../src/runner/puppy-artwork.js', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../runner/index.html', import.meta.url), 'utf8');
const visibility = readFileSync(new URL('../src/runner/visibility.js', import.meta.url), 'utf8');

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
  assert.match(css, /#overlay\[data-kind="shop"\] \.modal-content #upgrades \{[\s\S]*?padding-bottom: 92px;/);
  assert.match(css, /#overlay\[data-kind="kennel"\] \.modal-content #collection:not\(\[data-category="passport"\]\):not\(\[data-category="prizes"\]\) \{[\s\S]*?padding-bottom: 92px;/);
  assert.match(css, /#overlay\[data-kind="help"\] \.modal-content \{[\s\S]*?padding-bottom: 92px;/);
  assert.match(css, /#collection\[data-category="passport"\],\s*#collection\[data-category="prizes"\]\s*\{\s*padding-bottom: 108px;/);
  assert.match(css, /#overlay \.modal-actions \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(css, /#overlay\[data-kind="help"\] \.basic-moves/);
  assert.match(css, /outline: 2px solid #ffe0a0/);
  assert.match(css, /canvas:focus-visible \{[\s\S]*?outline: none;/);
  assert.match(css, /padding: 0 3px 24px/);
  assert.match(css, /#mission-label-mobile \{ display: none; \}/);
  assert.match(css, /#mission-hud\[data-dock="mission-summary"\] #mission-label-mobile/);
  assert.match(css, /@media \(min-width: 701px\) \{\s*\.trail-tag \{ margin-top: 18px; \}/);
  assert.match(css, /#game\[data-state="menu"\] footer > span \{ display: none; \}/);
  assert.match(css, /#game\[data-state="menu"\] footer \{ justify-content: flex-end; pointer-events: none; \}/);
  assert.match(css, /#game\[data-state="menu"\] footer \.text-button \{ pointer-events: auto; \}/);
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
  assert.match(css, /#controls button\[data-action\]\.action-cue:not\(:disabled\)/);
  assert.match(css, /@keyframes action-cue-pulse/);
  assert.match(css, /#controls button\[data-action\]\.lane-cue:not\(:disabled\)/);
  assert.match(css, /@keyframes lane-cue-pulse/);
  assert.match(app, /updateActionCueControls\(traversalButtons, textOf\('cue'\)\)/);
  assert.match(app, /updateLaneCueControls\(turnButtons, textOf\('cue'\)\)/);
  assert.match(app, /boneStreakLabel\(run\.combo\)/);
  assert.match(app, /cleanFlowLabel\(run\.cleanStreak\)/);
  assert.match(app, /setProperty\('streak-progress', 'value', streak\.progress\)/);
  assert.match(app, /setHidden\('flow-detail', !showFlow\)/);
  assert.match(app, /setText\('flow-detail', showFlow \? flow\.detail : ''\)/);
  assert.match(app, /event === "near-miss"/);
  assert.match(app, /run\.nearMisses\)/);
  assert.match(shell, /id="streak" class="streak" hidden/);
  assert.match(shell, /id="streak-progress" max="10" value="0"/);
  assert.match(shell, /id="flow-detail" hidden/);
  assert.match(shell, /id="streak-kind">streak<\/small>/);
  assert.match(css, /#flow-detail \{/);
  assert.match(css, /#streak\[data-flow-only="true"\]/);
  assert.match(css, /\.streak\.streak-hot/);
  assert.match(css, /@keyframes streak-pop/);
  assert.match(readFileSync(new URL('../src/runner/traversal-controls.js', import.meta.url), 'utf8'), /export function updateActionCueControls/);
  assert.match(readFileSync(new URL('../src/runner/traversal-controls.js', import.meta.url), 'utf8'), /export function updateLaneCueControls/);
});

test('painted puppy poses inherit world atmosphere and ease frame transforms', () => {
  assert.match(artwork, /alphaTest: 0\.06/);
  assert.match(artwork, /fog: true/);
  assert.match(artwork, /toneMapped: true/);
  assert.match(artwork, /puppyInkAmount/);
  assert.match(artwork, /customProgramCacheKey = \(\) => 'puppy-ink-grade-v1'/);
  assert.match(artwork, /transitionDuration = reducedMotion \? 0 : \.11/);
  assert.match(artwork, /THREE\.MathUtils\.lerp\(poseTransitionFrom\.scaleX/);
  assert.match(artwork, /const awayMotion = motion && activeBasePose === 'away' \? Math\.sin\(time \* 8\.4 \+ \.18\)/);
  assert.match(artwork, /hangSwing \* \.12/);
  assert.match(artwork, /awayMotion \* \.038/);
});

test('hanging poses keep the raised-paw opening readable over dark scenery', () => {
  assert.match(artwork, /puppy-hang-opening-light/);
  assert.match(artwork, /hangOpening\.renderOrder = 2\.001/);
  assert.match(artwork, /gradient\.addColorStop\(0, 'rgba\(255,238,202,\.78\)'\)/);
  assert.match(artwork, /const openingVisible = activeBasePose === 'hang'/);
  assert.match(artwork, /hangOpening\.position\.set\(\s*lastPoseOutput\.x,\s*lastPoseOutput\.y \+ lastPoseOutput\.scaleY \* \.235/);
  assert.match(artwork, /hangOpening\.material\.opacity = reducedMotion \? \.58 : \.72/);
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
  assert.match(render, /menu-puppy-contrast/);
  assert.match(render, /menuContrast\.visible = hero/);
  assert.match(render, /menuGlow\.visible = hero/);
  assert.match(render, /if \(entry\.gateway && menu\) instanceMatrix\.scale\(bendScale\.set\(0,0,0\)\)/);
  assert.match(render, /const mobileHero = hero && camera\.aspect < \.85/);
  assert.match(render, /const compactHero = mobileHero && canvas\.clientHeight <= 600/);
  assert.match(render, /const heroOffsetX = mobileHero \? \(compactHero \? \.46 : \.16\) : 0/);
  assert.match(render, /const heroOffsetY = mobileHero \? \(compactHero \? \.08 : \.14\) : 0/);
  assert.match(render, /const heroVisualX = heroOffsetX \+ \(mobileHero \? \(compactHero \? \.24 : \.11\) : 0\)/);
  assert.match(render, /const heroVisualY = heroOffsetY \+ \(mobileHero \? \(compactHero \? \.08 : \.13\) : 0\)/);
  assert.match(render, /if \(hero\) dog\.scale\.multiplyScalar\(camera\.aspect < \.85 \? 1\.22 : 1\.09\)/);
  assert.match(render, /menuGlow\.position\.set\(heroVisualX, 1\.08 \+ heroVisualY, -\.08\)/);
  assert.match(render, /if \(entry\.gateway && camera\.aspect < \.85\)/);
  assert.match(render, /instanceMatrix\.scale\(bendScale\.set\(\.78, \.78, \.78\)\)/);
  assert.match(render, /camera\.lookAt\(mobile \? -1\.2 : -3\.5, mobile \? compact \? \.5 : 2\.08 : 1\.25, 0\)/);
  assert.match(render, /else dog\.scale\.multiplyScalar\(camera\.aspect < \.85 \? 1\.10 : 1\.04\)/);
  assert.match(render, /puppyFocus\.material\.opacity = reducedMotion \? \.10 : y > \.1 \? \.17 : \.15/);
});

test('gameplay keeps the painted puppy readable with a quiet scene-locked focus', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /runner-puppy-focus/);
  assert.match(render, /map: menuGlow\.material\.map/);
  assert.match(render, /const focusVisible = !menu && \(state === "playing" \|\| state === "paused"\)/);
  assert.match(render, /else dog\.scale\.multiplyScalar\(camera\.aspect < \.85 \? 1\.10 : 1\.04\)/);
  assert.match(render, /puppyFocus\.material\.opacity = reducedMotion \? \.10 : y > \.1 \? \.17 : \.15/);
});

test('the chase camera banks gently with turns without moving the playfield', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /cameraRoll = 0/);
  assert.match(render, /const routeBank = THREE\.MathUtils\.clamp\(look\.yaw \* \.07/);
  assert.match(render, /const targetRoll = !reducedMotion && cameraActive/);
  assert.match(render, /camera\.rotation\.z = cameraRoll/);
  assert.match(render, /cameraRoll,legAngles/);
});

test('corner landmarks make the turn direction clear without becoming giant signs', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /cornerArrowGeometry/);
  assert.match(render, /arrow\.name = 'corner-arrow'/);
  assert.match(render, /marker\.scale\.setScalar\(\.86\)/);
  assert.match(render, /const cornerReady = !menu && !run\.ended/);
  assert.match(render, /child\.userData\.cornerArrowBaseScale/);
  assert.match(visibility, /'corner-left', 'corner-right'/);
  assert.match(visibility, /export function ziplineSpineVisible/);
  assert.match(visibility, /export function ziplineSpineOpacity/);
  assert.match(render, /ziplineSpineVisible\(object,distance/);
  assert.match(render, /ziplineSpineOpacity\(object,distance/);
});

test('zipline hardware keeps the hang opening warm and readable', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /const cable = box\(tile, "#3b7774"/);
  assert.match(render, /const ziplineSpine = box\(station, "#d2aa70"/);
  assert.match(render, /ziplineSpine\.material\.color\?\.set\?\.\('#d2aa70'\)/);
  assert.match(render, /ziplineSpine\.material\.emissiveIntensity = \.18/);
});

test('trail collectibles get a visible authored scale and gentle pulse', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /const boneOutlineMaterial = new THREE\.MeshBasicMaterial/);
  assert.match(render, /const boneOutlineBatch=createInstanceBatch\(scene,boneGeometry,boneOutlineMaterial\)/);
  assert.match(render, /boneOutlineMatrix\.copy\(item\.matrix\)\.scale\(boneOutlineScale\)/);
  assert.match(render, /boneOutlineBatch\.begin\(\)/);
  assert.match(render, /boneOutlineBatch\.end\(\)/);
  assert.match(render, /const PICKUP_GLOW_COLORS = Object\.freeze/);
  assert.match(render, /pickupGlintCount < 3/);
  assert.match(render, /PICKUP_GLOW_COLORS\[object\.type\]/);
  assert.match(render, /templates\.bone\.scale\.setScalar\(1\.88\)/);
  assert.match(render, /const bonePulse = reducedMotion/);
  assert.match(render, /Math\.sin\(time \* 2\.6 \+ \(Number\(object\.id\) \|\| 0\) \* \.61\)/);
  assert.match(render, /let boneGlintCount = 0/);
  assert.match(render, /approach > 2 && approach < 42 && boneGlintCount < 6 && sparkCount < 192/);
  assert.match(render, /flashColor\.set\('#fff0b7'\)/);
  assert.match(render, /const cableUpcoming = !run\.zipline && !run\.ended && run\.objects\.some/);
  assert.match(render, /object\.airborne && cableUpcoming/);
  assert.match(render, /let aerialCueCount = 0/);
  assert.match(render, /aerialCueCount < 3/);
  assert.match(render, /flashColor\.set\('#a2ffde'\)/);
  assert.match(render, /let hazardCueCount = 0/);
  assert.match(render, /solidHazard = \['rock', 'log', 'arch', 'branch', 'gate'\]\.includes\(object\.type\)/);
  assert.match(render, /approach > 5 && approach < 32 && sparkCount < 192/);
  assert.match(render, /flashColor\.set\(overhead \? '#8ff2d2' : '#ffd38b'\)/);
  assert.match(render, /pickupPulse\(object\.type, time, object\.id, reducedMotion\)/);
  assert.match(render, /pawDust\(time\)/);
  assert.match(render, /flashColor\.set\('#b98a5e'\)/);
});

test('destinations carry a low-cost atmospheric signature without lane clutter', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  const areas = readFileSync(new URL('../src/runner/areas.js', import.meta.url), 'utf8');
  assert.match(render, /area-atmosphere-particles/);
  assert.match(render, /ATMOSPHERE_PARTICLE_COUNT/);
  assert.match(render, /sampleAtmosphereParticle\(index, distance, time, profile/);
  assert.match(render, /atmosphereParticles\.visible = atmosphereEnabled/);
  assert.match(render, /atmosphereParticles\.count = atmosphereEnabled/);
  assert.match(render, /const across = atmospherePoint\.x/);
  assert.match(areas, /motif:'fireflies'/);
  assert.match(areas, /motif:'leaves'/);
  assert.match(areas, /motif:'dust'/);
  assert.match(areas, /motif:'sparkles'/);
  assert.match(areas, /motif:'crystals'/);
  assert.match(areas, /motif:'spores'/);
});

test('ended mobile sheets keep the details affordance above the fixed action shelf', () => {
  assert.match(css, /#overlay\[data-kind="ended"\] \.modal-content \{\s*padding-bottom: 42px;/);
  assert.match(css, /#overlay\[data-kind="ended"\] \.modal h2 \{\s*font-size: 30px;/);
  assert.match(css, /#overlay\[data-kind="ended"\] #run-breakdown summary \{\s*min-height: 40px;/);
});
