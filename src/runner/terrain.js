// Gentle world-space rises and descents. The trail is eased back to level around
// corners and special traversal so jumping keeps the same screen-space timing.
const TAU = Math.PI * 2;

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

// Returns a C2-continuous mask and its derivative. The mask is zero inside the
// repeating flat interval, then eases back to one over `fade` metres.
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

function multiplyMasks(station, windows) {
  let value = 1;
  let derivative = 0;
  for (const window of windows) {
    const next = outsideWindow(station, ...window);
    derivative = derivative * next.value + value * next.derivative;
    value *= next.value;
  }
  return { value, derivative };
}

// [start, end, period, fade]. Core intervals include a little transition room
// beyond the actual bridge/cable boundaries and the full corner clear zone.
const LEVEL_WINDOWS = [
  [160, 300, 900, 45],
  [620, 820, 1400, 45],
  [105, 195, 1400, 38],
  [905, 995, 1400, 38],
];

export function terrainProfile(station) {
  if (!Number.isFinite(station)) return { height: 0, slope: 0 };

  const firstPhase = (TAU * station) / 560;
  const secondPhase = (TAU * station) / 310 + 0.4;
  const base = 2.3 * Math.sin(firstPhase) + 0.85 * Math.sin(secondPhase);
  const baseSlope =
    (2.3 * TAU * Math.cos(firstPhase)) / 560 +
    (0.85 * TAU * Math.cos(secondPhase)) / 310;
  const mask = multiplyMasks(station, LEVEL_WINDOWS);
  if (mask.value === 0) return { height: 0, slope: 0 };

  return {
    height: base * mask.value,
    slope: baseSlope * mask.value + base * mask.derivative,
  };
}
