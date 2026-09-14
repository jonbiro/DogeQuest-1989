import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../runner/index.html',import.meta.url),'utf8');
const source=html.match(/<script id="runner-entry">([\s\S]*?)<\/script>/)[1];
test('runner directory entry preserves replay parameters and stays on its own origin',()=>{
  for(const href of ['http://localhost:3012/runner?trail=3-1j9&target=200#help',
    'https://jonbiro.github.io/DogeQuest-1989/runner?trail=2-1j9',
    'https://example.com//untrusted.example/runner']){
    const location=new URL(href);let destination;
    location.replace=url=>{destination=new URL(url);};
    runInNewContext(source,{URL,location});
    assert.equal(destination.origin,location.origin);
    assert.equal(destination.pathname,location.pathname+'/');
    assert.equal(destination.search,location.search);assert.equal(destination.hash,location.hash);
  }
  for(const path of ['/runner/','/runner/index.html','/DogeQuest-1989/','/other']){
    const location=new URL(path,'https://example.com');
    location.replace=()=>assert.fail('canonical pages must not reload');
    runInNewContext(source,{URL,location});
  }
});

test('only the exact entry script is permitted by CSP and it precedes relative assets',()=>{
  const hash=createHash('sha256').update(source).digest('base64');
  assert.ok(html.includes(`'sha256-${hash}'`));
  assert.ok(!html.includes("'unsafe-inline'"));
  assert.ok(html.indexOf('id="runner-entry"')<html.indexOf('rel="stylesheet"'));
});

test('runner headline and onboarding name bones as the core collectible',()=>{
  assert.match(html,/<title>Puppy Run — Run wild\. Fetch bones\.<\/title>/);
  assert.match(html,/class="wordmark"[\s\S]*aria-label="Puppy Run — A Puppy Quest original"/);
  assert.match(html,/<h1 id="title">Run wild\.<br \/>Fetch <em>bones\.<\/em><\/h1>/);
  assert.match(html,/<span>MEET YOUR RUNNING BUDDY<\/span><strong>Mochi\.<\/strong>/);
  assert.match(html,/aria-label="3D running trail\. Press and hold, drag one lane left or right, pause briefly, then drag again without lifting\. A clear swipe can switch/);
  assert.match(html,/Press and hold on the trail, then drag one lane left or right\. Pause briefly and drag again without lifting/);
  assert.match(html,/id="gesture-coach"[^>]*Press and hold\. Drag one lane\. Pause briefly\. Drag again without lifting/);
  assert.match(html,/tap the center of the trail to jump/);
  assert.match(html,/tap a left or right edge to steer on touch screens/);
  assert.match(html,/Drag left or right and use the buttons by default/);
  assert.match(html,/chase glowing bones/);
  assert.match(html,/Zipline bones ↗︎/);
  assert.match(html,/id="area-rhythm"/);
  assert.doesNotMatch(html,/Fetch gold/);
});
