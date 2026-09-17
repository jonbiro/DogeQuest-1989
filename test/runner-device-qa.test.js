import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const qa = readFileSync(new URL('../scripts/runner-device-qa.mjs', import.meta.url), 'utf8');

test('device QA defaults to the smallest supported iPhone SE portrait viewport', () => {
  assert.match(qa, /orientation='portrait'/);
  assert.match(qa, /width:375,height:667,deviceScaleFactor:2,screenWidth:375,screenHeight:667/);
  assert.match(qa, /Emulation\.setDeviceMetricsOverride',viewport/);
});
