import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

test('runner action arrows explicitly request text presentation, including dynamic labels',()=>{
  for(const path of ['../runner/index.html','../src/runner/app.js']) {
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    const arrows=[...source.matchAll(/↗/gu)];
    assert.ok(arrows.length>0);
    for(const arrow of arrows)assert.equal(source[arrow.index+1],'\uFE0E',`${path}: missing text presentation`);
  }
});
