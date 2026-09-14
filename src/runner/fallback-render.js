import {PUPPIES, DEFAULT_PUPPY} from './collection.js';
import {PUPPY_ARTWORK_VARIANTS, PUPPY_ARTWORK_ALTERNATES, PUPPY_ARTWORK_BOUNDS} from './puppy-artwork.js';
import {LANES, PICKUPS} from './world.js';

// Chrome, embedded browsers, and privacy-hardened profiles can disable WebGL
// even though canvas and image decoding still work. Keep the runner playable
// at the same URL with the authored puppy paintings instead of trapping a
// player in a reload loop. This is intentionally a 2D presentation layer:
// the simulation, controls, scoring, and saved progress are unchanged.

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const TAU = Math.PI * 2;

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function polygon(context, points) {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) context.lineTo(x, y);
  context.closePath();
}

function sourceSize(image) {
  return {
    width: image?.naturalWidth || image?.width || 0,
    height: image?.naturalHeight || image?.height || 0,
  };
}

function poseUrl(id, pose) {
  const variants = PUPPY_ARTWORK_VARIANTS[id] || PUPPY_ARTWORK_VARIANTS[DEFAULT_PUPPY];
  const alternates = PUPPY_ARTWORK_ALTERNATES[id] || PUPPY_ARTWORK_ALTERNATES[DEFAULT_PUPPY];
  if (pose === 'raft') return alternates.raft || variants.idle;
  if (pose.endsWith('Alt')) {
    const base = pose.slice(0, -3);
    return alternates[base] || variants[base] || variants.idle;
  }
  return variants[pose] || variants.idle;
}

function selectPose(id, run, state, time) {
  if (!run || state !== 'playing') return 'idle';
  if (run.raft) return 'raft';
  if (run.zipline) return 'hang';
  if (run.slide > 0) return 'slide';
  if (run.y > .1) return 'jump';
  if (Math.abs(run.vx) > 1.1 || Math.abs(run.x - LANES[run.lane]) > .38) return 'turn';
  if (id === 'mochi' && PUPPY_ARTWORK_VARIANTS.mochi.away) return 'away';
  const stride = Math.sin((run.distance || time * 22) * .82) >= 0 ? 'stride' : 'strideAlt';
  return poseUrl(id, stride) === poseUrl(id, 'idle') ? 'stride' : stride;
}

function paletteFor(distance) {
  const palettes = [
    {top: '#8ec5aa', bottom: '#e7dfb6', far: '#6b9f87', near: '#397d6e', trail: '#d7d4a8', edge: '#526d49'},
    {top: '#f2b58d', bottom: '#ead7ad', far: '#b87859', near: '#765340', trail: '#d9c79e', edge: '#8b6941'},
    {top: '#a4bfe3', bottom: '#e6dfc5', far: '#748bb3', near: '#485d7d', trail: '#d8d1ae', edge: '#596b74'},
    {top: '#b7a9d7', bottom: '#e6d6cc', far: '#8177a6', near: '#524c70', trail: '#d8c9c5', edge: '#68607d'},
  ];
  return palettes[Math.floor(Math.max(0, distance) / 520) % palettes.length];
}

function drawBone(context, x, y, scale, airborne = false) {
  context.save();
  context.translate(x, y);
  context.rotate(airborne ? -.18 : .08);
  context.globalAlpha = .24;
  context.fillStyle = '#fff3a8';
  context.beginPath();
  context.ellipse(0, 0, 20 * scale, 20 * scale, 0, 0, TAU);
  context.fill();
  context.globalAlpha = 1;
  roundedRect(context, -15 * scale, -4 * scale, 30 * scale, 8 * scale, 4 * scale);
  context.fillStyle = airborne ? '#ffd86a' : '#fff8db';
  context.fill();
  for (const side of [-1, 1]) for (const dy of [-5, 5]) {
    context.beginPath();
    context.arc(side * 15 * scale, dy * scale, 6 * scale, 0, TAU);
    context.fill();
  }
  context.restore();
}

function drawPickup(context, type, x, y, scale, time) {
  const colors = {
    magnet: ['#ff648d', '#c8fff4'], shield: ['#2998ba', '#d8fff3'], gem: ['#a869e6', '#f4c9ff'],
    double: ['#ffc64c', '#fff1bf'], heart: ['#ff6c8b', '#ffd0d9'], gift: ['#b879e6', '#fff0a5'],
    zoomies: ['#a5d52b', '#f4ff9c'], relic: ['#efbf67', '#fff2bd'],
  }[type] || ['#fff1bf', '#ffffff'];
  const bob = Math.sin(time * 3.2 + x) * 3 * scale;
  context.save();
  context.translate(x, y + bob);
  context.shadowColor = colors[1];
  context.shadowBlur = 14 * scale;
  context.fillStyle = colors[0];
  context.beginPath();
  context.arc(0, 0, 14 * scale, 0, TAU);
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = colors[1];
  context.lineWidth = Math.max(1.5, 2 * scale);
  context.stroke();
  context.fillStyle = colors[1];
  context.font = `700 ${Math.max(10, 13 * scale)}px system-ui, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(type === 'double' ? '×2' : type === 'zoomies' ? '»' : type === 'relic' ? '✦' : type[0].toUpperCase(), 0, 1);
  context.restore();
}

function drawHazard(context, type, x, y, scale, palette, turn) {
  context.save();
  context.translate(x, y);
  const width = 46 * scale;
  if (type === 'gap') {
    context.fillStyle = '#263d47';
    context.globalAlpha = .86;
    roundedRect(context, -width, -5 * scale, width * 2, 13 * scale, 5 * scale);
    context.fill();
    context.strokeStyle = '#f4c35c';
    context.lineWidth = Math.max(1, 2 * scale);
    context.setLineDash([5 * scale, 5 * scale]);
    context.stroke();
    context.setLineDash([]);
  } else if (type === 'log') {
    const gradient = context.createLinearGradient(0, -14 * scale, 0, 14 * scale);
    gradient.addColorStop(0, '#c98555'); gradient.addColorStop(1, '#6a422f');
    context.fillStyle = gradient;
    roundedRect(context, -width, -13 * scale, width * 2, 25 * scale, 9 * scale);
    context.fill();
    context.fillStyle = '#e5b779';
    context.beginPath(); context.ellipse(-width + 7 * scale, 0, 6 * scale, 9 * scale, 0, 0, TAU); context.fill();
  } else if (type === 'rock' || type === 'branch') {
    polygon(context, [[-width, 9 * scale], [-width * .6, -16 * scale], [-width * .05, -23 * scale], [width * .58, -12 * scale], [width, 9 * scale]]);
    context.fillStyle = type === 'branch' ? '#73964e' : palette.edge;
    context.fill();
    context.strokeStyle = 'rgba(20,48,47,.45)';
    context.lineWidth = Math.max(1, 1.5 * scale);
    context.stroke();
  } else if (type === 'arch' || type === 'gate') {
    context.fillStyle = type === 'gate' ? '#205269' : '#694c3c';
    roundedRect(context, -width, -48 * scale, 12 * scale, 55 * scale, 3 * scale); context.fill();
    roundedRect(context, width - 12 * scale, -48 * scale, 12 * scale, 55 * scale, 3 * scale); context.fill();
    roundedRect(context, -width, -52 * scale, width * 2, 14 * scale, 4 * scale); context.fill();
    context.fillStyle = '#b3ffe7'; context.globalAlpha = .78;
    context.fillRect(-width * .65, -47 * scale, width * 1.3, 4 * scale);
  } else if (type.startsWith('corner-')) {
    context.fillStyle = '#173b3e';
    roundedRect(context, -22 * scale, -25 * scale, 44 * scale, 31 * scale, 5 * scale); context.fill();
    context.fillStyle = '#edc36d';
    context.font = `900 ${Math.max(13, 22 * scale)}px system-ui, sans-serif`;
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillText(type.endsWith('left') ? '‹‹' : '››', 0, -9 * scale);
  } else if (type.startsWith('choice-')) {
    context.shadowColor = type.endsWith('left') ? '#a7e59e' : '#f0b762'; context.shadowBlur = 18 * scale;
    context.fillStyle = type.endsWith('left') ? '#87ca8f' : '#efb44f';
    roundedRect(context, -width * .85, -55 * scale, width * 1.7, 16 * scale, 7 * scale); context.fill();
    context.shadowBlur = 0;
  } else if (type.startsWith('zipline-')) {
    context.fillStyle = '#a2ffde'; context.globalAlpha = .8;
    context.beginPath(); context.arc(0, -12 * scale, 7 * scale, 0, TAU); context.fill();
  }
  context.restore();
  if (turn) {
    context.save(); context.translate(x, y - 34 * scale);
    context.fillStyle = '#fff0b7'; context.font = `800 ${Math.max(10, 12 * scale)}px system-ui, sans-serif`;
    context.textAlign = 'center'; context.fillText(turn === 'left' ? 'SWIPE ‹' : 'SWIPE ›', 0, 0); context.restore();
  }
}

function drawAccessory(context, costume, x, y, scale) {
  if (!costume || costume === 'scarf') return;
  context.save();
  context.translate(x, y);
  if (costume === 'explorer') {
    context.fillStyle = '#a77b43'; context.strokeStyle = '#3b2b28'; context.lineWidth = 2 * scale;
    context.beginPath(); context.ellipse(0, -78 * scale, 33 * scale, 7 * scale, 0, 0, TAU); context.fill(); context.stroke();
    roundedRect(context, -17 * scale, -91 * scale, 34 * scale, 16 * scale, 6 * scale); context.fill(); context.stroke();
  } else if (costume === 'hero') {
    polygon(context, [[15 * scale, -30 * scale], [67 * scale, -10 * scale], [40 * scale, 28 * scale], [7 * scale, 10 * scale]]);
    context.fillStyle = '#3c8fe1'; context.globalAlpha = .88; context.fill();
  } else if (costume === 'raincoat') {
    context.fillStyle = '#f2c34c'; context.globalAlpha = .82; roundedRect(context, -34 * scale, -23 * scale, 68 * scale, 35 * scale, 12 * scale); context.fill();
  } else if (costume === 'royal') {
    polygon(context, [[-27 * scale, -78 * scale], [-17 * scale, -101 * scale], [0, -86 * scale], [15 * scale, -104 * scale], [27 * scale, -78 * scale]]);
    context.fillStyle = '#edc85a'; context.fill();
  } else if (costume === 'party') {
    polygon(context, [[-18 * scale, -72 * scale], [0, -111 * scale], [18 * scale, -72 * scale]]);
    context.fillStyle = '#b86cde'; context.fill();
  }
  context.restore();
}

export function createFallbackView(canvas) {
  const context = canvas.getContext('2d', {alpha: false});
  if (!context) throw new Error('Canvas 2D is unavailable');
  const images = new Map();
  let cssWidth = 0;
  let cssHeight = 0;
  let pixelRatio = 1;
  let lastPose = 'idle';

  const imageFor = (url) => {
    if (!url) return null;
    if (!images.has(url)) {
      const image = new window.Image();
      image.decoding = 'async';
      image.src = new window.URL(url, window.location.href).href;
      images.set(url, image);
    }
    return images.get(url);
  };

  function resize() {
    const width = Math.max(1, canvas.clientWidth || window.innerWidth || 640);
    const height = Math.max(1, canvas.clientHeight || window.innerHeight || 640);
    const ratio = clamp(window.devicePixelRatio || 1, 1, 2);
    if (width === cssWidth && height === cssHeight && ratio === pixelRatio) return;
    cssWidth = width; cssHeight = height; pixelRatio = ratio;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.imageSmoothingEnabled = true;
  }

  function drawPuppy(run, state, collection, time) {
    const id = Object.hasOwn(PUPPIES, run?.puppy) ? run.puppy : Object.hasOwn(PUPPIES, collection?.puppy) ? collection.puppy : DEFAULT_PUPPY;
    const pose = selectPose(id, run, state, time);
    const url = poseUrl(id, pose);
    const image = imageFor(url);
    const boundsPose = pose === 'raft' ? 'raftAlt' : pose;
    const bounds = PUPPY_ARTWORK_BOUNDS[id]?.[boundsPose] || PUPPY_ARTWORK_BOUNDS[id]?.idle;
    const width = cssWidth;
    const height = cssHeight;
    const laneTarget = run ? LANES[run.lane] : 0;
    const laneBlend = run ? clamp((run.x - laneTarget) / 2.4, -1, 1) : 0;
    const laneX = width / 2 + laneTarget * Math.min(width * .12, 82) + laneBlend * Math.min(width * .08, 50);
    const hanging = Boolean(run?.zipline);
    const rafting = Boolean(run?.raft);
    const baseline = hanging ? height * .62 : rafting ? height * .78 : height * .91 - (run?.y || 0) * height * .08;
    const maxHeight = clamp(height * (hanging ? .30 : rafting ? .23 : .27), 145, 270);
    if (image?.complete && sourceSize(image).width && bounds) {
      const imageSize = sourceSize(image);
      // Bounds are measured in source pixels. Normalize the visible alpha box
      // directly to the desired CSS height so the full painting stays on-canvas.
      const scale = maxHeight / bounds.boxHeight;
      const drawWidth = imageSize.width * scale;
      const drawHeight = imageSize.height * scale;
      const center = (bounds.x + bounds.boxWidth / 2) / bounds.width;
      const bottom = (bounds.y + bounds.boxHeight) / bounds.height;
      const left = laneX - center * drawWidth;
      const top = baseline - bottom * drawHeight;
      context.save();
      const flip = !hanging && !rafting && run?.vx < -1.2 ? -1 : 1;
      if (flip < 0) {
        context.translate(laneX * 2, 0);
        context.scale(-1, 1);
      }
      context.globalAlpha = run?.invulnerable > 0 && Math.floor(time * 12) % 2 === 0 ? .45 : 1;
      context.drawImage(image, left, top, drawWidth, drawHeight);
      context.restore();
      if (!hanging) drawAccessory(context, collection?.costume, laneX, top + drawHeight * .25, scale * .78);
    } else {
      // A tiny placeholder keeps the first frame intentional while the local
      // WebP streams in. It is replaced automatically without a second render.
      context.save(); context.translate(laneX, baseline - maxHeight * .46);
      context.fillStyle = id === 'luna' ? '#8fa6b1' : id === 'mochi' ? '#8d9187' : id === 'pepper' ? '#ecebe3' : '#d89043';
      context.beginPath(); context.ellipse(0, 0, maxHeight * .25, maxHeight * .3, 0, 0, TAU); context.fill();
      context.beginPath(); context.arc(0, -maxHeight * .22, maxHeight * .23, 0, TAU); context.fill();
      context.fillStyle = '#243238'; context.beginPath(); context.arc(-maxHeight * .08, -maxHeight * .23, 5, 0, TAU); context.arc(maxHeight * .08, -maxHeight * .23, 5, 0, TAU); context.fill(); context.restore();
    }
    lastPose = pose;
  }

  function drawRaft(context, x, y, scale, time) {
    context.save(); context.translate(x, y);
    context.fillStyle = 'rgba(30,92,97,.85)';
    context.beginPath(); context.ellipse(0, 10 * scale, 96 * scale, 24 * scale, 0, 0, TAU); context.fill();
    for (let plank = -2; plank <= 2; plank++) {
      context.fillStyle = plank % 2 ? '#b77c4c' : '#cf9861';
      roundedRect(context, -77 * scale, plank * 9 * scale, 154 * scale, 12 * scale, 5 * scale); context.fill();
    }
    context.strokeStyle = '#25494d'; context.lineWidth = 5 * scale;
    for (const side of [-1, 1]) {
      context.save(); context.translate(side * 78 * scale, -15 * scale); context.rotate(side * (.72 + Math.sin(time * 4.8) * .14)); context.beginPath(); context.moveTo(0, 0); context.lineTo(0, -72 * scale); context.stroke(); context.restore();
    }
    context.restore();
  }

  function draw(run, time, state, reducedMotion, dt, alpha = 1, collection) {
    resize();
    const width = cssWidth;
    const height = cssHeight;
    const distance = Number.isFinite(run?.distance) ? run.distance : 0;
    const palette = paletteFor(distance);
    const motionTime = reducedMotion ? 0 : time;
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, palette.top); sky.addColorStop(.68, palette.bottom); sky.addColorStop(1, palette.near);
    context.fillStyle = sky; context.fillRect(0, 0, width, height);
    context.globalAlpha = .65;
    context.fillStyle = '#fff4bd'; context.beginPath(); context.arc(width * .79, height * .17, Math.min(width, height) * .06, 0, TAU); context.fill();
    context.globalAlpha = 1;

    // Distant, gently shifting silhouettes keep the fallback feeling like a
    // trail through changing places rather than a flat debug canvas.
    for (let i = 0; i < 7; i++) {
      const x = (i / 6) * width + Math.sin(distance * .002 + i) * width * .025;
      const peak = height * (.18 + (i % 3) * .045);
      polygon(context, [[x - width * .18, height * .42], [x, peak], [x + width * .18, height * .42]]);
      context.fillStyle = i % 2 ? palette.far : '#7cab91'; context.fill();
    }
    context.fillStyle = palette.near; context.fillRect(0, height * .38, width, height * .62);

    const horizon = height * .39;
    const nearY = height * 1.03;
    const centerShift = Math.sin(distance * .006) * width * .12;
    polygon(context, [
      [width * .44 + centerShift * .25, horizon], [width * .56 + centerShift * .25, horizon],
      [width * .96 + centerShift, nearY], [width * .04 + centerShift, nearY],
    ]);
    context.fillStyle = palette.edge; context.fill();
    polygon(context, [
      [width * .455 + centerShift * .25, horizon], [width * .545 + centerShift * .25, horizon],
      [width * .88 + centerShift, nearY], [width * .12 + centerShift, nearY],
    ]);
    context.fillStyle = palette.trail; context.fill();
    context.strokeStyle = 'rgba(77,100,83,.42)'; context.lineWidth = Math.max(1, width / 320);
    for (const lane of [-1, 1]) {
      context.beginPath(); context.moveTo(width / 2 + centerShift * .25 + lane * width * .045, horizon); context.lineTo(width / 2 + centerShift + lane * width * .38, nearY); context.stroke();
    }
    for (let row = 1; row < 8; row++) {
      const t = row / 8;
      const y = horizon + Math.pow(t, 1.55) * (nearY - horizon);
      const half = width * (.045 + t * .34);
      context.beginPath(); context.moveTo(width / 2 + centerShift * (t + .25) - half, y); context.lineTo(width / 2 + centerShift * (t + .25) + half, y); context.stroke();
    }

    // Repeating bushes add scale and depth while remaining inexpensive.
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      const depth = ((i * 23 + Math.floor(distance / 20) * 9) % 130) / 130;
      const y = horizon + Math.pow(depth, .86) * (nearY - horizon);
      const x = width / 2 + centerShift * depth + side * (width * (.28 + depth * .35));
      const radius = Math.max(4, width * (.018 + depth * .035));
      context.fillStyle = i % 3 ? '#397d6e' : '#4a8b5b';
      context.beginPath(); context.arc(x, y, radius, 0, TAU); context.arc(x + radius * .7, y - radius * .5, radius * .82, 0, TAU); context.arc(x - radius * .7, y - radius * .25, radius * .72, 0, TAU); context.fill();
    }

    const visible = run?.objects?.filter(object => object.at - distance > -8 && object.at - distance < 132).slice().sort((a, b) => b.at - a.at) || [];
    for (const object of visible) {
      if (object.used) continue;
      const ahead = object.at - distance;
      const depth = clamp(1 - ahead / 132, 0, 1);
      const y = horizon + Math.pow(depth, .86) * (nearY - horizon);
      const laneWidth = width * (.04 + depth * .30);
      const x = width / 2 + centerShift * depth + (object.lane - 1) * laneWidth;
      const scale = .34 + depth * 1.18;
      const raised = object.airborne ? height * (.10 + depth * .11) : 0;
      if (object.type === 'bone') drawBone(context, x, y - raised, scale, object.airborne);
      else if (PICKUPS.includes(object.type)) drawPickup(context, object.type, x, y - raised, scale, motionTime);
      else drawHazard(context, object.type, x, y, scale, palette, object.type.startsWith('corner-') ? object.direction : null);
    }

    if (run?.raft) drawRaft(context, width / 2 + centerShift, height * .82, clamp(width / 700, .7, 1.2), motionTime);
    if (run?.zipline) {
      const handleX = width / 2 + (run.x || 0) * Math.min(width * .12, 82);
      context.strokeStyle = '#25494d'; context.lineWidth = 4; context.beginPath(); context.moveTo(width / 2, height * .18); context.lineTo(handleX, height * .53); context.stroke();
      context.fillStyle = '#a2ffde'; context.beginPath(); context.arc(handleX, height * .53, 12, 0, TAU); context.fill();
    }
    if (run && run.y === 0 && !run.raft && !run.zipline) {
      const laneX = width / 2 + LANES[run.lane] * Math.min(width * .12, 82);
      context.fillStyle = 'rgba(23,41,37,.25)'; context.beginPath(); context.ellipse(laneX, height * .93, width * .11, height * .018, 0, 0, TAU); context.fill();
    }
    drawPuppy(run, state, collection, motionTime);
    context.fillStyle = 'rgba(16,42,40,.76)'; roundedRect(context, 14, height - 43, 148, 29, 14); context.fill();
    context.fillStyle = '#eff7dd'; context.font = '700 11px system-ui, sans-serif'; context.textAlign = 'left'; context.textBaseline = 'middle';
    context.fillText('LIGHTWEIGHT TRAIL', 28, height - 28);
    if (state === 'menu') {
      context.fillStyle = 'rgba(16,42,40,.68)'; roundedRect(context, width - 176, height - 43, 162, 29, 14); context.fill();
      context.fillStyle = '#eff7dd'; context.fillText('WebGL-free play ready', width - 162, height - 28);
    }
  }

  function portrait(run, appearance, rear = false) {
    const output = document.createElement('canvas'); output.width = 240; output.height = 240;
    const outputContext = output.getContext('2d');
    if (!outputContext) return '';
    outputContext.fillStyle = '#24483f'; outputContext.fillRect(0, 0, 240, 240);
    const id = Object.hasOwn(PUPPIES, appearance?.puppy) ? appearance.puppy : DEFAULT_PUPPY;
    const pose = rear && id === 'mochi' ? 'away' : 'idle';
    const image = imageFor(poseUrl(id, pose));
    const bounds = PUPPY_ARTWORK_BOUNDS[id]?.[pose] || PUPPY_ARTWORK_BOUNDS[id]?.idle;
    if (image?.complete && sourceSize(image).width && bounds) {
      const size = sourceSize(image);
      const scale = 190 / bounds.boxHeight;
      const dw = size.width * scale, dh = size.height * scale;
      outputContext.drawImage(image, 120 - ((bounds.x + bounds.boxWidth / 2) / bounds.width) * dw, 220 - ((bounds.y + bounds.boxHeight) / bounds.height) * dh, dw, dh);
    }
    return output.toDataURL('image/png');
  }

  function instructionImage(action) {
    const output = document.createElement('canvas'); output.width = 192; output.height = 112;
    const outputContext = output.getContext('2d');
    if (!outputContext) return '';
    outputContext.fillStyle = '#24483f'; outputContext.fillRect(0, 0, 192, 112);
    outputContext.fillStyle = '#d7d4a8'; outputContext.beginPath(); outputContext.moveTo(55, 0); outputContext.lineTo(137, 0); outputContext.lineTo(175, 112); outputContext.lineTo(17, 112); outputContext.closePath(); outputContext.fill();
    if (action === 'lanes') drawHazard(outputContext, 'rock', 72, 74, .45, paletteFor(0), null);
    else drawHazard(outputContext, action === 'slide' ? 'arch' : 'log', 96, action === 'slide' ? 70 : 84, .7, paletteFor(0), null);
    outputContext.fillStyle = '#f4c35c'; outputContext.font = '800 12px system-ui, sans-serif'; outputContext.fillText(action === 'lanes' ? '←  →' : action === 'slide' ? '↓  SLIDE' : '↑  JUMP', 12, 24);
    return output.toDataURL('image/png');
  }

  resize();
  return {
    prepareShaders: () => Promise.resolve(true),
    draw,
    portrait,
    instructionImage,
    diagnostics: () => ({renderer: 'canvas-2d-fallback', puppyFrame: null, activePose: lastPose}),
  };
}
