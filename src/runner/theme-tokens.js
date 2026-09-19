// Design tokens: single source for the Runner restyle (Phase 0).
// Pure data — no Three.js import so tests, CSS and JS can share it.
// CSS mapping lives in src/runner/ui.css :root (--pq-*).
// Trail mapping lives in trail-palette.js / areas.js / hazard-cast.js.

export const TOKENS = Object.freeze({
  color: Object.freeze({
    ink: '#102a28',
    inkDeep: '#0a202b',
    paper: '#f4f5e8',
    lime: '#e2f7a5',
    limeStrong: '#dcf78c',
    muted: '#b6cbc0',
    boneFace: '#fff2ca',
    boneEdge: '#5b341b',
    curbBase: '#2f3d38',
    roadWarm: '#d6c993',
    hazardJump: '#ff9b78',
    hazardSlide: '#9bded6',
    hazardSteer: '#ffd27a',
    danger: '#ff6b5e',
    calm: '#9be7d7',
  }),
  type: Object.freeze({
    hudMin: 12,
    chip: 12,
    caption: 10,
    h1CampMax: 40,
  }),
  radius: Object.freeze({
    pill: 999,
    card: 12,
  }),
  z: Object.freeze({
    hud: 3,
    dock: 2,
    controls: 4,
    overlay: 10,
  }),
});

// Hazard tone drives the shape language without touching clearing rules.
// warm = low/jump, cool = tall/slide, neutral = wide/steer.
export const HAZARD_TONES = Object.freeze({
  rock: 'warm',
  log: 'warm',
  'pound-worker': 'warm',
  'crate-cart': 'warm',
  gap: 'warm',
  mogul: 'warm',
  snowball: 'warm',
  arch: 'cool',
  branch: 'cool',
  gate: 'cool',
  'moving-gate': 'cool',
  'pound-officer': 'cool',
  ice: 'neutral',
  'ski-gate': 'neutral',
  yeti: 'neutral',
  snowman: 'neutral',
});

export function hazardTone(type) {
  return HAZARD_TONES[type] ?? 'neutral';
}
