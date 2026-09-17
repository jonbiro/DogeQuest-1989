// Local, no-account replay data for the current trail. A ghost is intentionally
// a small stream of distance/lane/posture samples rather than a second physics
// simulation: it can never change collisions, score, or the seeded object
// stream, and it remains cheap to keep in localStorage on a phone.

import {supportsTrailVersion} from './trail-version.js';

export const GHOST_VERSION = 1;
export const GHOST_SAMPLE_SPACING = 6;
export const MAX_GHOST_SAMPLES = 2048;
export const MAX_GHOST_RECORDS = 8;

const POSTURES = new Set(['run', 'jump', 'slide', 'hang', 'raft', 'minecart']);

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function postureFor(run = {}) {
  if (run.zipline) return 'hang';
  if (run.raft) return 'raft';
  if (run.minecart) return 'minecart';
  if (run.slide > 0) return 'slide';
  if (run.y > .08) return 'jump';
  return 'run';
}

function validSeed(value) {
  return Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

function validVersion(value) {
  // Ghosts are tied to the trail generator, not to the age of this module.
  // Keeping a hand-written upper bound here meant every current v5 run was
  // recorded in memory but rejected at finalize/load time, so the HUD could
  // never show the promised local best. Reuse the trail contract so a new
  // generator version opts into ghosts deliberately and old shared trails
  // remain playable.
  return Number.isInteger(value) && supportsTrailVersion(value);
}

function cleanSample(value, previous = -Infinity) {
  if (!value || typeof value !== 'object') return null;
  const distance = finite(value.d ?? value.distance, -1);
  if (distance < 0 || distance <= previous) return null;
  const posture = POSTURES.has(value.p ?? value.posture) ? (value.p ?? value.posture) : 'run';
  return {
    d: Math.round(distance * 100) / 100,
    x: clamp(finite(value.x, 0), -2.4, 2.4),
    y: clamp(finite(value.y, 0), 0, 7),
    p: posture,
  };
}

export function ghostSamplesFrom(value) {
  if (!Array.isArray(value)) return [];
  const samples = [];
  let previous = -Infinity;
  for (const item of value) {
    const sample = cleanSample(item, previous);
    if (!sample) continue;
    samples.push(sample);
    previous = sample.d;
    if (samples.length >= MAX_GHOST_SAMPLES) break;
  }
  return samples;
}

function cleanRecord(value) {
  const generatorVersion = value?.generatorVersion ?? value.trailVersion ?? value?.version;
  if (!value || typeof value !== 'object' ||
      !validSeed(value.seed) || !validVersion(generatorVersion)) return null;
  const samples = ghostSamplesFrom(value.samples);
  if (samples.length < 2) return null;
  return {
    version: GHOST_VERSION,
    seed: value.seed,
    generatorVersion,
    score: Math.max(0, Math.floor(finite(value.score))),
    distance: Math.max(samples.at(-1).d, finite(value.distance)),
    samples,
  };
}

export function ghostsFrom(value) {
  if (!Array.isArray(value)) return [];
  const records = [];
  for (const item of value) {
    const record = cleanRecord(item);
    if (!record) continue;
    const existing = records.find(candidate => candidate.seed === record.seed &&
      candidate.generatorVersion === record.generatorVersion);
    if (existing) {
      const better = record.score > existing.score ||
        record.score === existing.score && record.distance > existing.distance;
      if (better) Object.assign(existing, record);
      continue;
    }
    records.push(record);
    if (records.length >= MAX_GHOST_RECORDS) break;
  }
  return records;
}

export function ghostFor(value, seed, generatorVersion) {
  if (!validSeed(seed) || !validVersion(generatorVersion)) return null;
  return ghostsFrom(value).find(record => record.seed === seed &&
    record.generatorVersion === generatorVersion) || null;
}

export function createGhostRecorder(run = {}) {
  return {
    seed: run.seed,
    generatorVersion: run.generatorVersion,
    samples: [],
    nextDistance: 0,
  };
}

export function recordGhostSample(recorder, run = {}) {
  if (!recorder || !run || run.practice || run.ended || !Number.isFinite(run.distance)) return false;
  const distance = Math.max(0, run.distance);
  if (distance + .001 < recorder.nextDistance) return false;
  if (recorder.samples.length >= MAX_GHOST_SAMPLES) return false;
  const previous = recorder.samples.at(-1)?.d ?? -Infinity;
  const sample = cleanSample({
    d: distance,
    x: run.x,
    y: run.y,
    p: postureFor(run),
  }, previous);
  if (!sample) return false;
  recorder.samples.push(sample);
  recorder.nextDistance = distance + GHOST_SAMPLE_SPACING;
  return true;
}

export function finalizeGhost(recorder, run = {}) {
  if (!recorder || !run || !validSeed(recorder.seed) || !validVersion(recorder.generatorVersion)) return null;
  const samples = ghostSamplesFrom([
    ...recorder.samples,
    {d: run.distance, x: run.x, y: run.y, p: postureFor(run)},
  ]);
  if (samples.length < 2) return null;
  return {
    version: GHOST_VERSION,
    seed: recorder.seed,
    generatorVersion: recorder.generatorVersion,
    score: Math.max(0, Math.floor(finite(run.score))),
    distance: Math.max(samples.at(-1).d, finite(run.distance)),
    samples,
  };
}

export function bankGhostRecord(profile, run) {
  if (!profile || !run?.ended || run.practice) return null;
  if (run.ghostReceipt) return run.ghostReceipt;
  const record = finalizeGhost(run.ghostRecorder, run);
  if (!record) {
    run.ghostReceipt = {stored: false, previous: null, record: null};
    return run.ghostReceipt;
  }
  const records = ghostsFrom(profile.ghosts);
  const previous = records.find(candidate => candidate.seed === record.seed &&
    candidate.generatorVersion === record.generatorVersion) || null;
  const better = !previous || record.score > previous.score ||
    record.score === previous.score && record.distance > previous.distance;
  if (better) {
    const next = [record, ...records.filter(candidate => candidate.seed !== record.seed ||
      candidate.generatorVersion !== record.generatorVersion)];
    profile.ghosts = next.slice(0, MAX_GHOST_RECORDS);
  } else if (!Array.isArray(profile.ghosts)) {
    profile.ghosts = records;
  }
  run.ghostReceipt = {stored: better, previous, record: better ? record : previous};
  return run.ghostReceipt;
}

// Return a smoothly interpolated ghost pose at a trail distance. The caller
// decides how far ahead/behind to display it; keeping that policy out of this
// pure sampler makes it reusable for tests and future ghost modes.
export function ghostAt(record, distance) {
  const samples = record?.samples;
  if (!Array.isArray(samples) || samples.length < 2 || !Number.isFinite(distance)) return null;
  if (distance < samples[0].d || distance > samples.at(-1).d) return null;
  let low = 0;
  let high = samples.length - 1;
  while (low + 1 < high) {
    const middle = (low + high) >> 1;
    if (samples[middle].d <= distance) low = middle;
    else high = middle;
  }
  const before = samples[low];
  const after = samples[Math.min(samples.length - 1, low + 1)];
  const span = Math.max(.001, after.d - before.d);
  const t = clamp((distance - before.d) / span, 0, 1);
  return {
    distance,
    x: before.x + (after.x - before.x) * t,
    y: before.y + (after.y - before.y) * t,
    posture: t < .5 ? before.p : after.p,
  };
}

export function ghostSummary(record) {
  if (!record) return '';
  return `Local ghost · ${Math.floor(record.distance).toLocaleString()}m · ${Math.floor(record.score).toLocaleString()} pts`;
}
