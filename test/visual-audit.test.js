import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const app = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/runner/ui.css', import.meta.url), 'utf8');
const artwork = readFileSync(new URL('../src/runner/puppy-artwork.js', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../runner/index.html', import.meta.url), 'utf8');
const visibility = readFileSync(new URL('../src/runner/visibility.js', import.meta.url), 'utf8');
const laneTarget = readFileSync(new URL('../src/runner/lane-target.js', import.meta.url), 'utf8');

test('clubhouse surfaces expose stable hooks for their intentional layouts', () => {
  assert.match(shell, /id="streak-preview"/);
  assert.match(shell, /id="streak-help"/);
  assert.match(app, /adventureStreakSummary\(saved\.adventureStreak\)/);
  assert.match(app, /receipt\.adventureStreak/);
  assert.match(css, /\.trail-tag \.streak-preview/);
  assert.match(app, /content\.dataset\.category = clubhouseCategory/);
  assert.match(app, /masteryIntro\.className='mastery-intro'/);
  assert.match(app, /section\.dataset\.complete=String/);
  assert.match(app, /card\.className = "prize-card"/);
  assert.match(app, /card\.append\(cardHeading, meter, status\)/);
  assert.match(app, /row\.dataset\.kind = kind/);
});

test('the audit CSS keeps passport, prizes, help and focus treatments readable', () => {
  assert.match(app, /className='upgrade-preview'/);
  assert.match(app, /NOW \$\{upgradeEffect\(key, level\)\}/);
  assert.match(app, /className = 'upgrade-preview-rail'/);
  assert.match(app, /pip\.dataset\.next = String\(index === level \+ 1\)/);
  assert.match(css, /\.upgrade-copy \.upgrade-preview/);
  // The preview rail contains nested icon/pip spans. A broad `.upgrade-copy
  // span` rule forced those children back to block layout, stacking the three
  // level pips vertically on phones. Keep only the actual benefit span blocky
  // so the rail can remain flex/grid-driven.
  assert.match(css, /\.upgrade-copy > span:not\(\.upgrade-preview-rail\)/);
  assert.match(css, /\.upgrade-preview-rail\s*\{\s*display: flex/);
  assert.match(css, /\.upgrade-preview-pips\s*\{\s*display: grid/);
  assert.match(css, /\.upgrade-preview-rail\s*\{/);
  assert.match(css, /\.upgrade-preview-pips i\[data-filled="true"\]/);
  assert.match(css, /#overlay\[data-kind="kennel"\] \.modal-content #collection\[data-category="passport"\]/);
  assert.match(css, /#overlay\[data-kind="kennel"\] \.modal-content #collection\[data-category="prizes"\]/);
  assert.match(css, /grid-template-columns:\s*minmax\(104px, 108px\)/);
  assert.match(css, /\.collection-card img \{\s*width: 104px;/);
  assert.match(css, /background: radial-gradient\(circle at 50% 35%, #f4fffb 0 42%, #a8cfc3 100%\)/);
  assert.match(css, /filter: saturate\(1\.06\) contrast\(1\.04\)/);
  assert.match(css, /\.prize-card\s*\{[\s\S]*?grid-template-areas:/);
  assert.match(css, /#collection\[data-category="prizes"\] \.prize-card \{\s*padding: 9px 14px;/);
  // These five scroll regions used to reserve 92-108px for the action shelf.
  // `.modal-actions` is never positioned in the stylesheet, so it is a
  // normal-flow sibling *below* the scroll region and overlays nothing: the
  // reservation only produced dead space (116px under the last clubhouse card
  // at 390x844). They keep a plain breathing gap instead. See
  // test/clubhouse-layout.test.js for the guard that keeps it that way.
  for (const region of [
    /#collection\[data-category="prizes"\]\s*\{[^}]*?padding-bottom: (\d+)px;/,
    /#overlay\[data-kind="shop"\] \.modal-content #upgrades \{[^}]*?padding-bottom: (\d+)px;/,
    /#overlay\[data-kind="kennel"\] \.modal-content #collection:not\(\[data-category="passport"\]\):not\(\[data-category="prizes"\]\) \{[^}]*?padding-bottom: (\d+)px;/,
    /#overlay\[data-kind="help"\] \.modal-content \{[^}]*?padding-bottom: (\d+)px;/,
    /#collection\[data-category="passport"\],\s*#collection\[data-category="prizes"\]\s*\{\s*padding-bottom: (\d+)px;/,
  ]) {
    const found = css.match(region);
    assert.ok(found, `a scroll region lost its bottom gap: ${region}`);
    assert.ok(Number(found[1]) > 0 && Number(found[1]) <= 32,
      `expected a breathing gap, not a shelf reservation, got ${found[1]}px`);
  }
  assert.match(css, /#overlay \.modal-actions \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(css, /#overlay\[data-kind="help"\] \.basic-moves/);
  assert.match(css, /@media \(max-width: 430px\) and \(orientation: portrait\)[\s\S]*?#overlay\[data-kind="shop"\] \.modal-actions \{[\s\S]*?padding-top: 8px;[\s\S]*?padding-bottom: 14px;/);
  assert.match(css, /#overlay\[data-kind="shop"\] \.modal-actions > \.primary,[\s\S]*?#overlay\[data-kind="shop"\] \.modal-actions > \.text-button \{[\s\S]*?margin-top: 0;/);
  assert.match(css, /outline: 2px solid #ffe0a0/);
  assert.match(css, /canvas:focus-visible \{[\s\S]*?outline: none;/);
  assert.match(css, /#run-breakdown\s*\{[\s\S]*?overflow-wrap: anywhere;/);
  assert.match(css, /#run-breakdown p,[\s\S]*?#run-breakdown \.backup-actions\s*\{[\s\S]*?overflow-wrap: anywhere;/);
  assert.match(css, /#run-breakdown input\[type="url"\]\s*\{\s*min-width: 0;/);
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /function fitBadgeText\(context, value, x, y, maxWidth, size, color/);
  assert.match(render, /String\(definition\.effect \|\| ''\)\.toUpperCase\(\)/);
  assert.match(render, /\$\{String\(action \|\| 'COLLECT'\)\.toUpperCase\(\)\} · \$\{lane\}\$\{meters\}/);
  assert.match(css, /padding: 0 3px 24px/);
  assert.match(css, /#mission-label-mobile \{ display: none; \}/);
  assert.match(css, /#mission-hud\[data-dock="mission-summary"\] #mission-label-mobile/);
  assert.match(css, /#mission-hud\[data-dock="mission-summary"\]\[data-posture="jump"\],/);
  assert.match(css, /#mission-hud\[data-dock="mission-summary"\]\[data-posture="jump"\][\s\S]*?visibility: hidden;/);
  assert.match(css, /#mission-hud\[data-dock="mission-summary"\]\[data-posture="jump"\][\s\S]*?transform: none;/);
  assert.match(css, /@media \(max-width: 700px\) and \(orientation: portrait\)[\s\S]*?\.power-chip small \{\s*display: block;[\s\S]*?text-overflow: ellipsis;/);
  assert.match(app, /setData\('mission-hud', 'posture', posture\)/);
  assert.match(css, /@media \(min-width: 701px\) \{\s*\.trail-tag \{ margin-top: 18px; \}/);
  // Short desktop windows still need the challenge strip and daily-trail
  // action. Keep the contained menu scroll and explicit display rule guarded
  // so a future responsive cleanup cannot silently hide them again.
  assert.match(css, /@media \(min-width: 701px\) and \(max-height: 740px\)[\s\S]*?\.menu \{[\s\S]*?overflow-y: auto;/);
  assert.match(css, /@media \(min-width: 701px\) and \(max-height: 740px\)[\s\S]*?\.trail-tag \{[\s\S]*?display: flex;/);
  assert.match(css, /#game\[data-state="menu"\] footer > span \{ display: none; \}/);
  assert.match(css, /#game\[data-state="menu"\] footer \{ justify-content: flex-end; pointer-events: none; \}/);
  assert.match(css, /#game\[data-state="menu"\] footer \.text-button \{ pointer-events: auto; \}/);
  assert.match(css, /\.menu \{[\s\S]*?scrollbar-width: thin;/);
  assert.match(css, /scrollbar-color: #a9d9d04d transparent;/);
  assert.match(css, /\.menu::-webkit-scrollbar \{ width: 4px; \}/);
  assert.match(css, /\.menu::-webkit-scrollbar-track \{ background: transparent; \}/);
  assert.match(app, /setText\('mission-label-mobile', missionSummaryLabel/);
  assert.match(app, /\['warmup', 'escalation', 'spectacle', 'recovery'\]\.includes\(encounter\.phase\)/);
  // Encounter beats should be felt as well as seen. Keep the audio/haptic
  // wiring next to the director lookup so a future refactor cannot leave a
  // beautifully labelled phase silent on supported phones.
  assert.match(app, /phase:encounter\?\.phase/);
  assert.match(app, /haptics\.trigger\(`encounter-\$\{encounter\.phase\}`/);
  const soundscape = readFileSync(new URL('../src/runner/soundscape.js', import.meta.url), 'utf8');
  assert.match(soundscape, /export const ENCOUNTER_STINGERS=Object\.freeze\(\{/);
  assert.match(soundscape, /const STINGER_COOLDOWN\s*=\s*2\.4/);
  assert.match(app, /pickupNoticeFor\(run\)/);
  assert.match(app, /setData\('pickup-guide', 'state', notice \? 'recent' : 'upcoming'\)/);
  assert.match(app, /setAttribute\('bone-counter', 'aria-label', `Bones collected: \$\{boneCount\}`\)/);
  assert.match(app, /const busy = Number\(run\?\.y\) > 0\.1/);
  assert.match(app, /Boolean\(run\?\.zipline \|\| run\?\.raft \|\| run\?\.minecart\)/);
  const minecart = readFileSync(new URL('../src/runner/minecart.js', import.meta.url), 'utf8');
  assert.match(minecart, /minecartChoiceFor/);
  assert.match(minecart, /minecartChoice === 'gem'/);
  assert.match(minecart, /rewardLane/);
  assert.match(minecart, /Gem shortcut/);
  assert.match(readFileSync(new URL('../src/runner/guidance.js', import.meta.url), 'utf8'), /CART · CHOOSE GEM OR BONES/);
  assert.match(readFileSync(new URL('../src/runner/power-hud.js', import.meta.url), 'utf8'), /CART · GEM \/ BONE/);
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
  assert.match(css, /#pickup-guide\[data-state="recent"\]/);
  assert.match(css, /@keyframes lane-cue-pulse/);
  assert.match(app, /updateActionCueControls\(traversalButtons, textOf\('cue'\)\)/);
  assert.match(app, /updateLaneCueControls\(turnButtons, textOf\('cue'\)\)/);
  assert.match(shell, /id="encounter-progress" max="1" value="0" hidden/);
  assert.match(shell, /id="pickup-receipt" hidden/);
  assert.match(shell, /id="run-next-hint" hidden/);
  assert.match(app, /function renderPickupReceipt\(run\)/);
  assert.match(app, /pickupReceiptItems\(run\)/);
  assert.match(app, /nextHintNode.textContent = nextHint/);
  assert.match(app, /setProperty\('run-breakdown', 'open', false\)/);
  assert.match(app, /const runBreakdown = \$\("run-breakdown"\);\s*runBreakdown\?\.addEventListener/);
  assert.doesNotMatch(app, /\$\("run-highlights"\)\.textContent = nextMasteryHint/);
  assert.match(app, /meter\.value = Math\.max\(0, Math\.min\(1, Number\(encounter\.progress\) \|\| 0\)\)/);
  assert.match(css, /#encounter-progress\s*\{[\s\S]*?height: 3px/);
  assert.match(css, /#encounter-beat\[data-phase="escalation"\]/);
  assert.match(css, /#encounter-progress\[data-phase="spectacle"\]/);
  assert.match(css, /#encounter-progress\[data-phase="escalation"\]/);
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
  assert.match(laneTarget, /export function laneTargetFor/);
  assert.match(laneTarget, /source: recommendation\?\.source \?\? 'steady'/);
  assert.match(readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8'), /laneTargetGroup\.name = 'runner-lane-targets'/);
  assert.match(readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8'), /lane-target-pad-/);
  assert.match(readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8'), /lane-target-arrow-/);
  assert.match(readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8'), /const laneInfo = laneTargetFor\(run\)/);
  const renderLane = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(renderLane, /new THREE\.TorusGeometry\(0\.94, 0\.042, 6, 48\)/);
  assert.match(renderLane, /color: '#baffea', transparent: true, opacity: \.84/);
  assert.match(renderLane, /pad\.scale\.set\(\.86, \.035, \.58\)/);
  // Spectacle beats get a small world-space arrival cue, not another HUD
  // message. Keep the cue tied to authored set pieces and the director's
  // colour vocabulary so a future renderer cleanup cannot flatten every area
  // back into the same undifferentiated approach.
  assert.match(renderLane, /const SPECTACLE_BEACON_COLORS = Object\.freeze/);
  assert.match(renderLane, /function spectacleBeaconColor\(title\)/);
  assert.match(renderLane, /run\.encounter\?\.phase === 'spectacle'/);
  assert.match(renderLane, /const spectacleObject = object\.bridgeCollapse/);
  assert.match(renderLane, /const color = spectacleBeaconColor\(run\.encounter\?\.title\)/);
  assert.match(renderLane, /Three floating lozenges read as an arrival marker/);
});

test('painted puppy poses retain authored color and ease frame transforms', () => {
  assert.match(artwork, /color: '#ffffff'/);
  assert.match(artwork, /texture\.colorSpace = THREE\.SRGBColorSpace/);
  assert.match(artwork, /alphaTest: 0\.12/);
  assert.match(artwork, /fog: false/);
  assert.match(artwork, /toneMapped: false/);
  assert.match(artwork, /puppyInkAmount/);
  assert.match(artwork, /diffuseColor\.rgb = clamp\(\(diffuseColor\.rgb - 0\.42\) \* 1\.15 \+ 0\.42/);
  assert.match(artwork, /mix\(vec3\(puppyInkLuma\), diffuseColor\.rgb, 1\.18\)/);
  assert.match(artwork, /puppyMidtoneLift = smoothstep\(0\.08, 0\.76, puppyInkLuma\) \* 0\.085/);
  assert.match(artwork, /puppyWarmth = max\(diffuseColor\.r - diffuseColor\.b, 0\.0\)[\s\S]*?smoothstep\(0\.12, 0\.86, puppyInkLuma\) \* 0\.11/);
  assert.match(artwork, /puppyWarmth \* 0\.78/);
  assert.match(artwork, /puppyWarmth \* 0\.42/);
  assert.match(artwork, /sprite\.material\.color\.setRGB\(1, 1, 1\)/);
  assert.match(artwork, /\* 0\.16/);
  assert.match(artwork, /customProgramCacheKey = \(\) => 'puppy-ink-grade-v2'/);
  assert.match(artwork, /transitionDuration = reducedMotion \? 0 : \.11/);
  assert.match(artwork, /THREE\.MathUtils\.lerp\(poseTransitionFrom\.scaleX/);
  assert.match(artwork, /const awayMotion = motion && activeBasePose === 'away' \? Math\.sin\(time \* 8\.4 \+ \.18\)/);
  assert.match(artwork, /hangSwing \* \.12/);
  assert.match(artwork, /awayMotion \* \.038/);
});

test('hanging poses keep the raised-paw opening readable over dark scenery', () => {
  assert.match(artwork, /puppy-hang-opening-light/);
  assert.match(artwork, /hangOpening\.renderOrder = 2\.001/);
  assert.match(artwork, /gradient\.addColorStop\(0, 'rgba\(239,250,248,\.68\)'\)/);
  assert.match(artwork, /hangOpeningCanvas\)[\s\S]*?fog: false/);
  assert.match(artwork, /toneMapped: false/);
  assert.match(artwork, /const openingVisible = activeBasePose === 'hang'/);
  assert.match(artwork, /hangOpening\.position\.set\(\s*lastPoseOutput\.x,\s*lastPoseOutput\.y \+ lastPoseOutput\.scaleY \* \.235/);
  assert.match(artwork, /hangOpening\.material\.opacity = reducedMotion \? \.50 : \.62/);
});

test('the live runner never layers Mochi’s legacy polygon rig under the paintings', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /mochi\.group\.visible = false/);
  assert.doesNotMatch(render, /mochi\.group\.visible = isMochi/);
  assert.match(render, /ghostArtwork\.name = 'painted-puppy-ghost'/);
  assert.match(render, /rasterArtwork\.spriteForPose\?\.\(ghostSample\.posture\)/);
  assert.match(render, /ghostWake\.name = 'personal-ghost-wake'/);
  assert.match(render, /ghostWake\.children\.forEach/);
  assert.doesNotMatch(render, /const ghostPart = \(geometry, material/);
  assert.match(app, /GHOST · 24M AHEAD · RACE YOUR BEST/);
  assert.match(css, /#ghost-status\s*\{[\s\S]*?font-size: 9px;/);
  assert.match(render, /camera\.fov=48;camera\.aspect = 1; camera\.position\.set\(0,2\.0,3\.1\)/);
});

test('the mobile menu keeps the featured puppy visible without competing with the title', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /menu-puppy-spotlight/);
  assert.match(render, /menu-puppy-contrast/);
  assert.match(render, /menuGlowGradient\.addColorStop\(0, "rgba\(239,250,248,\.68\)"\)/);
  assert.doesNotMatch(render, /rgba\(255,239,184,\.68\)/);
  assert.match(render, /menuContrast\.visible = hero/);
  assert.match(render, /menuGlow\.visible = hero/);
  assert.match(render, /if \(entry\.gateway && menu\) instanceMatrix\.scale\(bendScale\.set\(0,0,0\)\)/);
  assert.match(render, /const mobileHero = hero && camera\.aspect < \.85/);
  assert.match(render, /const compactHero = mobileHero && canvas\.clientHeight <= 600/);
  assert.match(render, /const shortHero = mobileHero && !compactHero && canvas\.clientHeight <= 700/);
  assert.match(render, /const heroOffsetX = mobileHero \? \(compactHero \? \.58 : \.46\) : 0/);
  assert.match(render, /const heroOffsetY = mobileHero \? \(compactHero \? \.44 : shortHero \? 3\.25 : 2\.35\) : 0/);
  assert.match(render, /const heroVisualX = heroOffsetX \+ \(mobileHero \? \(compactHero \? \.22 : shortHero \? \.55 : \.24\) : 0\)/);
  assert.match(render, /const heroVisualY = heroOffsetY \+ \(mobileHero \? \(compactHero \? \.08 : 0\) : 0\)/);
  assert.match(render, /const menuHeroScale = hero && mobileHero && !compactHero \? \.65 : 1/);
  assert.match(render, /if \(hero\) dog\.scale\.multiplyScalar\(menuHeroScale \* \(compactHero \? 1\.08 : camera\.aspect < \.85 \? 1\.10 : 1\.09\)\)/);
  assert.match(render, /menuGlow\.position\.set\(heroVisualX, 1\.08 \+ heroVisualY, -\.08\)/);
  assert.match(render, /if \(entry\.gateway && camera\.aspect < \.85\)/);
  assert.match(render, /instanceMatrix\.scale\(bendScale\.set\(\.78, \.78, \.78\)\)/);
  assert.match(render, /camera\.lookAt\(mobile \? -1\.2 : -3\.5, mobile \? compact \? \.5 : 2\.08 : 1\.25, 0\)/);
  assert.match(render, /else dog\.scale\.multiplyScalar\(camera\.aspect < \.85 \? 1\.16 : 1\.04\)/);
  assert.match(render, /puppyFocus\.material\.opacity = reducedMotion \? \.14 : y > \.1 \? \.24 : \.21/);
  assert.match(css, /#game\[data-state="menu"\] \.vignette/);
  assert.match(css, /#102a2814 50%, transparent 70%/);
  assert.match(css, /\.intro \{\s*font-size: 12px;[\s\S]*?max-width: min\(190px, 54vw\);[\s\S]*?text-wrap: balance;/);
  assert.match(css, /#game\[data-state="playing"\] \.vignette[\s\S]*?transparent 0%,[\s\S]*?transparent 24%,[\s\S]*?#102a2824 72%/);
  assert.match(css, /near-camera character out of a brown\/green screen wash/);
});

test('gameplay keeps the painted puppy readable with a quiet scene-locked focus', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /runner-puppy-focus/);
  assert.match(render, /map: menuContrast\.material\.map/);
  assert.match(render, /const focusVisible = !menu && \(state === "playing" \|\| state === "paused"\)/);
  assert.match(render, /else dog\.scale\.multiplyScalar\(camera\.aspect < \.85 \? 1\.16 : 1\.04\)/);
  assert.match(render, /puppyFocus\.material\.opacity = reducedMotion \? \.14 : y > \.1 \? \.24 : \.21/);
});

test('scenery batches receive bounded pass variation without affecting road geometry', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  const areas = readFileSync(new URL('../src/runner/areas.js', import.meta.url), 'utf8');
  assert.match(areas, /export function landmarkVariation/);
  assert.match(render, /const variation = landmarkVariation\(/);
  assert.match(render, /if \(!entry\.road && !entry\.gateway &&/);
  assert.match(render, /landmarkVariationScale\.setScalar\(variation\.scale\)/);
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
  assert.match(render, /const cable = box\(tile, "#6fcfbd"/);
  assert.match(render, /const cableMaterial = new THREE\.MeshBasicMaterial\([\s\S]*?vertexColors: true,[\s\S]*?toneMapped: false/);
  assert.match(render, /entries\.filter\(entry=>entry\.road&&!entry\.terrain&&entry\.cable\)/);
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
  assert.match(render, /const pickupEffect = \['magnet','shield','gem','double','heart','gift','zoomies','relic'\]\.includes\(effect\.type\)/);
  assert.match(render, /const sparkLimit = pickupEffect \? 8 : 6/);
  assert.match(render, /Collection feedback is a brighter, slightly wider burst/);
  assert.match(render, /pickupPulse\(object\.type, time, object\.id, reducedMotion\)/);
  assert.match(render, /pickupBob\(object\.type, time, object\.id, reducedMotion\)/);
  assert.match(render, /templates\[type\]\.scale\.multiplyScalar\(1\.52\)/);
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

test('each destination adds a sparse, named silhouette instead of only recoloring scenery', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  const areas = readFileSync(new URL('../src/runner/areas.js', import.meta.url), 'utf8');
  assert.match(render, /const areaLighting=AREAS\.map/);
  assert.match(render, /hemisphere\.groundColor\.copy\(hemisphereGroundColor\)/);
  assert.match(render, /sun\.intensity=THREE\.MathUtils\.lerp/);
  assert.match(areas, /lighting:\{sky:'#ddfff5',ground:'#173d35'/);
  assert.match(areas, /lighting:\{sky:'#d0d0ff',ground:'#191a36'/);
  assert.match(render, /signature: AREAS\[area\]\.landmark/);
  assert.match(render, /for \(let area = 0; area < AREAS\.length; area\+\+\) for \(let variant = 0; variant < 4; variant\+\+\)/);
  assert.match(render, /variant: 3/);
  assert.match(render, /The four variants repeat at different depths/);
  assert.match(areas, /landmark:'firefly-tree'/);
  assert.match(areas, /landmark:'bamboo-lantern'/);
  assert.match(areas, /landmark:'redrock-stack'/);
  assert.match(areas, /landmark:'oasis-palms'/);
  assert.match(areas, /landmark:'crystal-spires'/);
  assert.match(areas, /landmark:'mooncap-ring'/);
});

test('quiet trail stretches carry area-specific shoulder motifs without entering the lanes', () => {
  const render = readFileSync(new URL('../src/runner/render.js', import.meta.url), 'utf8');
  assert.match(render, /Low, readable trail motifs give the player something to discover/);
  assert.match(render, /trailMotif: true/);
  assert.match(render, /const shoulder = LANDMARK_SHOULDER_MIN \+ \.18/);
  assert.match(render, /for \(let area = 0; area < AREAS\.length; area\+\+\) for \(let i = 0; i < 8; i\+\+\)/);
  assert.match(render, /Sunleaf: a small fern fan/);
  assert.match(render, /Bamboo: paired shoots/);
  assert.match(render, /Redrock: three warm pebbles/);
  assert.match(render, /Oasis: three stepping stones/);
  assert.match(render, /Crystal Reach: two low shards/);
  assert.match(render, /Mooncap: a pair of tiny caps/);
});

test('ended mobile sheets keep the details affordance above the fixed action shelf', () => {
  assert.match(css, /#overlay\[data-kind="ended"\] \.modal-content \{\s*padding-bottom: 42px;/);
  assert.match(css, /#overlay\[data-kind="ended"\] \.modal h2 \{\s*font-size: 30px;/);
  assert.match(css, /#overlay\[data-kind="ended"\] #run-breakdown summary \{\s*min-height: 40px;/);
});
