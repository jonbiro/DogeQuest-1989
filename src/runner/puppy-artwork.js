import * as THREE from 'three';

// The puppies are illustrated raster artwork, rather than a collection of
// procedural meshes. Keeping the paths in one place means the clubhouse cards
// and the in-run art can never drift apart visually.
export const PUPPY_ARTWORK = Object.freeze({
  biscuit: './puppies/biscuit.webp',
  mochi: './puppies/mochi.webp',
  pepper: './puppies/pepper.webp',
  luna: './puppies/luna.webp',
});

// Full-body pose paintings are deliberately separate from the source portraits.
// They are complete silhouettes, not limb cut-outs: swapping between them keeps
// the coat, ears and paws connected while the puppy turns or hits a stride.
// Every dog gets authored forward, airborne, crouched, three-quarter turn, and
// zipline-hanging paintings so the action silhouette changes with the physics
// rather than asking one portrait to pretend it is jumping or sliding. Mochi
// also has a rear chase-camera painting: his default run can finally show the
// dog moving away from the owner instead of making a front portrait face the
// wrong way down the trail.
export const PUPPY_ARTWORK_VARIANTS = Object.freeze({
  biscuit: Object.freeze({
    idle: PUPPY_ARTWORK.biscuit,
    stride: './puppies/biscuit-run-front.webp',
    jump: './puppies/biscuit-jump.webp',
    slide: './puppies/biscuit-slide.webp',
    turn: './puppies/biscuit-turn.webp',
    hang: './puppies/biscuit-hang.webp',
  }),
  mochi: Object.freeze({
    idle: PUPPY_ARTWORK.mochi,
    // Supplied Mochi side-gallop paintings: alternating phases make steering
    // feel physical without falling back to a stiff portrait.
    stride: './puppies/mochi-run-side.webp',
    strideAlt: './puppies/mochi-run-side-alt.webp',
    jump: './puppies/mochi-jump.webp',
    slide: './puppies/mochi-slide.webp',
    turn: './puppies/mochi-turn.webp',
    hang: './puppies/mochi-hang.webp',
    away: './puppies/mochi-away.webp',
  }),
  pepper: Object.freeze({
    idle: PUPPY_ARTWORK.pepper,
    stride: './puppies/pepper-run-front.webp',
    jump: './puppies/pepper-jump.webp',
    slide: './puppies/pepper-slide.webp',
    turn: './puppies/pepper-turn.webp',
    hang: './puppies/pepper-hang.webp',
  }),
  luna: Object.freeze({
    idle: PUPPY_ARTWORK.luna,
    stride: './puppies/luna-run-front.webp',
    jump: './puppies/luna-jump.webp',
    slide: './puppies/luna-slide.webp',
    turn: './puppies/luna-turn.webp',
    hang: './puppies/luna-hang.webp',
  }),
});

// Every action now has a second authored beat.  The runner keeps these in a
// single streaming slot (rather than allocating a second sprite for every
// action) so the richer roster still fits the mobile texture budget.  Mochi's
// supplied side-gallop painting remains a dedicated slot because it is also
// the bend-specific chase silhouette; his other alternates, including the
// sailor rafting outfit, stream through the shared slot below.
export const PUPPY_ARTWORK_ALTERNATES = Object.freeze({
  biscuit: Object.freeze({
    stride: './puppies/biscuit-run-alt.webp',
    jump: './puppies/biscuit-jump-alt.webp',
    slide: './puppies/biscuit-slide-alt.webp',
    turn: './puppies/biscuit-turn-alt.webp',
    hang: './puppies/biscuit-hang-alt.webp',
    raft: './puppies/biscuit-raft.webp',
  }),
  mochi: Object.freeze({
    jump: './puppies/mochi-jump-alt.webp',
    slide: './puppies/mochi-slide-alt.webp',
    turn: './puppies/mochi-turn-alt.webp',
    hang: './puppies/mochi-hang-alt.webp',
    raft: './puppies/mochi-raft.webp',
  }),
  pepper: Object.freeze({
    stride: './puppies/pepper-run-alt.webp',
    jump: './puppies/pepper-jump-alt.webp',
    slide: './puppies/pepper-slide-alt.webp',
    turn: './puppies/pepper-turn-alt.webp',
    hang: './puppies/pepper-hang-alt.webp',
    raft: './puppies/pepper-raft.webp',
  }),
  luna: Object.freeze({
    stride: './puppies/luna-run-alt.webp',
    jump: './puppies/luna-jump-alt.webp',
    slide: './puppies/luna-slide-alt.webp',
    turn: './puppies/luna-turn-alt.webp',
    hang: './puppies/luna-hang-alt.webp',
    raft: './puppies/luna-raft.webp',
  }),
});

// Transparent canvases are intentionally kept as authored paintings, but the
// paintings do not all use the same amount of breathing room. These measured
// alpha bounds (the stable 32/255 alpha edge, after matte cleanup) let the
// renderer normalize the *visible* puppy (not the empty canvas) before swapping
// poses. Without this, a wide stride can pop larger or smaller than the idle
// frame even when both are 2.48 world units tall. Bounds use the same top-left
// pixel coordinates as the source images.
export const PUPPY_ARTWORK_BOUNDS = Object.freeze({
  biscuit: Object.freeze({
    idle: Object.freeze({width: 1254, height: 1254, x: 104, y: 42, boxWidth: 1078, boxHeight: 1181}),
    stride: Object.freeze({width: 1254, height: 1254, x: 159, y: 7, boxWidth: 915, boxHeight: 1207}),
    strideAlt: Object.freeze({width: 1254, height: 1254, x: 55, y: 62, boxWidth: 1166, boxHeight: 1133}),
    jump: Object.freeze({width: 1254, height: 1254, x: 65, y: 41, boxWidth: 1140, boxHeight: 1040}),
    jumpAlt: Object.freeze({width: 1254, height: 1254, x: 36, y: 46, boxWidth: 1201, boxHeight: 1078}),
    slide: Object.freeze({width: 1254, height: 1254, x: 20, y: 147, boxWidth: 1214, boxHeight: 974}),
    slideAlt: Object.freeze({width: 1254, height: 1254, x: 24, y: 231, boxWidth: 1225, boxHeight: 935}),
    turn: Object.freeze({width: 1254, height: 1254, x: 21, y: 18, boxWidth: 1228, boxHeight: 1211}),
    turnAlt: Object.freeze({width: 1254, height: 1254, x: 30, y: 80, boxWidth: 1214, boxHeight: 1133}),
    hang: Object.freeze({width: 1024, height: 1536, x: 88, y: 13, boxWidth: 892, boxHeight: 1458}),
    hangAlt: Object.freeze({width: 1024, height: 1536, x: 100, y: 17, boxWidth: 867, boxHeight: 1451}),
    raftAlt: Object.freeze({width: 1145, height: 1374, x: 15, y: 6, boxWidth: 1114, boxHeight: 1325}),
  }),
  mochi: Object.freeze({
    idle: Object.freeze({width: 1230, height: 1278, x: 117, y: 39, boxWidth: 1037, boxHeight: 1210}),
    // The supplied side-gallop painting is intentionally wide: its stretched
    // paws and swept tail need room to read while Mochi banks around a bend.
    stride: Object.freeze({width: 1536, height: 1024, x: 19, y: 18, boxWidth: 1505, boxHeight: 976}),
    // The alternate supplied phase has a slightly tighter crop. Normalizing
    // its measured alpha bounds keeps the visible puppy and paw line stable
    // when the cadence changes frames.
    strideAlt: Object.freeze({width: 1536, height: 1024, x: 78, y: 63, boxWidth: 1405, boxHeight: 898}),
    jump: Object.freeze({width: 1230, height: 1278, x: 63, y: 72, boxWidth: 1111, boxHeight: 1097}),
    slide: Object.freeze({width: 1536, height: 1024, x: 47, y: 71, boxWidth: 1450, boxHeight: 893}),
    turn: Object.freeze({width: 1254, height: 1254, x: 110, y: 79, boxWidth: 1065, boxHeight: 1123}),
    jumpAlt: Object.freeze({width: 1254, height: 1254, x: 72, y: 27, boxWidth: 1148, boxHeight: 1182}),
    hang: Object.freeze({width: 1024, height: 1536, x: 122, y: 8, boxWidth: 835, boxHeight: 1409}),
    slideAlt: Object.freeze({width: 1254, height: 1254, x: 15, y: 197, boxWidth: 1225, boxHeight: 879}),
    turnAlt: Object.freeze({width: 1254, height: 1254, x: 100, y: 45, boxWidth: 1103, boxHeight: 1165}),
    hangAlt: Object.freeze({width: 1024, height: 1536, x: 132, y: 14, boxWidth: 821, boxHeight: 1398}),
    // Measured from the generated rear chase-camera painting. The high tail
    // and lifted paw are intentionally included in the visible bounds so the
    // frame stays centered when it swaps with the forward stride painting.
    away: Object.freeze({width: 1254, height: 1254, x: 236, y: 30, boxWidth: 822, boxHeight: 1190}),
    raftAlt: Object.freeze({width: 1214, height: 1295, x: 79, y: 17, boxWidth: 1054, boxHeight: 1255}),
  }),
  pepper: Object.freeze({
    idle: Object.freeze({width: 1254, height: 1254, x: 158, y: 24, boxWidth: 1000, boxHeight: 1200}),
    stride: Object.freeze({width: 1254, height: 1254, x: 34, y: 66, boxWidth: 1184, boxHeight: 1150}),
    strideAlt: Object.freeze({width: 1254, height: 1254, x: 117, y: 105, boxWidth: 1048, boxHeight: 1091}),
    jump: Object.freeze({width: 1254, height: 1254, x: 58, y: 52, boxWidth: 1145, boxHeight: 1039}),
    jumpAlt: Object.freeze({width: 1254, height: 1254, x: 85, y: 71, boxWidth: 1093, boxHeight: 1062}),
    slide: Object.freeze({width: 1254, height: 1254, x: 71, y: 142, boxWidth: 1127, boxHeight: 956}),
    slideAlt: Object.freeze({width: 1254, height: 1254, x: 24, y: 370, boxWidth: 1206, boxHeight: 623}),
    turn: Object.freeze({width: 1254, height: 1254, x: 30, y: 78, boxWidth: 1201, boxHeight: 1115}),
    turnAlt: Object.freeze({width: 1254, height: 1254, x: 82, y: 25, boxWidth: 1105, boxHeight: 1188}),
    hang: Object.freeze({width: 1024, height: 1536, x: 111, y: 28, boxWidth: 866, boxHeight: 1431}),
    hangAlt: Object.freeze({width: 1024, height: 1536, x: 132, y: 29, boxWidth: 825, boxHeight: 1443}),
    raftAlt: Object.freeze({width: 1145, height: 1374, x: 29, y: 36, boxWidth: 1091, boxHeight: 1307}),
  }),
  luna: Object.freeze({
    idle: Object.freeze({width: 1254, height: 1254, x: 94, y: 8, boxWidth: 1084, boxHeight: 1232}),
    stride: Object.freeze({width: 1254, height: 1254, x: 200, y: 19, boxWidth: 915, boxHeight: 1215}),
    strideAlt: Object.freeze({width: 1254, height: 1254, x: 115, y: 89, boxWidth: 1052, boxHeight: 1062}),
    jump: Object.freeze({width: 1254, height: 1254, x: 86, y: 20, boxWidth: 1098, boxHeight: 1132}),
    jumpAlt: Object.freeze({width: 1254, height: 1254, x: 78, y: 88, boxWidth: 1099, boxHeight: 1006}),
    slide: Object.freeze({width: 1254, height: 1254, x: 20, y: 166, boxWidth: 1218, boxHeight: 944}),
    slideAlt: Object.freeze({width: 1254, height: 1254, x: 24, y: 369, boxWidth: 1222, boxHeight: 613}),
    turn: Object.freeze({width: 1254, height: 1254, x: 60, y: 8, boxWidth: 1150, boxHeight: 1219}),
    turnAlt: Object.freeze({width: 1254, height: 1254, x: 72, y: 44, boxWidth: 1111, boxHeight: 1167}),
    hang: Object.freeze({width: 1024, height: 1536, x: 120, y: 10, boxWidth: 880, boxHeight: 1438}),
    hangAlt: Object.freeze({width: 1024, height: 1536, x: 128, y: 12, boxWidth: 812, boxHeight: 1438}),
    raftAlt: Object.freeze({width: 1214, height: 1295, x: 44, y: 13, boxWidth: 1138, boxHeight: 1244}),
  }),
});

// The normalized crop windows remain part of the data contract for older
// diagnostics and the clubhouse preview. Gameplay uses the complete painted
// pose stack below instead of assembling those crops into a puppet. Keeping
// the layout here lets old callers inspect the source artwork without ever
// exposing the detached-ear / detached-paw failure mode in the live runner.
export const PUPPY_ARTWORK_LAYOUTS = Object.freeze({
  biscuit: {
    body: {
      face: [.34, .27, .32, .29],
      // Tight head windows keep transparent source padding from becoming a
      // visible halo while leaving a little painted fur overlap at the neck.
      head: [.025, .035, .65, .56],
      root: [.34, .53],
      ears: [
        { crop: [.05, .12, .25, .42], root: [.20, .34] },
        { crop: [.48, .12, .24, .43], root: [.56, .35] },
      ],
    },
    tail: { crop: [.69, .02, .30, .44], root: [.70, .43] },
    legs: [
      { crop: [.18, .57, .23, .40], root: [.30, .59] },
      { crop: [.35, .56, .23, .42], root: [.46, .58] },
      { crop: [.50, .55, .23, .37], root: [.60, .57] },
      { crop: [.68, .52, .27, .41], root: [.79, .54] },
    ],
  },
  mochi: {
    body: {
      face: [.34, .28, .33, .30],
      // Mochi's portrait has a generous transparent border in the source;
      // this crop hugs the curls and collar so his face reads immediately.
      head: [.035, .035, .62, .53],
      root: [.34, .54],
      ears: [
        { crop: [.04, .12, .27, .44], root: [.20, .35] },
        { crop: [.49, .12, .25, .44], root: [.57, .35] },
      ],
    },
    tail: { crop: [.66, .02, .32, .43], root: [.68, .42] },
    legs: [
      { crop: [.16, .57, .24, .39], root: [.29, .59] },
      { crop: [.34, .55, .24, .44], root: [.46, .57] },
      { crop: [.51, .54, .22, .39], root: [.61, .56] },
      { crop: [.68, .50, .28, .41], root: [.80, .53] },
    ],
  },
  pepper: {
    body: {
      face: [.34, .28, .32, .30],
      head: [.025, .045, .65, .54],
      root: [.34, .54],
      ears: [
        { crop: [.06, .14, .25, .42], root: [.21, .35] },
        { crop: [.49, .14, .24, .42], root: [.57, .36] },
      ],
    },
    tail: { crop: [.70, .02, .29, .42], root: [.71, .41] },
    legs: [
      { crop: [.18, .59, .23, .37], root: [.31, .60] },
      { crop: [.36, .57, .23, .40], root: [.47, .59] },
      { crop: [.52, .56, .22, .37], root: [.62, .58] },
      { crop: [.70, .53, .26, .39], root: [.80, .55] },
    ],
  },
  luna: {
    body: {
      face: [.32, .30, .33, .30],
      head: [.02, .005, .65, .52],
      root: [.32, .57],
      ears: [
        { crop: [.05, .01, .25, .35], root: [.18, .29] },
        { crop: [.44, .02, .25, .35], root: [.55, .30] },
      ],
    },
    tail: { crop: [.69, .06, .30, .42], root: [.70, .44] },
    legs: [
      { crop: [.16, .61, .24, .36], root: [.29, .62] },
      { crop: [.35, .59, .24, .40], root: [.47, .61] },
      { crop: [.52, .58, .23, .37], root: [.63, .60] },
      { crop: [.70, .55, .27, .39], root: [.81, .57] },
    ],
  },
});

const WORLD_HEIGHT = 2.48;
// The zipline handle is rendered by the scene, while the painted hang frame
// is positioned locally so its raised paws meet that handle. Keep the shared
// offset explicit rather than baking a second, slightly different height into
// the artwork and renderer.
export const PUPPY_HANG_HANDLE_HEIGHT = 1.15;

export function puppyArtworkUrl(id) {
  return PUPPY_ARTWORK[id] || PUPPY_ARTWORK.biscuit;
}

export function puppyPoseArtworkUrl(id, pose = 'idle') {
  const variants = PUPPY_ARTWORK_VARIANTS[id] || PUPPY_ARTWORK_VARIANTS.biscuit;
  if (variants[pose]) return variants[pose];
  const basePose = typeof pose === 'string' && pose.endsWith('Alt') ? pose.slice(0, -3) : null;
  const alternates = PUPPY_ARTWORK_ALTERNATES[id] || PUPPY_ARTWORK_ALTERNATES.biscuit;
  return (basePose && alternates[basePose]) || variants.idle;
}

function sourceSize(texture) {
  const image = texture?.image;
  return {
    width: image?.naturalWidth || image?.videoWidth || image?.width || 0,
    height: image?.naturalHeight || image?.videoHeight || image?.height || 0,
  };
}

// iPhone/WebKit can evict a WebGL context when several full-size illustrated
// poses are decoded at once. Gameplay sprites are never displayed larger than
// a few hundred CSS pixels, so a compact canvas keeps the same painted edges
// while cutting the decoded/GPU footprint dramatically on coarse-pointer
// devices. Desktop keeps the source resolution untouched.
function compactTexture(texture, maxDimension = 0) {
  if (!maxDimension || typeof document === 'undefined') return texture;
  const {width, height} = sourceSize(texture);
  if (!width || !height || Math.max(width, height) <= maxDimension) return texture;
  try {
    const scale = maxDimension / Math.max(width, height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) return texture;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
    const compact = new THREE.CanvasTexture(canvas);
    texture.dispose();
    return compact;
  } catch {
    // A restricted/managed browser may not expose a 2D canvas. Keep the
    // original texture and let the normal renderer path continue.
    return texture;
  }
}

function pixelRect(rect, width, height) {
  return {
    x: rect[0] * width,
    y: rect[1] * height,
    width: rect[2] * width,
    height: rect[3] * height,
  };
}

function pixelPoint(point, width, height) {
  return {x: point[0] * width, y: point[1] * height};
}

function prepareTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.magFilter = THREE.LinearFilter;
  // The source illustrations are intentionally not power-of-two. A linear
  // NPOT sampler is portable across WebGL 1 and WebGL 2 phones and avoids a
  // second mip pyramid for every articulated part.
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function cropTexture(texture, rect, width, height) {
  const crop = prepareTexture(texture.clone());
  crop.repeat.set(rect.width / width, rect.height / height);
  // Three's texture origin is the lower-left corner while our crop data is
  // intentionally written in the readable top-left image coordinate system.
  crop.offset.set(rect.x / width, 1 - (rect.y + rect.height) / height);
  crop.needsUpdate = true;
  return crop;
}

function drawHeadMask(context, width, height, layout, cropRect = {x:0,y:0}) {
  const [faceX, faceY, faceWidth, faceHeight] = layout.body.face;
  context.beginPath();
  context.ellipse(
    faceX * width - cropRect.x,
    faceY * height - cropRect.y,
    faceWidth * width,
    faceHeight * height,
    0,
    0,
    Math.PI * 2,
  );
}

function drawCropMask(context, rect, inset = 0) {
  const x = rect.x + rect.width * inset;
  const y = rect.y + rect.height * inset;
  const right = rect.x + rect.width * (1 - inset);
  const bottom = rect.y + rect.height * (1 - inset);
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(right, y);
  context.lineTo(right, bottom);
  context.lineTo(x, bottom);
  context.closePath();
  context.fill();
}

function headRectFor(layout, width, height) {
  const crop = layout?.body?.head;
  if (Array.isArray(crop) && crop.length === 4) return pixelRect(crop, width, height);
  const [x, y, radiusX, radiusY] = layout.body.face;
  return pixelRect([
    Math.max(0, x - radiusX - .02),
    Math.max(0, y - radiusY - .02),
    Math.min(1, radiusX * 2 + .04),
    Math.min(1, radiusY * 2 + .04),
  ], width, height);
}

function maskedBodyTexture(texture, key) {
  const {width, height} = sourceSize(texture);
  if (!width || !height || typeof document === 'undefined') return texture;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return texture;
  const layout = PUPPY_ARTWORK_LAYOUTS[key];
  // Start with the actual illustration instead of repainting a generic oval.
  // We then punch out only the articulated pieces. This preserves every
  // painted fur edge in the torso and prevents the old mask from leaving a
  // second set of paws underneath the moving crops.
  context.drawImage(texture.image, 0, 0, width, height);
  context.save();
  context.globalCompositeOperation = 'destination-out';
  drawHeadMask(context, width, height, layout);
  context.fill();
  for (const ear of layout.body.ears) {
    drawCropMask(context, pixelRect(ear.crop, width, height), .02);
  }
  for (const leg of layout.legs) {
    const rect = pixelRect(leg.crop, width, height);
    // Leave a soft shoulder overlap for the reinserted crop. Erasing only the
    // lower 88% keeps the torso fur continuous at the joint.
    const start = rect.y + rect.height * .12;
    drawCropMask(context, {x:rect.x, y:start, width:rect.width, height:rect.y + rect.height - start}, .025);
  }
  drawCropMask(context, pixelRect(layout.tail.crop, width, height), .025);
  context.restore();
  const body = new THREE.CanvasTexture(canvas);
  return prepareTexture(body);
}

function maskedHeadTexture(texture, key) {
  const {width, height} = sourceSize(texture);
  if (!width || !height || typeof document === 'undefined') return texture;
  const rect = headRectFor(PUPPY_ARTWORK_LAYOUTS[key], width, height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rect.width));
  canvas.height = Math.max(1, Math.round(rect.height));
  const context = canvas.getContext('2d');
  if (!context) return texture;
  context.save();
  drawHeadMask(context, width, height, PUPPY_ARTWORK_LAYOUTS[key], rect);
  context.clip();
  context.drawImage(
    texture.image,
    rect.x, rect.y, rect.width, rect.height,
    0, 0, canvas.width, canvas.height,
  );
  context.restore();
  const head = new THREE.CanvasTexture(canvas);
  return prepareTexture(head);
}

function makeMaterial() {
  return new THREE.SpriteMaterial({
    color: '#ffffff',
    transparent: true,
    alphaTest: 0.03,
    depthTest: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
}

// Costumes are intentionally painted as small, transparent accessory plates
// instead of being assembled from the old low-poly rig.  The puppy remains
// the supplied illustration; these plates only add a scarf, hat, cape, coat
// or pack and leave enough of the fur texture visible that the outfit feels
// worn, not pasted over the face.
function accessoryTexture(key, costume, layer) {
  if (typeof document === 'undefined' || !costume) return null;
  const activeLayers = {
    scarf: ['mid'],
    explorer: ['back', 'top'],
    hero: ['back', 'top'],
    raincoat: ['mid'],
    royal: ['top'],
    party: ['top'],
  }[costume];
  if (!activeLayers?.includes(layer)) return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 384;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const s = canvas.width;
  const px = value => value * s;
  const roundRect = (x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(px(x + r), px(y));
    context.arcTo(px(x + width), px(y), px(x + width), px(y + height), px(r));
    context.arcTo(px(x + width), px(y + height), px(x), px(y + height), px(r));
    context.arcTo(px(x), px(y + height), px(x), px(y), px(r));
    context.arcTo(px(x), px(y), px(x + width), px(y), px(r));
    context.closePath();
  };
  const fillStroke = (fill, stroke = '#3b2b28', line = .012) => {
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = px(line);
    context.lineJoin = 'round';
    context.stroke();
  };
  const path = commands => {
    context.beginPath();
    for (const command of commands) {
      if (command[0] === 'M') context.moveTo(px(command[1]), px(command[2]));
      else if (command[0] === 'L') context.lineTo(px(command[1]), px(command[2]));
      else if (command[0] === 'C') context.bezierCurveTo(...command.slice(1).map(px));
      else if (command[0] === 'Q') context.quadraticCurveTo(...command.slice(1).map(px));
      else if (command[0] === 'Z') context.closePath();
    }
  };
  const gradient = (from, to, y = .4) => {
    const result = context.createLinearGradient(0, px(y - .2), 0, px(y + .35));
    result.addColorStop(0, from); result.addColorStop(1, to); return result;
  };
  // The slight key-specific hue shifts keep each puppy's wardrobe from
  // feeling cloned while the silhouettes stay consistent across the roster.
  const ink = key === 'luna' ? '#24303d' : '#3b2b28';
  if (costume === 'scarf') {
    // Mochi's supplied painting already has a beautifully rendered blue
    // collar and tag. Leave that artwork untouched; a procedural red overlay
    // looked like a sticker on the flank at gameplay scale.
    return null;
  } else if (costume === 'explorer') {
    if (layer === 'back') {
      // Rounded pack tucked behind the shoulder, with visible straps and a
      // small buckle instead of the old floating rectangular block.
      context.strokeStyle = '#526239'; context.lineWidth = px(.022);
      context.beginPath(); context.arc(px(.57), px(.49), px(.14), 0, Math.PI * 2); context.stroke();
      roundRect(.54, .41, .25, .27, .055);
      fillStroke(gradient('#829b5d', '#405334', .42), ink, .012);
      roundRect(.58, .46, .17, .12, .025);
      fillStroke('#d8bc79', '#526239', .008);
      context.fillStyle = '#f3dc9d'; context.fillRect(px(.645), px(.49), px(.04), px(.045));
    } else if (layer === 'top') {
      // A soft brim and crown sit above the forehead, never across the eyes.
      context.beginPath(); context.ellipse(px(.32), px(.18), px(.19), px(.035), 0, 0, Math.PI * 2);
      fillStroke('#a77b43', ink, .012);
      roundRect(.22, .105, .20, .08, .035);
      fillStroke(gradient('#d3aa68', '#876039', .12), ink, .012);
      context.fillStyle = '#6e4d32'; context.fillRect(px(.23), px(.145), px(.18), px(.018));
    }
  } else if (costume === 'hero') {
    if (layer === 'back') {
      path([
        ['M', .40, .41], ['C', .55, .43, .72, .48, .86, .53],
        ['C', .82, .64, .78, .73, .69, .82], ['C', .61, .75, .53, .67, .48, .58], ['Z'],
      ]);
      fillStroke(gradient('#5cb1f5', '#2166bd', .43), ink, .012);
      context.strokeStyle = '#a8dcff'; context.lineWidth = px(.012);
      context.beginPath(); context.moveTo(px(.54), px(.50)); context.quadraticCurveTo(px(.68), px(.57), px(.73), px(.70)); context.stroke();
    } else if (layer === 'top') {
      context.beginPath(); context.arc(px(.40), px(.41), px(.035), 0, Math.PI * 2); fillStroke('#ffe47f', ink, .01);
      context.beginPath(); context.arc(px(.40), px(.41), px(.014), 0, Math.PI * 2); context.fillStyle = '#ef9f41'; context.fill();
    }
  } else if (costume === 'raincoat' && layer === 'mid') {
    // The coat is a translucent bib following the chest; fur texture remains
    // visible through the lower edge so it reads as fabric, not a yellow orb.
    path([
      ['M', .36, .64], ['C', .47, .60, .65, .61, .77, .66],
      ['L', .78, .82], ['C', .64, .88, .45, .86, .34, .77], ['Z'],
    ]);
    fillStroke(gradient('rgba(255,225,108,.90)', 'rgba(226,164,39,.72)', .62), ink, .012);
    context.strokeStyle = '#fff0a7'; context.lineWidth = px(.012);
    context.beginPath(); context.moveTo(px(.38), px(.68)); context.quadraticCurveTo(px(.57), px(.73), px(.76), px(.69)); context.stroke();
    context.fillStyle = '#3e91a0'; context.fillRect(px(.50), px(.63), px(.09), px(.025));
  } else if (costume === 'royal' && layer === 'top') {
    path([
      ['M', .20, .18], ['L', .22, .055], ['L', .30, .13], ['L', .38, .035],
      ['L', .46, .13], ['L', .54, .07], ['L', .55, .18], ['Z'],
    ]);
    fillStroke(gradient('#ffe98f', '#d69a2d', .06), ink, .012);
    context.fillStyle = '#e65752'; context.beginPath(); context.arc(px(.38), px(.12), px(.018), 0, Math.PI * 2); context.fill();
    context.fillStyle = '#fff5b8'; context.fillRect(px(.24), px(.17), px(.28), px(.025));
  } else if (costume === 'party' && layer === 'top') {
    path([
      ['M', .29, .23], ['L', .40, .035], ['L', .52, .23], ['Z'],
    ]);
    fillStroke(gradient('#e89af7', '#9f4ecb', .04), ink, .012);
    context.strokeStyle = '#ffd7ff'; context.lineWidth = px(.012);
    context.beginPath(); context.moveTo(px(.34), px(.19)); context.lineTo(px(.47), px(.19)); context.stroke();
    context.fillStyle = '#fff1a8'; context.beginPath(); context.arc(px(.40), px(.027), px(.03), 0, Math.PI * 2); context.fill();
  }
  return prepareTexture(new THREE.CanvasTexture(canvas));
}

function setSpriteMap(sprite, texture) {
  sprite.material.map = texture;
  sprite.material.needsUpdate = true;
  sprite.visible = Boolean(texture);
}

function worldX(pixel, width, unit) {
  return (pixel - width / 2) * unit;
}

function worldY(pixel, height, unit) {
  return WORLD_HEIGHT / 2 + (height / 2 - pixel) * unit;
}

// Load the equipped artwork once, then drive a compact full-body pose stack.
// The legacy crop parts are still prepared for diagnostics and API stability,
// but the runner never rotates them into visible anatomy.
export function createPuppyArtwork({mobile = false} = {}) {
  const group = new THREE.Group();
  group.name = 'puppy-illustrated-pose-stack';
  const loader = new THREE.TextureLoader();
  const sourceTextures = new Map();
  const bodyTextures = new Map();
  const headTextures = new Map();
  const partTextures = new Map();
  const prepared = new Set();
  const bodyMaterial = makeMaterial();
  const bodySprite = new THREE.Sprite(bodyMaterial);
  bodySprite.name = 'puppy-painted-body';
  bodySprite.position.y = WORLD_HEIGHT / 2;
  bodySprite.frustumCulled = false;
  bodySprite.visible = false;
  bodySprite.renderOrder = 2;
  group.add(bodySprite);

  // The visible puppy is now a tiny full-body pose stack. Each frame is a
  // complete painted illustration, so animation never exposes a rectangular
  // crop edge or a floating ear. We switch between crisp authored frames and
  // add only a restrained whole-body bounce/lean; cross-fading mismatched
  // transparent bounds made the old version look like a ghost.
  const strideSprite = new THREE.Sprite(makeMaterial());
  strideSprite.name = 'puppy-painted-stride-pose';
  strideSprite.frustumCulled = false;
  strideSprite.visible = false;
  strideSprite.renderOrder = 2.02;
  group.add(strideSprite);
  const jumpSprite = new THREE.Sprite(makeMaterial());
  jumpSprite.name = 'puppy-painted-jump-pose';
  jumpSprite.frustumCulled = false;
  jumpSprite.visible = false;
  jumpSprite.renderOrder = 2.03;
  group.add(jumpSprite);
  const slideSprite = new THREE.Sprite(makeMaterial());
  slideSprite.name = 'puppy-painted-slide-pose';
  slideSprite.frustumCulled = false;
  slideSprite.visible = false;
  slideSprite.renderOrder = 2.035;
  group.add(slideSprite);
  const turnSprite = new THREE.Sprite(makeMaterial());
  turnSprite.name = 'puppy-painted-turn-pose';
  turnSprite.frustumCulled = false;
  turnSprite.visible = false;
  turnSprite.renderOrder = 2.05;
  group.add(turnSprite);
  const hangSprite = new THREE.Sprite(makeMaterial());
  hangSprite.name = 'puppy-painted-hang-pose';
  hangSprite.frustumCulled = false;
  hangSprite.visible = false;
  hangSprite.renderOrder = 2.055;
  group.add(hangSprite);
  const awaySprite = new THREE.Sprite(makeMaterial());
  awaySprite.name = 'puppy-painted-away-pose';
  awaySprite.frustumCulled = false;
  awaySprite.visible = false;
  awaySprite.renderOrder = 2.06;
  group.add(awaySprite);
  const strideAltSprite = new THREE.Sprite(makeMaterial());
  strideAltSprite.name = 'puppy-painted-stride-alt-pose';
  strideAltSprite.frustumCulled = false;
  strideAltSprite.visible = false;
  strideAltSprite.renderOrder = 2.021;
  group.add(strideAltSprite);
  // All generated second beats share one streaming sprite.  Only the action
  // that is currently being played is resident here, keeping the texture
  // footprint bounded even as the roster gains more authored poses.
  const alternateSprite = new THREE.Sprite(makeMaterial());
  alternateSprite.name = 'puppy-painted-action-alt-pose';
  alternateSprite.frustumCulled = false;
  alternateSprite.visible = false;
  alternateSprite.renderOrder = 2.022;
  group.add(alternateSprite);
  const poseSprites = {
    idle: bodySprite,
    stride: strideSprite,
    jump: jumpSprite,
    slide: slideSprite,
    turn: turnSprite,
    hang: hangSprite,
    away: awaySprite,
    strideAlt: strideAltSprite,
    alternate: alternateSprite,
  };

  const headGroup = new THREE.Group();
  headGroup.name = 'puppy-painted-head-joint';
  const headSprite = new THREE.Sprite(makeMaterial());
  headSprite.name = 'puppy-painted-head';
  headSprite.frustumCulled = false;
  headSprite.visible = false;
  headSprite.renderOrder = 4;
  headGroup.add(headSprite);
  group.add(headGroup);

  const earGroups = [0, 1].map(index => {
    const earGroup = new THREE.Group();
    earGroup.name = `puppy-painted-ear-${index}`;
    const sprite = new THREE.Sprite(makeMaterial());
    sprite.name = `puppy-painted-ear-${index}-raster`;
    sprite.frustumCulled = false;
    sprite.visible = false;
    sprite.renderOrder = 4.1 + index * .01;
    earGroup.add(sprite);
    headGroup.add(earGroup);
    return {group: earGroup, sprite, basePosition: new THREE.Vector3(), baseScale: new THREE.Vector3()};
  });

  const tailGroup = new THREE.Group();
  tailGroup.name = 'puppy-painted-tail-joint';
  tailGroup.renderOrder = 1;
  const tailSprite = new THREE.Sprite(makeMaterial());
  tailSprite.name = 'puppy-painted-tail';
  tailSprite.frustumCulled = false;
  tailSprite.visible = false;
  tailSprite.renderOrder = 1;
  tailGroup.add(tailSprite);
  group.add(tailGroup);

  const accessorySprites = {
    back: new THREE.Sprite(makeMaterial()),
    mid: new THREE.Sprite(makeMaterial()),
    top: new THREE.Sprite(makeMaterial()),
  };
  accessorySprites.back.name = 'puppy-painted-accessories-back';
  accessorySprites.mid.name = 'puppy-painted-accessories-mid';
  accessorySprites.top.name = 'puppy-painted-accessories-top';
  accessorySprites.back.frustumCulled = accessorySprites.mid.frustumCulled = accessorySprites.top.frustumCulled = false;
  accessorySprites.back.renderOrder = 1.5;
  accessorySprites.mid.renderOrder = 2.5;
  accessorySprites.top.renderOrder = 5;
  accessorySprites.back.position.y = accessorySprites.mid.position.y = accessorySprites.top.position.y = WORLD_HEIGHT / 2;
  group.add(accessorySprites.back, accessorySprites.mid, accessorySprites.top);

  const legGroups = [0, 1, 2, 3].map(index => {
    const legGroup = new THREE.Group();
    legGroup.name = `puppy-painted-leg-${index}`;
    legGroup.renderOrder = 3 + index * .01;
    const sprite = new THREE.Sprite(makeMaterial());
    sprite.name = `puppy-painted-leg-${index}-raster`;
    sprite.frustumCulled = false;
    sprite.visible = false;
    sprite.renderOrder = 3 + index * .01;
    legGroup.add(sprite);
    group.add(legGroup);
    return {group: legGroup, sprite, basePosition: new THREE.Vector3(), baseScale: new THREE.Vector3()};
  });

  let currentKey = 'biscuit';
  let currentCostume = 'scarf';
  const accessoryTextures = new Map();
  const poseTextures = new Map();
  const poseLoads = new Set();
  const sourceLoadTokens = new Map();
  const maxTextureDimension = mobile ? 768 : 0;
  // A kennel preview can visit several puppies before the next run. Keep
  // their idle source images available for an instant swap, but release old
  // action/costume/crop textures on coarse-pointer devices. Without this
  // small cache boundary, every jump/slide/turn preview could leave another
  // set of decoded WebGL textures resident until iOS evicted the context.
  function disposeTexture(texture, protectedTexture, disposed) {
    if (!texture || texture === protectedTexture || disposed.has(texture)) return;
    disposed.add(texture);
    texture.dispose?.();
  }
  function pruneMobileCaches(keepKey) {
    if (!mobile) return;
    const disposed = new Set();
    for (const [key, map] of poseTextures) {
      if (key === keepKey) continue;
      const source = sourceTextures.get(key);
      for (const texture of map.values()) disposeTexture(texture, source, disposed);
      poseTextures.delete(key);
      for (const token of poseLoads)
        if (token.startsWith(`${key}:`)) poseLoads.delete(token);
    }
    for (const [cacheKey, texture] of accessoryTextures) {
      if (cacheKey.startsWith(`${keepKey}:`)) continue;
      disposeTexture(texture, null, disposed);
      accessoryTextures.delete(cacheKey);
    }
    for (const [key, texture] of bodyTextures) {
      if (key === keepKey) continue;
      disposeTexture(texture, sourceTextures.get(key), disposed);
      bodyTextures.delete(key);
    }
    for (const [key, texture] of headTextures) {
      if (key === keepKey) continue;
      disposeTexture(texture, sourceTextures.get(key), disposed);
      headTextures.delete(key);
    }
    for (const [cacheKey, texture] of partTextures) {
      if (cacheKey.startsWith(`${keepKey}:`)) continue;
      const key = cacheKey.split(':', 1)[0];
      disposeTexture(texture, sourceTextures.get(key), disposed);
      partTextures.delete(cacheKey);
    }
    // Idle paintings are also GPU resources once the sprite has rendered.
    // Drop them with the rest of the inactive puppy so a long kennel session
    // cannot accumulate one 768px texture per dog. A request token prevents
    // a late image callback from resurrecting a discarded source.
    for (const [key, texture] of sourceTextures) {
      if (key === keepKey) continue;
      sourceLoadTokens.delete(key);
      disposeTexture(texture, null, disposed);
      sourceTextures.delete(key);
      prepared.delete(key);
    }
  }
  const poseBaseScales = {
    idle: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    stride: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    strideAlt: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    jump: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    jumpAlt: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    slide: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    slideAlt: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    turn: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    turnAlt: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    hang: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    hangAlt: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    away: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
    raftAlt: new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1),
  };
  const poseBasePositions = {
    idle: new THREE.Vector3(),
    stride: new THREE.Vector3(),
    strideAlt: new THREE.Vector3(),
    jump: new THREE.Vector3(),
    jumpAlt: new THREE.Vector3(),
    slide: new THREE.Vector3(),
    slideAlt: new THREE.Vector3(),
    turn: new THREE.Vector3(),
    turnAlt: new THREE.Vector3(),
    hang: new THREE.Vector3(),
    hangAlt: new THREE.Vector3(),
    away: new THREE.Vector3(),
    raftAlt: new THREE.Vector3(),
  };
  const poseHandleDrops = {hang: 0, hangAlt: 0};
  const alternateSlot = {
    key: null,
    pose: null,
    texture: null,
    loading: false,
    token: 0,
  };
  let bodyBaseScale = new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1);
  let headBaseScale = new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1);
  const bodyBasePosition = new THREE.Vector3(0, WORLD_HEIGHT / 2, 0);
  const headBasePosition = new THREE.Vector3();

  function accessoryFor(key, costume, layer) {
    const cacheKey = `${key}:${costume}:${layer}`;
    if (!accessoryTextures.has(cacheKey)) accessoryTextures.set(cacheKey, accessoryTexture(key, costume, layer));
    return accessoryTextures.get(cacheKey);
  }

  function poseMapFor(key) {
    if (!poseTextures.has(key)) poseTextures.set(key, new Map());
    return poseTextures.get(key);
  }

  function basePoseFor(pose) {
    return pose?.endsWith('Alt') ? pose.slice(0, -3) : pose;
  }

  function alternateUrlFor(key, pose) {
    return PUPPY_ARTWORK_ALTERNATES[key]?.[pose] || null;
  }

  function clearAlternateSlot() {
    alternateSlot.token += 1;
    if (alternateSlot.texture) alternateSlot.texture.dispose();
    alternateSlot.key = null;
    alternateSlot.pose = null;
    alternateSlot.texture = null;
    alternateSlot.loading = false;
    alternateSprite.material.map = null;
    alternateSprite.material.needsUpdate = true;
    alternateSprite.material.opacity = 0;
    alternateSprite.visible = false;
  }

  function requestAlternate(key, pose) {
    const url = alternateUrlFor(key, pose);
    if (!url) return null;
    if (alternateSlot.key === key && alternateSlot.pose === pose) {
      return alternateSlot.texture;
    }
    clearAlternateSlot();
    const token = alternateSlot.token;
    alternateSlot.key = key;
    alternateSlot.pose = pose;
    alternateSlot.loading = true;
    loader.load(url, loaded => {
      if (token !== alternateSlot.token || alternateSlot.key !== key || alternateSlot.pose !== pose) {
        loaded.dispose();
        return;
      }
      alternateSlot.loading = false;
      alternateSlot.texture = prepareTexture(compactTexture(loaded, maxTextureDimension));
      configurePoseSprite(alternateSprite, `${pose}Alt`, alternateSlot.texture, key);
    });
    return null;
  }

  function alternateReady(key, pose) {
    const activePose = `${pose}Alt`;
    const {width, height} = sourceSize(alternateSlot.texture);
    return alternateSlot.key === key
      && alternateSlot.pose === pose
      && Boolean(alternateSlot.texture && width && height && poseBaseScales[activePose]?.x > 0);
  }

  function frameBoundsFor(key, pose, width, height) {
    const frame = PUPPY_ARTWORK_BOUNDS[key]?.[pose];
    if (frame && frame.width === width && frame.height === height) return frame;
    // Mobile paintings are drawn into a smaller canvas with the same aspect
    // ratio. Scale the measured alpha bounds instead of falling back to the
    // entire canvas, which would make a compact pose pop during a swap.
    if (frame && frame.width && frame.height
      && Math.abs(frame.width / frame.height - width / height) < .01) {
      const scaleX = width / frame.width;
      const scaleY = height / frame.height;
      return {
        width,
        height,
        x: frame.x * scaleX,
        y: frame.y * scaleY,
        boxWidth: frame.boxWidth * scaleX,
        boxHeight: frame.boxHeight * scaleY,
      };
    }
    return {width, height, x: 0, y: 0, boxWidth: width, boxHeight: height};
  }

  function configurePoseSprite(sprite, pose, texture, key = currentKey) {
    if (!texture) {
      // Optional poses (Mochi's rear chase frame is the only `away` one) do
      // not exist for every dog. Clear the previous dog's map as well as its
      // visibility so a rapid clubhouse swap can never show stale artwork.
      setSpriteMap(sprite, null);
      sprite.material.opacity = 0;
      return;
    }
    const {width, height} = sourceSize(texture);
    if (!width || !height) {
      setSpriteMap(sprite, null);
      sprite.material.opacity = 0;
      return;
    }
    const scale = poseBaseScales[pose] || new THREE.Vector3();
    const basePose = basePoseFor(pose);
    const idleSize = sourceSize(sourceTextures.get(key));
    const idle = frameBoundsFor(key, 'idle', idleSize.width || width, idleSize.height || height);
    const frame = frameBoundsFor(key, pose, width, height);
    // Normalize the opaque bounds instead of the transparent canvas. The
    // authored pose can still change silhouette, but swapping frames no
    // longer makes the puppy pop larger, smaller, or off the ground.
    const idleWidth = idle.boxWidth / idle.width;
    const idleHeight = idle.boxHeight / idle.height;
    const frameWidth = frame.boxWidth / frame.width;
    const frameHeight = frame.boxHeight / frame.height;
    scale.set(
      bodyBaseScale.x * idleWidth / frameWidth,
      bodyBaseScale.y * idleHeight / frameHeight,
      1,
    );

    const idleCenterX = (idle.x + idle.boxWidth / 2) / idle.width;
    const idleBottom = (idle.y + idle.boxHeight) / idle.height;
    const frameCenterX = (frame.x + frame.boxWidth / 2) / frame.width;
    const frameBottom = (frame.y + frame.boxHeight) / frame.height;
    // Keep the visible center and paw baseline stable while retaining each
    // painting's original transparent margin.
    const targetX = bodyBasePosition.x + (idleCenterX - .5) * bodyBaseScale.x;
    const targetBottom = bodyBasePosition.y + (.5 - idleBottom) * bodyBaseScale.y;
    const basePosition = poseBasePositions[pose] || new THREE.Vector3();
    const depth = basePose === 'idle'
      ? 0
      : basePose === 'stride'
        ? .018
        : basePose === 'jump'
          ? .03
          : basePose === 'slide'
            ? .024
          : basePose === 'turn'
              ? .036
              : basePose === 'raft'
                ? .046
              : .042;
    basePosition.set(
      targetX - (frameCenterX - .5) * scale.x,
      targetBottom - (.5 - frameBottom) * scale.y,
      depth,
    );
    if (basePose === 'hang') {
      // The top of the visible alpha bounds represents the raised paws. Align
      // that point to the handle height so a newly authored frame can change
      // canvas proportions without requiring another hand-tuned magic drop.
      const frameTop = frame.y / frame.height;
      const topPosition = basePosition.y + (.5 - frameTop) * scale.y;
      poseHandleDrops[pose] = PUPPY_HANG_HANDLE_HEIGHT - topPosition;
    }
    sprite.scale.copy(scale);
    sprite.position.copy(basePosition);
    sprite.center.set(.5, .5);
    setSpriteMap(sprite, texture);
    // A loaded pose is not necessarily the pose the renderer is showing this
    // frame. Keep non-active paintings hidden until setPose selects them. This
    // matters on iOS: assigning every loaded image to a visible Sprite makes
    // WebGL upload the whole action catalog at once, even when opacity is 0.
    // Hidden sprites retain their maps and become visible instantly when the
    // corresponding physics state asks for them.
    sprite.visible = pose === 'idle' || group.userData.activePose === pose;
    sprite.material.opacity = pose === 'idle' ? 1 : 0;
  }

  function requestPose(key, pose) {
    const variants = PUPPY_ARTWORK_VARIANTS[key] || PUPPY_ARTWORK_VARIANTS.biscuit;
    // Optional poses are real variants only for the puppy that owns them.
    // Falling back to idle here would silently allocate another idle texture
    // for every other puppy and make a missing rear frame look like a broken
    // direction change.
    const url = variants[pose];
    if (!url) return null;
    const map = poseMapFor(key);
    if (map.has(pose)) return map.get(pose);
    // Idle shares the already-loaded source texture. Other poses are loaded
    // lazily so a first visit does not pay for every puppy's turn-around art.
    if (pose === 'idle') {
      const texture = sourceTextures.get(key);
      if (texture) map.set(pose, texture);
      return texture;
    }
    if (!poseLoads.has(`${key}:${pose}`)) {
      poseLoads.add(`${key}:${pose}`);
      const texture = loader.load(url, loaded => {
        const compact = compactTexture(loaded, maxTextureDimension);
        // The player may have changed puppies while this network request was
        // in flight. Do not repopulate a pruned action cache on mobile; release
        // that texture and let a future selection request it again if needed.
        if (mobile && key !== currentKey && !poseTextures.has(key)) {
          compact.dispose?.();
          poseLoads.delete(`${key}:${pose}`);
          return;
        }
        prepareTexture(compact);
        map.set(pose, compact);
        if (currentKey === key) {
          configurePoseSprite(poseSprites[pose], pose, compact, key);
        }
      });
      map.set(pose, prepareTexture(texture));
    }
    return map.get(pose);
  }

  function configurePoseStack(key, texture) {
    const map = poseMapFor(key);
    map.set('idle', texture);
    // Keep the first paint small. Idle and the next ground stride are enough
    // to make the camp and opening run feel alive; jumps, slides, turns,
    // hangs, and Mochi's rear view stream only when the physics requests them.
    // The previous eager loop loaded eight large paintings before the player
    // had even tapped Play, which could exhaust an iPhone GPU texture budget.
    for (const pose of ['idle', 'stride']) {
      const poseTexture = requestPose(key, pose);
      configurePoseSprite(poseSprites[pose], pose, poseTexture, key);
    }
    for (const pose of ['jump', 'slide', 'turn', 'hang', 'away', 'strideAlt']) {
      const sprite = poseSprites[pose];
      configurePoseSprite(sprite, pose, null, key);
    }
    poseSprites.idle.material.opacity = 1;
    poseSprites.stride.material.opacity = 0;
    poseSprites.jump.material.opacity = 0;
    poseSprites.slide.material.opacity = 0;
    poseSprites.turn.material.opacity = 0;
    poseSprites.hang.material.opacity = 0;
    poseSprites.away.material.opacity = 0;
    poseSprites.strideAlt.material.opacity = 0;
    poseSprites.alternate.material.opacity = 0;
  }

  function configureAccessories(key, costume = currentCostume) {
    currentCostume = costume || 'scarf';
    for (const [layer, sprite] of Object.entries(accessorySprites)) {
      const texture = accessoryFor(key, currentCostume, layer);
      setSpriteMap(sprite, texture);
      sprite.position.set(bodyBasePosition.x, bodyBasePosition.y, layer === 'back' ? -.018 : layer === 'mid' ? .022 : .055);
      sprite.scale.copy(bodyBaseScale);
    }
  }

  function configureParts(key, texture) {
    const layout = PUPPY_ARTWORK_LAYOUTS[key];
    const {width, height} = sourceSize(texture);
    if (!layout || !width || !height) return;
    const unit = WORLD_HEIGHT / height;
    const bodyWidth = width * unit;
    bodyBaseScale.set(bodyWidth, WORLD_HEIGHT, 1);
    clearAlternateSlot();
    bodySprite.scale.copy(bodyBaseScale);
    bodySprite.position.copy(bodyBasePosition);
    // Use the untouched full-body painting for the idle pose. The old masked
    // torso remains prepared for backwards-compatible diagnostics, but it is
    // no longer part of the visible animation stack.
    setSpriteMap(bodySprite, texture);
    configurePoseStack(key, texture);
    headGroup.visible = false;
    tailGroup.visible = false;
    earGroups.forEach(item => { item.group.visible = false; });
    legGroups.forEach(item => { item.group.visible = false; });

    const faceRoot = pixelPoint(layout.body.root, width, height);
    headBasePosition.set(worldX(faceRoot.x, width, unit), worldY(faceRoot.y, height, unit), .045);
    headGroup.position.copy(headBasePosition);
    const headRect = headRectFor(layout, width, height);
    headBaseScale.set(headRect.width * unit, headRect.height * unit, 1);
    headSprite.scale.copy(headBaseScale);
    // The head texture is cropped to its painted pixels. Re-anchor its center
    // to the same cheek root so tightening the crop never shifts the puppy.
    headSprite.center.set(
      (faceRoot.x - headRect.x) / headRect.width,
      1 - (faceRoot.y - headRect.y) / headRect.height,
    );
    headSprite.position.set(0, 0, 0);
    setSpriteMap(headSprite, headTextures.get(key) || texture);

    layout.body.ears.forEach((ear, index) => {
      const rect = pixelRect(ear.crop, width, height);
      const root = pixelPoint(ear.root, width, height);
      const item = earGroups[index];
      item.group.position.set(
        (root.x - faceRoot.x) * unit,
        -(root.y - faceRoot.y) * unit,
        .012 + index * .001,
      );
      item.basePosition.copy(item.group.position);
      item.sprite.center.set(.5, 1 - (root.y - rect.y) / rect.height);
      item.sprite.position.set(0, 0, 0);
      item.sprite.scale.set(rect.width * unit, rect.height * unit, 1);
      item.baseScale.copy(item.sprite.scale);
      setSpriteMap(item.sprite, partTextures.get(`${key}:ear:${index}`));
      item.sprite.material.rotation = 0;
    });

    const tailRect = pixelRect(layout.tail.crop, width, height);
    const tailRoot = pixelPoint(layout.tail.root, width, height);
    tailGroup.position.set(worldX(tailRoot.x, width, unit), worldY(tailRoot.y, height, unit), .012);
    tailSprite.center.set(.5, 1 - (tailRoot.y - tailRect.y) / tailRect.height);
    tailSprite.position.set(0, 0, 0);
    tailSprite.scale.set(tailRect.width * unit, tailRect.height * unit, 1);
    setSpriteMap(tailSprite, partTextures.get(`${key}:tail`));

    layout.legs.forEach((leg, index) => {
      const rect = pixelRect(leg.crop, width, height);
      const root = pixelPoint(leg.root, width, height);
      const item = legGroups[index];
      item.group.position.set(worldX(root.x, width, unit), worldY(root.y, height, unit), .035 + index * .001);
      item.basePosition.copy(item.group.position);
      item.sprite.scale.set(rect.width * unit, rect.height * unit, 1);
      item.baseScale.copy(item.sprite.scale);
      setSpriteMap(item.sprite, partTextures.get(`${key}:leg:${index}`));
      item.sprite.center.set(.5, 1 - (root.y - rect.y) / rect.height);
      item.sprite.position.set(0, 0, 0);
      item.group.rotation.set(0, 0, 0);
      item.sprite.material.rotation = 0;
    });
  }

  function prepare(key, texture) {
    if (prepared.has(key)) return;
    texture = compactTexture(texture, maxTextureDimension);
    // Replace the loader's full-size placeholder with the compact texture so
    // every later pose lookup and the idle frame share the lower-memory image.
    sourceTextures.set(key, texture);
    const {width, height} = sourceSize(texture);
    if (!width || !height) return;
    prepared.add(key);
    prepareTexture(texture);
    // The crop rig remains available on desktop for legacy diagnostics. The
    // live runner hides those parts, so avoid creating nine extra CanvasTexture
    // objects per puppy on mobile; the complete pose sprite is all that is
    // visible and is already compacted above.
    if (!mobile) {
      bodyTextures.set(key, maskedBodyTexture(texture, key));
      headTextures.set(key, maskedHeadTexture(texture, key));
      const layout = PUPPY_ARTWORK_LAYOUTS[key];
      const tailRect = pixelRect(layout.tail.crop, width, height);
      partTextures.set(`${key}:tail`, cropTexture(texture, tailRect, width, height));
      layout.legs.forEach((leg, index) => {
        const rect = pixelRect(leg.crop, width, height);
        partTextures.set(`${key}:leg:${index}`, cropTexture(texture, rect, width, height));
      });
    }
    if (currentKey === key) {
      configureParts(key, texture);
      configureAccessories(key, currentCostume);
    }
  }

  function textureFor(id) {
    const key = Object.hasOwn(PUPPY_ARTWORK, id) ? id : 'biscuit';
    if (!sourceTextures.has(key)) {
      const token = Symbol(key);
      sourceLoadTokens.set(key, token);
      const texture = loader.load(puppyArtworkUrl(key), loaded => {
        const compact = compactTexture(loaded, maxTextureDimension);
        if (sourceLoadTokens.get(key) !== token) {
          compact.dispose?.();
          return;
        }
        sourceLoadTokens.delete(key);
        if (mobile && key !== currentKey) {
          compact.dispose?.();
          sourceTextures.delete(key);
          prepared.delete(key);
          return;
        }
        prepare(key, compact);
      });
      sourceTextures.set(key, prepareTexture(texture));
    }
    return {key, texture: sourceTextures.get(key)};
  }

  function apply(puppy) {
    const id = typeof puppy === 'string' ? puppy : puppy?.id;
    const nextKey = Object.hasOwn(PUPPY_ARTWORK, id) ? id : 'biscuit';
    pruneMobileCaches(nextKey);
    // Set the active key before starting a new image request. ImageLoader is
    // normally asynchronous, but a cached/managed browser can complete an
    // image callback during the same task; the callback must see the intended
    // puppy rather than the previous preview.
    currentKey = nextKey;
    const {key, texture} = textureFor(id);
    configureParts(key, texture);
    return key;
  }

  function setCostume(costume = 'scarf') {
    currentCostume = costume || 'scarf';
    configureAccessories(currentKey, currentCostume);
  }

  function setPose({
    time = 0,
    turn = 0,
    verticalVelocity = 0,
    impact = 0,
    airborne = false,
    sliding = false,
    hanging = false,
    rafting = false,
    away = false,
    side = false,
    menu = false,
    reducedMotion = false,
  } = {}) {
    const motion = reducedMotion ? 0 : 1;
    const look = THREE.MathUtils.clamp(turn, -1, 1);
    const vertical = Number.isFinite(verticalVelocity)
      ? THREE.MathUtils.clamp(verticalVelocity / 14, -1, 1)
      : 0;
    const landingPulse = motion && Number.isFinite(impact)
      ? THREE.MathUtils.clamp(impact * 4, 0, .36)
      : 0;
    const gaitRate = hanging ? 3.1 : rafting ? 3.6 : menu ? 2.8 : sliding ? 8.8 : airborne ? 7.2 : 8.4;
    const gait = motion ? (Math.sin(time * gaitRate - Math.PI / 2) + 1) / 2 : 0;
    const turnAmount = motion ? THREE.MathUtils.clamp((Math.abs(look) - .16) / .64, 0, 1) : 0;
    const poseReady = pose => {
      const sprite = pose === 'strideAlt'
        ? poseSprites.strideAlt
        : pose.endsWith('Alt')
          ? alternateSprite
          : poseSprites[pose];
      const {width, height} = sourceSize(sprite?.material?.map);
      const ready = Boolean(sprite?.material?.map && width && height && poseBaseScales[pose]?.x > 0);
      // Base action art is intentionally streamed. Calling requestPose here
      // is idempotent and lets the first jump/slide/turn start its own fetch
      // without preloading every large texture during the menu.
      if (!ready && !pose.endsWith('Alt') && pose !== 'idle') requestPose(currentKey, pose);
      return ready;
    };
    const alternatePoseReady = pose => alternateReady(currentKey, pose);
    // A whole painted image is always visible at full opacity. The previous
    // implementation blended paintings with different transparent margins,
    // which created a double-head ghost. A crisp frame change reads like a
    // hand-animated 2D character and keeps every paw attached to its body.
    const strideRequested = gait > .46;
    const turnRequested = turnAmount > .58;
    // The rear painting is reserved for Mochi's ordinary ground run. Action
    // silhouettes always win, even if the renderer keeps `away` true while a
    // jump or slide is being eased out.
    const awayRequested = away && !airborne && !sliding && !hanging && !menu;
    // On a bend, use Mochi's supplied side-gallop silhouettes. They share the
    // stride geometry and only consume the final mobile texture-budget slot.
    const sideRequested = side && !airborne && !sliding && !hanging && !menu && poseReady('stride');
    // The two side paintings are authored from opposite image directions, so
    // the alternate phase is mirrored below to preserve one consistent travel
    // direction while its front and rear paws trade places.
    const sideStridePose = sideRequested && poseReady('strideAlt') && Math.sin(time * gaitRate) >= 0
      ? 'strideAlt'
      : 'stride';
    // Action silhouettes always win over the running cadence. This keeps a
    // jump readable even when the dog is changing lanes and makes a slide a
    // deliberate low profile instead of a scaled portrait.
    // A caught zipline is a distinct action, not a taller jump.  The authored
    // frame puts both front paws at the cable and lets the body trail below it.
    // Keeping this branch first also prevents a turn impulse from swapping the
    // puppy back to an upright three-quarter painting while riding.
    // Rafting gets a dedicated sailor painting rather than layering a hat on a
    // running frame. Request it before the normal action cascade; while the
    // painting streams, the runner keeps a stable stride fallback for the
    // first few frames instead of flashing an empty sprite.
    const raftRequested = rafting && !menu && Boolean(alternateUrlFor(currentKey, 'raft'));
    if (raftRequested) requestAlternate(currentKey, 'raft');
    let activePose = raftRequested && alternatePoseReady('raft') ? 'raftAlt' : null;
    if (!activePose && hanging && poseReady('hang')) activePose = 'hang';
    if (!activePose && airborne && poseReady('jump')) activePose = 'jump';
    if (!activePose && sliding && poseReady('slide')) activePose = 'slide';
    if (!activePose && turnRequested && poseReady('turn')) activePose = 'turn';
    if (!activePose && sideRequested) activePose = sideStridePose;
    if (!activePose && awayRequested && poseReady('away')) activePose = 'away';
    if (!activePose && strideRequested && poseReady('stride')) activePose = 'stride';
    if (!activePose && poseReady('idle')) activePose = 'idle';
    if (!activePose && poseReady('stride')) activePose = 'stride';
    if (!activePose && poseReady('jump')) activePose = 'jump';
    if (!activePose && poseReady('slide')) activePose = 'slide';
    if (!activePose && poseReady('turn')) activePose = 'turn';
    // Stream one authored second beat for the current action.  The slot is
    // requested even during the first/base half of the cadence so it is warm
    // by the time the phase flips, but it is only shown after the load and
    // alpha-bounds normalization are complete.
    const alternateBasePose = !raftRequested && activePose && !['idle', 'away', 'strideAlt'].includes(activePose)
      ? basePoseFor(activePose)
      : null;
    if (alternateBasePose && alternateUrlFor(currentKey, alternateBasePose)) {
      requestAlternate(currentKey, alternateBasePose);
      const alternatePhase = motion && Math.sin(time * gaitRate + Math.PI / 2) >= 0;
      if (alternatePhase && alternatePoseReady(alternateBasePose)) {
        activePose = `${alternateBasePose}Alt`;
      }
    }
    group.userData.activePose = activePose || 'idle';
    group.userData.poseState = {
      airborne: Boolean(airborne),
      sliding: Boolean(sliding),
      hanging: Boolean(hanging),
      rafting: Boolean(rafting),
      away: Boolean(activePose === 'away'),
      side: Boolean(sideRequested && (activePose === 'stride' || activePose === 'strideAlt')),
      look,
      verticalVelocity: vertical,
      landingPulse,
    };

    const activeBasePose = basePoseFor(activePose);
    const cadence = Math.sin(time * gaitRate);
    const raftBob = motion && activeBasePose === 'raft' ? Math.sin(time * 2.25 + look * .35) : 0;
    const raftPaddle = motion && activeBasePose === 'raft' ? Math.sin(time * 4.5 + .55) : 0;
    const bounce = hanging ? 0 : motion
      ? Math.abs(cadence) * (menu ? .008 : activeBasePose === 'raft' ? .006 : airborne ? .018 : sliding ? .010 : .018)
      : 0;
    const sway = motion ? Math.sin(time * 3.9) * (menu ? .010 : hanging ? .008 : .018) : 0;
    const hangSwing = motion && activeBasePose === 'hang' ? Math.sin(time * 2.8 + look * .65) : 0;
    const hangKick = motion && activeBasePose === 'hang' ? Math.sin(time * 5.6 + .8) * .5 : 0;
    const awayMotion = motion && activeBasePose === 'away' ? Math.sin(time * 8.4) : 0;
    const lean = motion ? look * (activeBasePose === 'turn' ? .075 : activeBasePose === 'slide' ? .04 : activeBasePose === 'hang' ? .018 : activeBasePose === 'raft' ? .022 : .028) : 0;
    const stretch = motion
      ? ['hang', 'raft'].includes(activeBasePose) ? 0 : cadence * (activeBasePose === 'stride' ? .028 : activeBasePose === 'jump' ? .016 : activeBasePose === 'slide' ? .012 : .012)
      : 0;
    const jumpMotion = motion && activeBasePose === 'jump' ? Math.sin(time * 5.6) : 0;
    const slideMotion = motion && activeBasePose === 'slide' ? Math.sin(time * 6.2) : 0;
    for (const [slot, sprite] of Object.entries(poseSprites)) {
      if (slot === 'alternate' && !alternateSlot.pose) {
        sprite.visible = false;
        sprite.material.opacity = 0;
        continue;
      }
      const pose = slot === 'alternate' ? `${alternateSlot.pose}Alt` : slot;
      const active = pose === activePose && poseReady(pose);
      const scale = poseBaseScales[pose];
      sprite.visible = active;
      sprite.material.opacity = active ? 1 : 0;
      if (!scale || !active) continue;
      const basePose = basePoseFor(pose);
      const basePosition = poseBasePositions[pose] || bodyBasePosition;
      // Mirroring the rear painting on alternating footfalls gives Mochi a
      // readable side-to-side tail sweep without adding a second GPU texture.
      // Turns still use their deliberate directional flip first.
      const authoredFlip = pose === 'strideAlt' ? -1 : 1;
      const flip = authoredFlip * (basePose === 'turn' && look < 0
        ? -1
        : basePose === 'away' && Math.sin(time * gaitRate) < 0 ? -1 : 1);
      const actionRotation = basePose === 'jump'
        ? jumpMotion * .045 - vertical * .055
        : basePose === 'slide'
          ? -look * .035 + slideMotion * .018
          : basePose === 'hang'
            ? hangSwing * .07 + look * .022
          : basePose === 'away'
            ? awayMotion * .024 + look * .014
          : basePose === 'raft'
            ? raftBob * .028 + raftPaddle * .012 + look * .018
          : 0;
      const actionScaleX = basePose === 'jump'
        ? .985 - vertical * .012
        : basePose === 'slide' ? 1.055
          : basePose === 'hang' ? 1 + Math.abs(hangSwing) * .014
            : basePose === 'away' ? 1 + Math.abs(awayMotion) * .012 : 1;
      const actionScaleY = basePose === 'jump'
        ? 1.018 + vertical * .025
        : basePose === 'slide' ? .91
          : basePose === 'hang' ? 1.012 - Math.abs(hangSwing) * .008
            : basePose === 'away' ? 1 - Math.abs(awayMotion) * .012 : 1;
      const actionDrop = basePose === 'jump'
        ? .058 + jumpMotion * .012 + vertical * .018
        : basePose === 'slide' ? -.078 + slideMotion * .008
          // Pose bounds are normalized to the idle paw baseline. The hang
          // painting's paws are at its top, so this measured drop seats them
          // beneath the separately rendered zipline handle instead of at the
          // road.
          : basePose === 'hang' ? (poseHandleDrops[pose] ?? poseHandleDrops.hang) + hangKick * .018
            : basePose === 'away' ? awayMotion * .012
              : basePose === 'raft' ? raftBob * .018 : 0;
      const impactRoll = basePose === 'hang' ? 0 : landingPulse ? Math.sin(time * 28) * landingPulse * .12 : 0;
      sprite.material.rotation = lean * (basePose === 'turn' ? .45 : .2) + actionRotation;
      sprite.material.rotation += impactRoll;
      sprite.scale.set(
        scale.x * flip * actionScaleX * (1 - stretch) * (1 + landingPulse * .06),
        scale.y * actionScaleY * (1 + stretch) * (1 - landingPulse * .1),
        1,
      );
      sprite.position.set(
        basePosition.x + sway + (basePose === 'turn' ? look * .032 : 0) + (basePose === 'hang' ? hangSwing * .018 : 0) + (basePose === 'away' ? awayMotion * .012 : 0) + (basePose === 'raft' ? raftBob * .012 : 0),
        basePosition.y + bounce + actionDrop - landingPulse * .04,
        basePosition.z,
      );
    }

    // Keep wardrobe plates aligned to the currently selected painting. They
    // fade back slightly during a turn so a hat/pack never looks stapled to a
    // different silhouette, while the dog's own painted collar stays sharp.
    const activeScale = poseBaseScales[activePose] || bodyBaseScale;
    const accessoryAlpha = ['hang', 'raft'].includes(activeBasePose) ? 0 : activeBasePose === 'idle' ? 1 : activeBasePose === 'turn' ? .18 : activeBasePose === 'away' ? .08 : .12;
    const accessoryDrop = activeBasePose === 'jump'
      ? .058 + vertical * .018
      : activeBasePose === 'slide' ? -.078
        : activeBasePose === 'hang' ? (poseHandleDrops[activePose] ?? poseHandleDrops.hang) + hangKick * .018 : 0;
    const accessoryScaleX = activeBasePose === 'slide' ? 1.055 : activeBasePose === 'jump' ? .985 - vertical * .012 : 1;
    const accessoryScaleY = activeBasePose === 'slide' ? .91 : activeBasePose === 'jump' ? 1.018 + vertical * .025 : 1;
    const accessoryImpactDrop = -landingPulse * .04;
    accessorySprites.back.position.set(bodyBasePosition.x + sway + (activeBasePose === 'hang' ? hangSwing * .018 : 0), bodyBasePosition.y + bounce + accessoryDrop + accessoryImpactDrop, -.018);
    accessorySprites.mid.position.set(bodyBasePosition.x + sway + (activeBasePose === 'hang' ? hangSwing * .018 : 0), bodyBasePosition.y + bounce + accessoryDrop + accessoryImpactDrop, .022);
    accessorySprites.top.position.set(bodyBasePosition.x + sway + look * .02 + (activeBasePose === 'hang' ? hangSwing * .018 : 0), bodyBasePosition.y + bounce + accessoryDrop + accessoryImpactDrop, .055);
    for (const sprite of Object.values(accessorySprites)) {
      sprite.scale.set(
        activeScale.x * accessoryScaleX * (1 - stretch) * (1 + landingPulse * .06),
        activeScale.y * accessoryScaleY * (1 - landingPulse * .1),
        1,
      );
      sprite.material.rotation = landingPulse ? Math.sin(time * 28) * landingPulse * .12 : 0;
      sprite.material.opacity = accessoryAlpha;
    }
  }

  return {
    group,
    sprite: bodySprite,
    material: bodyMaterial,
    textures: sourceTextures,
    legs: legGroups.map(item => item.group),
    tail: tailGroup,
    apply,
    setCostume,
    setPose,
  };
}
