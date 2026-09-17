import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

const app = readFileSync(new URL('../src/runner/app.js', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../runner/index.html', import.meta.url), 'utf8');

test('the ended sheet exposes retry and a direct fresh-adventure choice', () => {
  assert.match(shell, /id="overlay-primary"[^>]*>Keep running/);
  assert.match(shell, /id="continue-adventure"[^>]*>Continue adventure/);
  assert.match(app, /setHidden\('continue-adventure', kind !== 'ended' \|\| Boolean\(run\.practice\)\)/);
  assert.match(app, /Retry the same trail, or continue with a fresh adventure\./);
});

test('Continue clears shared trail state before starting a fresh run', () => {
  const clearStart = app.indexOf('function clearSharedTrailSelection()');
  const clearEnd = app.indexOf("$('shared-random').onclick", clearStart);
  const handlerStart = app.indexOf('const continueAdventureButton');
  const handlerEnd = app.indexOf("for (const id of ['mission-help'", handlerStart);
  assert.ok(clearStart >= 0 && clearEnd > clearStart && handlerStart > clearStart && handlerEnd > handlerStart);

  const continueButton = {};
  let started = false;
  const transitions = [];
  const replaced = [];
  const context = {
    localDailyTarget: true,
    sharedSeed: 1989,
    sharedVersion: 7,
    sharedTarget: 640,
    state: 'ended',
    graphicsReady: true,
    run: {practice: undefined},
    window: {
      URL,
      location: {href: 'https://example.test/runner/?trail=1989&target=640'},
      history: {replaceState: (...args) => replaced.push(args)},
    },
    $: id => id === 'continue-adventure' ? continueButton : {},
    setHidden: (id, hidden) => { context.hidden = {id, hidden}; },
    setState: value => { transitions.push(value); context.state = value; },
    start: () => {
      started = true;
      context.startedFrom = context.state;
    },
  };

  runInNewContext(`${app.slice(clearStart, clearEnd)}\n${app.slice(handlerStart, handlerEnd)}`, context);
  continueButton.onclick();

  assert.equal(started, true);
  assert.equal(context.startedFrom, 'menu');
  assert.deepEqual(transitions, ['menu']);
  assert.equal(context.localDailyTarget, false);
  assert.equal(context.sharedSeed, null);
  assert.equal(context.sharedVersion, null);
  assert.equal(context.sharedTarget, 0);
  assert.equal(String(replaced[0]?.[2]), 'https://example.test/runner/');
  assert.deepEqual(context.hidden, {id: 'shared-trail', hidden: true});
});

test('Continue is inert for an ended practice rehearsal', () => {
  const clearStart = app.indexOf('function clearSharedTrailSelection()');
  const clearEnd = app.indexOf("$('shared-random').onclick", clearStart);
  const handlerStart = app.indexOf('const continueAdventureButton');
  const handlerEnd = app.indexOf("for (const id of ['mission-help'", handlerStart);
  const continueButton = {};
  let started = false;
  const context = {
    localDailyTarget: false,
    sharedSeed: null,
    sharedVersion: null,
    sharedTarget: 0,
    state: 'ended',
    graphicsReady: true,
    run: {practice: {kind: 'jump'}},
    window: {URL, location: {href: 'https://example.test/runner/'}, history: {replaceState() {}}},
    $: id => id === 'continue-adventure' ? continueButton : {},
    setHidden() {},
    setState() {},
    start: () => { started = true; },
  };
  runInNewContext(`${app.slice(clearStart, clearEnd)}\n${app.slice(handlerStart, handlerEnd)}`, context);
  continueButton.onclick();
  assert.equal(started, false);
});
