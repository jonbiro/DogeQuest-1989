import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const app=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/runner/ui.css',import.meta.url),'utf8');

test('touch launch guidance follows runtime touch capability detection',()=>{
  assert.match(app,/const touchControls = supportsTouchControls\(window\);[\s\S]{0,120}\$\('game'\)\.dataset\.touch = touchControls \? 'true' : 'false';/);
  assert.match(css,/#game\[data-touch="true"\] \.touch-launch-hint\s*\{\s*display:\s*flex;/);
});

test('narrow touch controls keep action labels readable',()=>{
  const start=css.indexOf('@media(max-width:380px)');
  assert.ok(start>=0,'narrow-phone touch guard should be present');
  const block=css.slice(start,css.indexOf('@media (min-width: 701px)',start));
  assert.match(block,/#controls small\s*\{[^}]*font-size:\s*9px/s);
  assert.doesNotMatch(block,/#controls small\s*\{[^}]*font-size:\s*8px/s);
});
