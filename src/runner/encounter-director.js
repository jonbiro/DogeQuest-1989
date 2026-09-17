import { AREA_LENGTH, areaAt, areaGameplayAt, areaSignatureAt } from './areas.js';
import { dogChaseWindow } from './dog-chase.js';

// A run should feel authored even when its rows are seeded. The director is a
// small presentation/gameplay vocabulary layered over the deterministic
// generator: it names the current beat, points at the next set piece, and
// gives the renderer a safe place to signal a recovery stretch. Current trail
// generation consumes the same vocabulary for pacing; historical versions
// remain frozen so shared links continue to replay their authored streams.
export const ENCOUNTER_PHASES = Object.freeze({
  warmup: Object.freeze({
    label: 'WARM-UP',
    title: 'Find your rhythm',
    color: '#9be7d7',
  }),
  escalation: Object.freeze({
    label: 'ESCALATION',
    title: 'Pressure is building',
    color: '#ffe0a0',
  }),
  spectacle: Object.freeze({
    label: 'SPECTACLE',
    title: 'Big moment ahead',
    color: '#f6b5ff',
  }),
  recovery: Object.freeze({
    label: 'RECOVERY',
    title: 'Breathe and bank a bonus',
    color: '#b8d8ff',
  }),
});

export const ENCOUNTER_RECOVERY_LENGTH = 36;
export const ENCOUNTER_LOOKAHEAD = 86;
export const ENCOUNTER_WARMUP_LENGTH = 42;

const SPECIAL_TYPES = Object.freeze([
  'zipline-start',
  'raft-start',
  'minecart-start',
  'ski-start',
  'ski-gate',
  'moving-gate',
  'gap',
  'choice-left',
  'choice-right',
]);

function finiteDistance(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function meters(value) {
  return Math.max(1, Math.ceil(value));
}

// Titles are assembled from several authored layers (the upcoming pattern,
// the area's mechanic, and sometimes a phase label). Keep the compact HUD from
// saying the same thing twice when two layers happen to share a name.
export function compactEncounterTitle(...parts) {
  const seen = new Set();
  const pieces = parts
    .flatMap(part => String(part ?? '').split(/\s*·\s*/))
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => {
      const key = part.toLocaleLowerCase().replace(/\s+/g, ' ');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return pieces.join(' · ');
}

const ENCOUNTER_SHORT_TITLES = Object.freeze({
  'collapsing bridge': 'Bridge gap',
  'river crossing': 'River run',
  'mine-cart rush': 'Minecart',
  'frostpeak descent': 'Ski descent',
  'zipline flight': 'Zipline',
  'fork in the trail': 'Trail fork',
});

// The score card is deliberately narrow on portrait phones. Keep a short
// visual title there while the full title remains in the accessible name and
// tooltip. For composed area titles, the final mechanic is the useful part;
// the area rhythm already sits on the line above it.
export function encounterDisplayTitle(title) {
  const value = compactEncounterTitle(title);
  const mapped = ENCOUNTER_SHORT_TITLES[value.toLocaleLowerCase()];
  if (mapped) return mapped;
  const parts = value.split(' · ');
  return parts.length > 1 ? parts.at(-1) : value;
}

function phaseCopy(phase, area, rhythm, detail, progress = 0) {
  const definition = ENCOUNTER_PHASES[phase] || ENCOUNTER_PHASES.escalation;
  const signature = areaSignatureAt(area);
  const title = compactEncounterTitle(rhythm || definition.title);
  return {
    phase,
    label: definition.label,
    title,
    displayTitle: encounterDisplayTitle(title),
    detail: detail || areaGameplayAt(0).label,
    color: definition.color,
    progress: clamp01(progress),
    area: signature.index,
    mechanic: signature.mechanic.label,
    landmark: signature.landmark,
  };
}

function rideEncounter(run) {
  const ride = run?.raft || run?.zipline || run?.minecart || run?.ski;
  if (!ride || !Number.isFinite(ride.start) || !Number.isFinite(ride.end)) return null;
  const distance = finiteDistance(run.distance);
  const kind = run.ski ? 'Frostpeak descent' : run.raft ? 'River crossing' : run.minecart ? 'Mine-cart rush' : 'Zipline flight';
  const action = run.raft
    ? 'Steer between the glowing open lanes'
    : run.minecart
      ? run.minecartChoice
        ? 'Choose the steady bone lane or chase the glowing gem line'
        : 'Steer between the glowing open lanes'
      : run.ski
        ? 'Carve the open lane, hop the moguls, and dodge blue ice'
        : 'Catch the handle, then chase the floating bones';
  return phaseCopy(
    'spectacle',
    distance,
    kind,
    `${action} · ${meters(Math.max(0, ride.end - distance))}m to go`,
    (distance - ride.start) / (ride.end - ride.start),
  );
}

function dogChaseEncounter(run, distance) {
  const chase = run?.dogChase || run?.dogChaseUpcoming;
  const window = dogChaseWindow(distance, chase);
  if (!window || (!window.active && window.chase.start - distance > ENCOUNTER_LOOKAHEAD)) return null;
  const detail = window.active
    ? `Follow the wagging tail · ${meters(window.remaining)}m to the gift`
    : `Chase pup warming up · in ${meters(window.chase.start - distance)}m`;
  const progress = window.active
    ? (distance - window.chase.start) / Math.max(1, window.chase.end - window.chase.start)
    : 0;
  return phaseCopy('spectacle', distance, 'Puppy chase', detail, progress);
}

function courseEncounter(run, distance) {
  const course = run?.course;
  if (!course || !Number.isFinite(course.start) || !Number.isFinite(course.end)) return null;
  const remaining = course.start - distance;
  const active = distance >= course.start && distance < course.end;
  if (!active && (remaining < 0 || remaining > ENCOUNTER_LOOKAHEAD)) return null;
  const beats = Array.isArray(course.beats) ? course.beats.length : 0;
  const progress = active
    ? (distance - course.start) / Math.max(1, course.end - course.start)
    : 0;
  const detail = course.scenic
    ? active ? 'Open lanes · explore the detour' : `Open-lane detour · in ${meters(remaining)}m`
    : active
      ? `${Math.max(0, course.clean || 0)}/${beats} clean · +180 at the finish`
      : `Three-beat challenge · in ${meters(remaining)}m`;
  return phaseCopy('spectacle', distance, course.name, detail, progress);
}

function routeEncounter(run, distance) {
  if (Number.isFinite(run?.choicePending)) {
    const remaining = run.choicePending - distance;
    if (remaining >= 0 && remaining <= ENCOUNTER_LOOKAHEAD) {
      return phaseCopy(
        'spectacle',
        distance,
        'Fork in the trail',
        `Scenic: fewer hazards + bone trail · Challenge: +60 per clear + bone trail · in ${meters(remaining)}m`,
        1 - remaining / ENCOUNTER_LOOKAHEAD,
      );
    }
  }
  if (run?.route && Number.isFinite(run.route.until) && distance < run.route.until) {
    const remaining = run.route.until - distance;
    const title = run.route.branchTitle || (run.route.kind === 'challenge' ? 'Golden risk run' : 'Mossy shortcut');
    const detail = run.route.branchDetail
      ? `${run.route.branchDetail} · ${meters(remaining)}m to rejoin`
      : `${run.route.kind === 'challenge' ? 'Clear tighter rows' : 'Follow the optional bone trail'} · ${meters(remaining)}m to rejoin`;
    return phaseCopy('spectacle', distance, title, detail,
      1 - remaining / ROUTE_WINDOW_LENGTH);
  }
  return null;
}

const ROUTE_WINDOW_LENGTH = 220;

function upcomingSpecial(run, distance) {
  const candidate = (run?.objects || [])
    .filter(object => SPECIAL_TYPES.includes(object.type) &&
      (object.type !== 'gap' || object.bridgeCollapse) && !object.used &&
      Number.isFinite(object.at) && object.at >= distance && object.at - distance <= ENCOUNTER_LOOKAHEAD)
    .sort((a, b) => a.at - b.at)[0];
  if (!candidate) return null;
  if (candidate.type === 'choice-left' || candidate.type === 'choice-right') return routeEncounter(run, distance);
  const title = candidate.type === 'raft-start'
    ? 'River crossing'
    : candidate.type === 'minecart-start' ? 'Mine-cart rush'
      : candidate.type === 'ski-start' ? 'Frostpeak descent'
        : candidate.type === 'ski-gate' ? 'Ski gate'
      : candidate.type === 'moving-gate' ? 'Moving gate'
        : candidate.type === 'gap' ? 'Collapsing bridge' : 'Zipline flight';
  const detail = candidate.type === 'zipline-start'
    ? `Jump for the turquoise handle · in ${meters(candidate.at - distance)}m`
    : candidate.type === 'ski-start'
      ? `Carve the slope · hop moguls and follow the open gate · in ${meters(candidate.at - distance)}m`
      : candidate.type === 'ski-gate'
        ? `Follow the open flag · in ${meters(candidate.at - distance)}m`
    : candidate.type === 'moving-gate'
      ? `Follow the opening or slide under the sweep · in ${meters(candidate.at - distance)}m`
      : candidate.type === 'gap'
        ? `Jump the bright striped edge · in ${meters(candidate.at - distance)}m`
    : `Steer the open lane · in ${meters(candidate.at - distance)}m`;
  return phaseCopy('spectacle', distance, title, detail,
    1 - (candidate.at - distance) / ENCOUNTER_LOOKAHEAD);
}

export function encounterPhaseAt(distance = 0) {
  const safeDistance = finiteDistance(distance);
  const withinArea = safeDistance % AREA_LENGTH;
  // The destination edge is a deliberate reset: it gives the player a clean
  // visual breath before the next area's mechanics begin. The middle is the
  // authored pressure window where rows and bone choices should feel active.
  if (withinArea < ENCOUNTER_WARMUP_LENGTH) return 'warmup';
  if (withinArea >= AREA_LENGTH - ENCOUNTER_RECOVERY_LENGTH) return 'recovery';
  return 'escalation';
}

/**
 * Return the current authored beat for a run. This is intentionally pure: a
 * restored or replayed run gets the same label at the same distance, and the
 * renderer can call it every HUD tick without mutating simulation state.
 */
export function encounterFor(run = {}) {
  const distance = finiteDistance(run.distance);
  const ride = rideEncounter(run);
  if (ride) return ride;

  const chase = dogChaseEncounter(run, distance);
  if (chase) return chase;

  const recoveryUntil = Number.isFinite(run.encounterRecoveryUntil)
    ? run.encounterRecoveryUntil : 0;
  if (recoveryUntil > distance) {
    const remaining = recoveryUntil - distance;
    return phaseCopy('recovery', distance, 'Clear trail',
      `Collect the bonus line · ${meters(remaining)}m of breathing room`,
      1 - remaining / ENCOUNTER_RECOVERY_LENGTH);
  }

  const course = courseEncounter(run, distance);
  if (course) return course;
  const route = routeEncounter(run, distance);
  if (route) return route;
  const special = upcomingSpecial(run, distance);
  if (special) return special;

  const area = areaAt(distance);
  const profile = areaGameplayAt(distance);
  const signature = areaSignatureAt(distance);
  const rhythm = (run.objects || [])
    .filter(object => object.encounter && !object.used && !object.passed &&
      object.at > distance + 2 && areaAt(object.at) === area)
    .sort((a, b) => a.at - b.at)[0]?.encounter || profile.label;
  const phase = encounterPhaseAt(distance);
  const detail = phase === 'warmup'
    ? `${signature.mechanic.cue} · ${meters(Math.max(0, ENCOUNTER_WARMUP_LENGTH - (distance % AREA_LENGTH)))}m to settle in`
    : phase === 'recovery'
      ? `${signature.traversal} · watch for the next landmark`
      : `${signature.mechanic.detail} · collect a clean bone line`;
  const progress = phase === 'warmup'
    ? (distance % AREA_LENGTH) / ENCOUNTER_WARMUP_LENGTH
    : phase === 'recovery'
      ? ((distance % AREA_LENGTH) - (AREA_LENGTH - 36)) / 36
      : ((distance % AREA_LENGTH) - 42) / (AREA_LENGTH - 78);
  // The compact visual line names the destination mechanic; the fuller detail
  // remains in the title/ARIA description so the player gets context without
  // another message panel over the trail.
  return phaseCopy(phase, distance, `${rhythm} · ${signature.mechanic.label}`, detail, progress);
}

/**
 * Mark the short recovery beat after a completed spectacle. Keeping this
 * helper separate makes event integration explicit and easy to test.
 */
export function recoveryUntilFor(run, distance, length = ENCOUNTER_RECOVERY_LENGTH) {
  const current = Number.isFinite(run?.encounterRecoveryUntil)
    ? run.encounterRecoveryUntil : 0;
  const start = finiteDistance(distance);
  const span = Number.isFinite(length) && length > 0 ? length : ENCOUNTER_RECOVERY_LENGTH;
  return Math.max(current, start + span);
}
