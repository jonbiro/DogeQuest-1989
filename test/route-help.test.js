import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {masteryCards} from '../src/runner/mastery.js';

test('river help explains automatic boarding, steering-only hazards and banked rewards',()=>{
  const html=readFileSync(new URL('../runner/index.html',import.meta.url),'utf8');
  const guide=html.match(/<details id="river-help">([\s\S]*?)<\/details>/)?.[1];
  assert.ok(guide);
  for(const phrase of ['1,150 meters','boards the raft automatically','swipes or buttons',
    'carries momentum','cannot be jumped or slid under','+250 score points',
    'Practice is unscored','Older shared trails'])assert.ok(guide.includes(phrase),phrase);
});

test('route help is directly discoverable and distinguishes optional encounters from mastery',()=>{
  const html=readFileSync(new URL('../runner/index.html',import.meta.url),'utf8');
  const guide=html.match(/<details id="route-help">([\s\S]*?)<\/details>/)?.[1];
  assert.ok(guide);
  for(const phrase of ['Scenic or Challenge?','two open lanes','do not earn regional stamps','all three beats','220 meters','Older shared trails'])
    assert.ok(guide.includes(phrase),phrase);
});

test('regional passport cards explain how to earn stamps without confusing dog bonds',()=>{
  for(const card of masteryCards()){
    if(card.id.startsWith('region-')){
      assert.match(card.tip,/Choose Challenge/);assert.match(card.tip,/all three beats/);
      assert.match(card.tip,/Scenic encounters do not earn stamps/);
    }else if(card.id.startsWith('ride-'))assert.match(card.tip,/Practice never counts/);
    else assert.equal(card.tip,undefined);
  }
});
