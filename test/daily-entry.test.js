import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';

test('daily trail is discoverable at camp and reuses the explicit selection flow',()=>{
  const html=readFileSync(new URL('../runner/index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const menu=html.slice(html.indexOf('<section id="menu"'),html.indexOf('<aside id="buddy"'));
  assert.match(menu,/<button id="daily-camp" type="button" aria-label="Choose today's shared trail">Daily trail<\/button>/);
  assert.match(app,/\$\('daily-camp'\)\.onclick = chooseDailyTrail/);
  assert.match(app,/\$\('daily-trail'\)\.onclick = chooseDailyTrail/);
});
