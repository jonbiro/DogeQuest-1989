import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

test('a draw failure enters graphics recovery instead of stopping the frame loop', () => {
  const source = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
  const start = source.indexOf('function drawScene(');
  const end = source.indexOf('let currentMission =', start);
  assert.ok(start >= 0 && end > start);
  let recovered = 0;
  const context = {
    graphicsReady: true,
    view: {draw() { throw new Error('mobile draw rejected'); }},
    graphicsError() { recovered++; context.graphicsReady = false; },
  };
  assert.doesNotThrow(() => runInNewContext(
    `${source.slice(start, end)};drawScene({}, 1, 'playing', false, .016, 1, {}, .016);`,
    context,
  ));
  assert.equal(recovered, 1);
  assert.equal(context.graphicsReady, false);
});

test('a draw failure with a lost GL context stays on the recoverable path', () => {
  const source = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
  const start = source.indexOf('function drawScene(');
  const end = source.indexOf('let currentMission =', start);
  let contextPauses = 0;
  let fatalErrors = 0;
  const context = {
    graphicsReady: true,
    view: {draw() { throw new Error('context lost before DOM event'); }, contextLost() { return true; }},
    handleContextLost() { contextPauses++; },
    graphicsError() { fatalErrors++; },
  };
  runInNewContext(
    `${source.slice(start, end)};drawScene({}, 1, 'playing', false, .016, 1, {}, .016);`,
    context,
  );
  assert.equal(contextPauses, 1);
  assert.equal(fatalErrors, 0);
});

test('menu and help rendering share the guarded draw path', () => {
  const source = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
  assert.equal((source.match(/\bview\.draw\(/g) || []).length, 1,
    'only drawScene should call the renderer directly');
});

test('the animation loop keeps scheduling frames after a mobile runtime fault', () => {
  const source = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
  const start = source.indexOf('function frame(now) {');
  const end = source.indexOf('if(graphicsReady)', start);
  assert.ok(start >= 0 && end > start);
  const frame = source.slice(start, end);
  assert.match(frame, /try\s*\{/);
  assert.match(frame, /catch\s*\(error\)\s*\{[\s\S]*graphicsError\('frame-error',/);
  assert.match(frame, /finally\s*\{[\s\S]*requestAnimationFrame\(frame\);/);
});

test('stale shells cannot make the shared text helper throw on a missing node', () => {
  const source = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
  const start = source.indexOf('function setText(');
  const end = source.indexOf('function toast(', start);
  assert.ok(start >= 0 && end > start);
  assert.doesNotThrow(() => runInNewContext(
    `${source.slice(start, end)};setText('cue', 'safe retry');`,
    { $: () => null },
  ));
});

test('the HUD skips an absent Fetch button from an older shell', () => {
  const source = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
  const start = source.indexOf("const fetchButton = $('fetch');");
  const end = source.indexOf('const turn = turnPrompt', start);
  assert.ok(start >= 0 && end > start);
  assert.match(source.slice(start, end), /if\s*\(fetchButton\)\s*\{/);
});

test('a stale shell without dock message nodes cannot crash the frame', () => {
  const source = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
  const start = source.indexOf('function textOf(');
  const end = source.indexOf('// syncDock runs every frame', start);
  assert.ok(start >= 0 && end > start);
  const context = {
    $: () => null,
    dockMode: () => '',
    missionAnnounced: false,
    activeCourse: () => false,
    run: {touchOverdrag: false, touchFeedback: ''},
    state: 'playing',
    pointer: null,
    touchGestureCoach: () => '',
    touchCoach: () => '',
    touchCoachVisible: () => false,
  };
  assert.doesNotThrow(() => runInNewContext(
    `${source.slice(start, end)};syncDock();`, context,
  ));
});

test('optional HUD failures are recorded as UI causes without entering graphics rescue', () => {
  const source = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
  const start = source.indexOf('function setData(');
  const end = source.indexOf('function toggleClass(', start);
  assert.ok(start >= 0 && end > start);
  const game = {dataset: {}};
  const context = {
    $: id => id === 'game' ? game : null,
    graphicsDiagnostic: (reason, error) => `${reason}: ${error.message}`,
    withLastInput: error => error,
  };
  const result = runInNewContext(
    `${source.slice(start, end)};optionalFrameUi('turn-controls', () => { throw new TypeError('missing small label'); });`,
    context,
  );
  assert.equal(result, undefined);
  assert.equal(game.dataset.uiFailureScope, 'turn-controls');
  assert.match(game.dataset.uiFailure, /ui-turn-controls: missing small label/);
});
