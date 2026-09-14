import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {URL} from 'node:url';
import vm from 'node:vm';

const source = (await readFile(new URL('../src/runner/offline.js', import.meta.url), 'utf8'))
  .replace('export function', 'function');

function fixture({mobile = false, busy = false} = {}) {
  const timers = [];
  const status = {textContent: 'Preparing offline play'};
  const listeners = {};
  let registrations = 0;
  let busyState = busy;
  const registration = {
    active: {},
    installing: null,
    addEventListener() {},
  };
  const navigator = {
    userAgent: mobile ? 'iPhone' : 'Desktop',
    serviceWorker: {
      register: async () => {
        registrations++;
        return registration;
      },
    },
  };
  const context = {
    document: {
      readyState: 'complete',
      visibilityState: 'visible',
      getElementById: () => status,
    },
    navigator,
    window: {
      isSecureContext: true,
      navigator,
      matchMedia: () => ({matches: mobile}),
      setTimeout: (callback, delay) => {
        timers.push({callback, delay});
        return timers.length;
      },
      addEventListener: (name, callback) => { listeners[name] = callback; },
    },
  };
  vm.runInNewContext(`${source};globalThis.installOfflineSupport = installOfflineSupport;`, context);
  context.installOfflineSupport({isBusy: () => busyState});
  return {
    context,
    timers,
    listeners,
    registrationCount: () => registrations,
    status,
    setBusy: value => { busyState = value; },
  };
}

test('mobile offline artwork waits until the renderer is quiet', async () => {
  const f = fixture({mobile: true, busy: true});
  assert.equal(f.registrationCount(), 0);
  assert.deepEqual(f.timers.map(timer => timer.delay), [12000]);
  f.timers.shift().callback();
  assert.equal(f.registrationCount(), 0);
  assert.deepEqual(f.timers.map(timer => timer.delay), [4000]);
  f.setBusy(false);
  f.timers.shift().callback();
  await Promise.resolve();
  assert.equal(f.registrationCount(), 1);
});

test('desktop offline support can register immediately without waiting for a timer', async () => {
  const f = fixture();
  assert.equal(f.registrationCount(), 1);
  await Promise.resolve();
  assert.equal(f.timers.length, 0);
});
