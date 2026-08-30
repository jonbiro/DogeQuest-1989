import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AudioSystem } from '../src/utils/Audio.js';

test('AudioSystem teardown cancels delayed effects and disconnects active nodes', () => {
  const originalWindow = globalThis.window;
  const clearedTimers = [];
  let nextTimer = 0;
  globalThis.window = {
    AudioContext: null,
    clearInterval() {},
    clearTimeout(timer) {
      clearedTimers.push(timer);
    },
    setTimeout() {
      return ++nextTimer;
    }
  };

  try {
    const audio = new AudioSystem();
    let stopped = 0;
    let disconnected = 0;
    audio.effectTimers.add(7);
    audio.effectNodes.add({
      stop() { stopped++; },
      disconnect() { disconnected++; }
    });

    audio.stopAll();

    assert.deepEqual(clearedTimers, [7]);
    assert.equal(stopped, 1);
    assert.equal(disconnected, 1);
    assert.equal(audio.effectTimers.size, 0);
    assert.equal(audio.effectNodes.size, 0);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
