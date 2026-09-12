import {
  CORNER_ARC_LENGTH,
  CORNER_OFFSETS,
  CORNER_PERIOD,
} from "./turns.js";
import { terrainProfile } from "./terrain.js";
import {routeDetour,detourReveal} from './route-detour.js';

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

function selectedFrame(station,route,reveal) {
  const position=worldPosition(station),direction=absoluteFrame(station);
  const detour=routeDetour(station,route);
  const offset=detour.offset*reveal,slope=detour.slope*reveal,second=detour.second*reveal;
  if(!offset&&!slope&&!second)return {...position,...direction};
  const k=direction.curvature;
  const kPrime=(absoluteFrame(station+.05).curvature-absoluteFrame(station-.05).curvature)/.1;
  const forward=1+offset*k,forwardPrime=slope*k+offset*kPrime;
  return {
    x:position.x+Math.cos(direction.yaw)*offset,
    z:position.z+Math.sin(direction.yaw)*offset,
    yaw:direction.yaw-Math.atan2(slope,forward),
    curvature:k-(forward*second-slope*forwardPrime)/(forward*forward+slope*slope),
    stretch:Math.hypot(forward,slope),
  };
}

// `z` is the renderer's current relative-depth coordinate (ahead is negative).
// The returned position is in the player's horizontal tangent frame. Elevation
// remains world-up so hills never alter jump physics or collision coordinates.
export function routeFrame(distance, z, { flat = false, route = null } = {}) {
  return createRouteSampler(distance,{flat,route})(z);
}

// One sampler per rendered frame shares the player transform and terrain across
// every visible section. Keep it local to the frame: the run's route can change.
export function createRouteSampler(distance, {flat=false,route=null}={}) {
  const empty=()=>({x:0,y:0,z:0,yaw:0,pitch:0,slope:0,curvature:0});
  if(!Number.isFinite(distance))return empty;
  const reveal=detourReveal(distance,route);
  const playerPosition = selectedFrame(distance,route,reveal);
  const playerDirection = playerPosition;
  const cosine = Math.cos(playerDirection.yaw);
  const sine = Math.sin(playerDirection.yaw);
  const playerTerrain = flat ? { height: 0 } : terrainProfile(distance);
  // Snapshot the tiny route descriptor so callers cannot mix two route states.
  const selectedRoute=route?{kind:route.kind,until:route.until}:null;
  return z=>{
    if(!Number.isFinite(z))return empty();
    const station=distance-z;
    const targetPosition = selectedFrame(station,selectedRoute,reveal);
    const targetDirection = targetPosition;
    const deltaX = targetPosition.x - playerPosition.x;
    const deltaZ = targetPosition.z - playerPosition.z;
    const terrain = flat ? { height: 0, slope: 0 } : terrainProfile(station);
    const stretch=targetPosition.stretch||1;

    return {
      x: cleanZero(deltaX * cosine + deltaZ * sine),
      y: cleanZero(terrain.height - playerTerrain.height),
      z: cleanZero(deltaX * sine - deltaZ * cosine),
      yaw: cleanZero(normalizeAngle(targetDirection.yaw - playerDirection.yaw)),
      pitch: cleanZero(Math.atan(terrain.slope/stretch)),
      slope: cleanZero(terrain.slope/stretch),
      curvature: cleanZero(targetDirection.curvature/stretch),
      ...(Math.abs(stretch-1)>1e-12?{stretch}:{}),
    };
  };
}

// Compatibility helpers for callers that only need the lateral/yaw parts.
export function routeOffset(distance, z) {
  return routeFrame(distance, z).x;
}

export function routeHeading(distance, z) {
  return routeFrame(distance, z).yaw;
}
