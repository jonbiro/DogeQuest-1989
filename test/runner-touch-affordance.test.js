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
