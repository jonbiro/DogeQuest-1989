import {
  CORNER_ARC_LENGTH,
  CORNER_OFFSETS,
  CORNER_PERIOD,
} from "./turns.js";
import { terrainProfile } from "./terrain.js";

// The centerline is integrated once into a compact repeating lookup table.
// Calls during rendering only interpolate two samples, even far into a run.
const TAU = Math.PI * 2;
const SUPER_PERIOD = CORNER_PERIOD * 2;
const SAMPLE_LENGTH = 0.5;
const SAMPLE_COUNT = SUPER_PERIOD / SAMPLE_LENGTH;
const routeX = new Float64Array(SAMPLE_COUNT + 1);
const routeZ = new Float64Array(SAMPLE_COUNT + 1);

function modulo(value, period) {
  return ((value % period) + period) % period;
}

function smootherStep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function smootherStepDerivative(value) {
  if (value <= 0 || value >= 1) return 0;
  return 30 * value * value * (value - 1) * (value - 1);
}

function outsideWindow(station, start, end, period, fade) {
  const position = modulo(station - start, period);
  const length = end - start;
  if (position <= length) return { value: 0, derivative: 0 };
  const after = position - length;
  if (after < fade) {
    const t = after / fade;
    return {
      value: smootherStep(t),
      derivative: smootherStepDerivative(t) / fade,
    };
  }
  const before = period - position;
  if (before < fade) {
    const t = before / fade;
    return {
      value: smootherStep(t),
      derivative: -smootherStepDerivative(t) / fade,
    };
  }
  return { value: 1, derivative: 0 };
}

function winding(station) {
  const firstPhase = (TAU * station) / 175;
  const secondPhase = (TAU * station) / 280;
  const base = 0.3 * Math.sin(firstPhase) + 0.075 * Math.sin(secondPhase);
  const baseDerivative =
    (0.3 * TAU * Math.cos(firstPhase)) / 175 +
    (0.075 * TAU * Math.cos(secondPhase)) / 280;

  let maskValue = 1;
  let maskDerivative = 0;
  for (const offset of CORNER_OFFSETS) {
    const cornerMask = outsideWindow(
      station,
      offset - 45,
      offset + 45,
      CORNER_PERIOD,
      24,
    );
    maskDerivative =
      maskDerivative * cornerMask.value + maskValue * cornerMask.derivative;
    maskValue *= cornerMask.value;
  }
  return {
    yaw: base * maskValue,
    curvature: baseDerivative * maskValue + base * maskDerivative,
  };
}

function cornerTurn(station) {
  const cycle = Math.floor(station / CORNER_PERIOD);
  const phase = modulo(station, CORNER_PERIOD);
  const firstSign = modulo(cycle, 2) === 0 ? 1 : -1;
  let yaw = 0;
  let curvature = 0;

  for (let slot = 0; slot < CORNER_OFFSETS.length; slot++) {
    const progress = (phase - CORNER_OFFSETS[slot]) / CORNER_ARC_LENGTH;
    const sign = slot === 0 ? firstSign : -firstSign;
    if (progress >= 1) yaw += sign * Math.PI / 2;
    else if (progress > 0) {
      yaw += sign * (Math.PI / 2) * smootherStep(progress);
      curvature +=
        (sign * (Math.PI / 2) * smootherStepDerivative(progress)) /
        CORNER_ARC_LENGTH;
    }
  }
  return { yaw, curvature };
}

function absoluteFrame(station) {
  const turn = cornerTurn(station);
  const bend = winding(station);
  return {
    yaw: turn.yaw + bend.yaw,
    curvature: turn.curvature + bend.curvature,
  };
}

function derivatives(station) {
  const yaw = absoluteFrame(station).yaw;
  return { x: -Math.sin(yaw), z: Math.cos(yaw) };
}

for (let index = 1; index <= SAMPLE_COUNT; index++) {
  const middle = (index - 0.5) * SAMPLE_LENGTH;
  const direction = derivatives(middle);
  routeX[index] = routeX[index - 1] + direction.x * SAMPLE_LENGTH;
  routeZ[index] = routeZ[index - 1] + direction.z * SAMPLE_LENGTH;
}

const PERIOD_X = routeX[SAMPLE_COUNT];
const PERIOD_Z = routeZ[SAMPLE_COUNT];

function hermite(a, b, derivativeA, derivativeB, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * a +
    (t3 - 2 * t2 + t) * SAMPLE_LENGTH * derivativeA +
    (-2 * t3 + 3 * t2) * b +
    (t3 - t2) * SAMPLE_LENGTH * derivativeB
  );
}

function worldPosition(station) {
  const cycle = Math.floor(station / SUPER_PERIOD);
  const local = modulo(station, SUPER_PERIOD);
  const scaled = local / SAMPLE_LENGTH;
  const index = Math.min(SAMPLE_COUNT - 1, Math.floor(scaled));
  const t = scaled - index;
  const start = index * SAMPLE_LENGTH;
  const end = start + SAMPLE_LENGTH;
  const startDirection = derivatives(start);
  const endDirection = derivatives(end);
  return {
    x:
      cycle * PERIOD_X +
      hermite(routeX[index], routeX[index + 1], startDirection.x, endDirection.x, t),
    z:
      cycle * PERIOD_Z +
      hermite(routeZ[index], routeZ[index + 1], startDirection.z, endDirection.z, t),
  };
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function cleanZero(value) {
  return Math.abs(value) < 1e-12 ? 0 : value;
}

// Legacy scalar helpers remain available for integrations that inspect the
// absolute lateral centerline without asking for a player-relative frame.
export function centerline(station) {
  return Number.isFinite(station) ? worldPosition(station).x : 0;
}

export function tangent(station) {
  return Number.isFinite(station) ? derivatives(station).x : 0;
}

// `z` is the renderer's current relative-depth coordinate (ahead is negative).
// The returned position is in the player's horizontal tangent frame. Elevation
// remains world-up so hills never alter jump physics or collision coordinates.
export function routeFrame(distance, z, { flat = false } = {}) {
  if (!Number.isFinite(distance) || !Number.isFinite(z)) {
    return { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, slope: 0, curvature: 0 };
  }
  const station = distance - z;
  const playerPosition = worldPosition(distance);
  const targetPosition = worldPosition(station);
  const playerDirection = absoluteFrame(distance);
  const targetDirection = absoluteFrame(station);
  const deltaX = targetPosition.x - playerPosition.x;
  const deltaZ = targetPosition.z - playerPosition.z;
  const cosine = Math.cos(playerDirection.yaw);
  const sine = Math.sin(playerDirection.yaw);
  const terrain = flat ? { height: 0, slope: 0 } : terrainProfile(station);
  const playerTerrain = flat ? { height: 0 } : terrainProfile(distance);

  return {
    x: cleanZero(deltaX * cosine + deltaZ * sine),
    y: cleanZero(terrain.height - playerTerrain.height),
    z: cleanZero(deltaX * sine - deltaZ * cosine),
    yaw: cleanZero(normalizeAngle(targetDirection.yaw - playerDirection.yaw)),
    pitch: cleanZero(Math.atan(terrain.slope)),
    slope: cleanZero(terrain.slope),
    curvature: cleanZero(targetDirection.curvature),
  };
}

// Compatibility helpers for callers that only need the lateral/yaw parts.
export function routeOffset(distance, z) {
  return routeFrame(distance, z).x;
}

export function routeHeading(distance, z) {
  return routeFrame(distance, z).yaw;
}
