import assert from 'node:assert/strict';
import { Level } from '../src/Level.js';

const audioMethods = [
  'bump',
  'breakWall',
  'collect',
  'combo10',
  'combo3',
  'combo5',
  'dash',
  'die',
  'jump',
  'land',
  'powerUp',
  'shieldHit',
  'spring',
  'stomp',
  'wallJump',
  'wallSlide',
  'win'
];

export function makeAudioSpy() {
  const calls = [];
  const audio = Object.fromEntries(
    audioMethods.map((method) => [method, (...args) => calls.push({ method, args })])
  );
  audio.calls = calls;
  return audio;
}

export function makeParticleSpy() {
  const particleSystem = {
    emissions: [],
    emit(pos, options) {
      this.emissions.push({ pos, options });
    }
  };
  return particleSystem;
}

export function makeDisplaySpy() {
  const calls = [];
  const display = {
    calls,
    addScreenShake: (...args) => calls.push({ method: 'addScreenShake', args }),
    showComboText: (...args) => calls.push({ method: 'showComboText', args }),
    triggerFlash: (...args) => calls.push({ method: 'triggerFlash', args }),
    triggerGlitch: (...args) => calls.push({ method: 'triggerGlitch', args }),
    triggerVictory: (...args) => calls.push({ method: 'triggerVictory', args })
  };
  return display;
}

export function makeLevel(plan, options = {}) {
  const gameInfo = {
    bone: 0,
    highScore: 0,
    level: 1,
    life: 5,
    totalBone: 0
  };
  const level = new Level(
    plan,
    gameInfo,
    options.particleSystem === undefined ? makeParticleSpy() : options.particleSystem,
    options.audio === undefined ? makeAudioSpy() : options.audio,
    options.display === undefined ? makeDisplaySpy() : options.display
  );
  return { gameInfo, level };
}

export function withRandom(values, callback) {
  assert.ok(values.length > 0, 'at least one deterministic random value is required');
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => values[index++ % values.length];
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}
