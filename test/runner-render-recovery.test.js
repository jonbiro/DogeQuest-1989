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
