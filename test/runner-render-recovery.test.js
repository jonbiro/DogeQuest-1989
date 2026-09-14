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
