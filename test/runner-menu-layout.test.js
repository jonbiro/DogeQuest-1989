import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

const css=readFileSync(new URL('../src/runner/ui.css',import.meta.url),'utf8');

test('short portrait menu keeps every start option reachable',()=>{
  const marker='@media (max-width:700px) and (orientation:portrait) and (min-height:521px) and (max-height:600px)';
  const start=css.indexOf(marker);
  assert.ok(start>=0,'short portrait menu guard should be present');
  const block=css.slice(start,css.indexOf('@media (max-width:700px) and (min-height:701px)',start));
  assert.match(block,/\.menu\s*\{[^}]*max-height:/s);
  assert.match(block,/\.menu\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(block,/\.start-actions\s*\{[^}]*margin-top:\s*24px/s);
});
