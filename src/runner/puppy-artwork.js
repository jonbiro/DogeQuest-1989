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

// Each illustration is authored as one beautiful pose. These normalized crop
// windows turn it into a small 2.5D puppet at runtime: the torso stays a
// cohesive painted shape, while the four painted legs and tail get their own
// joints. No dog anatomy is recreated with boxes, cones or low-poly vectors.
// Leg and tail windows stay deliberately generous so the inked fur edge
// remains intact; the head uses a tighter crop to avoid transparent padding.
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

export function puppyArtworkUrl(id) {
  return PUPPY_ARTWORK[id] || PUPPY_ARTWORK.biscuit;
}

function sourceSize(texture) {
  const image = texture?.image;
  return {
    width: image?.naturalWidth || image?.videoWidth || image?.width || 0,
    height: image?.naturalHeight || image?.videoHeight || image?.height || 0,
  };
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

function drawBodyMask(context, width, height, layout) {
  // A curved torso mask keeps the illustrated chest and back together while
  // leaving the original head, ears and lower-leg pixels out of the body
  // layer. The generous overlap at the shoulders gives the animated cutouts a
  // natural furred join, even during a long stride or slide.
  context.beginPath();
  context.moveTo(.18 * width, .48 * height);
  context.bezierCurveTo(.26 * width, .39 * height, .67 * width, .38 * height, .86 * width, .48 * height);
  context.bezierCurveTo(.94 * width, .56 * height, .91 * width, .71 * height, .77 * width, .79 * height);
  context.bezierCurveTo(.59 * width, .86 * height, .34 * width, .84 * height, .23 * width, .73 * height);
  context.bezierCurveTo(.16 * width, .65 * height, .14 * width, .55 * height, .18 * width, .48 * height);
  context.closePath();
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
  context.save();
  drawBodyMask(context, width, height, PUPPY_ARTWORK_LAYOUTS[key]);
  context.clip();
  context.drawImage(texture.image, 0, 0, width, height);
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
  if (costume === 'scarf' && layer === 'mid') {
    // The supplied art already has a blue collar. This transparent plate
    // keeps the reward legible as the promised red adventure scarf while
    // preserving the painted fur and the little blue tag underneath.
    path([
      ['M', .25, .40], ['C', .36, .36, .56, .37, .70, .43],
      ['L', .68, .50], ['C', .54, .55, .36, .54, .25, .48], ['Z'],
    ]);
    fillStroke(gradient('#f06a5f', '#b83b43', .38), ink, .012);
    context.strokeStyle = '#ffb080'; context.lineWidth = px(.010);
    context.beginPath(); context.moveTo(px(.28), px(.42));
    context.quadraticCurveTo(px(.48), px(.47), px(.67), px(.44)); context.stroke();
    path([
      ['M', .57, .47], ['C', .62, .50, .66, .56, .63, .65],
      ['L', .55, .57], ['L', .50, .64], ['L', .51, .51], ['Z'],
    ]);
    fillStroke(gradient('#eb6358', '#ad3340', .49), ink, .010);
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
      ['M', .27, .43], ['C', .38, .39, .56, .40, .69, .46],
      ['L', .72, .66], ['C', .59, .73, .39, .72, .25, .64], ['Z'],
    ]);
    fillStroke(gradient('rgba(255,225,108,.90)', 'rgba(226,164,39,.72)', .42), ink, .012);
    context.strokeStyle = '#fff0a7'; context.lineWidth = px(.012);
    context.beginPath(); context.moveTo(px(.29), px(.50)); context.quadraticCurveTo(px(.48), px(.55), px(.69), px(.50)); context.stroke();
    context.fillStyle = '#3e91a0'; context.fillRect(px(.455), px(.43), px(.09), px(.025));
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

// Load the equipped artwork once, then use it as a layered, articulated
// illustration. Each leg and the tail remain raster crops from the same source
// painting, so the hand-inked fur stays consistent as the joints move.
export function createPuppyArtwork() {
  const group = new THREE.Group();
  group.name = 'puppy-illustrated-puppet';
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
  let bodyBaseScale = new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1);
  let headBaseScale = new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1);
  const bodyBasePosition = new THREE.Vector3(0, WORLD_HEIGHT / 2, 0);
  const headBasePosition = new THREE.Vector3();

  function accessoryFor(key, costume, layer) {
    const cacheKey = `${key}:${costume}:${layer}`;
    if (!accessoryTextures.has(cacheKey)) accessoryTextures.set(cacheKey, accessoryTexture(key, costume, layer));
    return accessoryTextures.get(cacheKey);
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
    bodySprite.scale.copy(bodyBaseScale);
    bodySprite.position.copy(bodyBasePosition);
    setSpriteMap(bodySprite, bodyTextures.get(key) || texture);

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
    const {width, height} = sourceSize(texture);
    if (!width || !height) return;
    prepared.add(key);
    prepareTexture(texture);
    bodyTextures.set(key, maskedBodyTexture(texture, key));
    headTextures.set(key, maskedHeadTexture(texture, key));
    const layout = PUPPY_ARTWORK_LAYOUTS[key];
    const tailRect = pixelRect(layout.tail.crop, width, height);
    partTextures.set(`${key}:tail`, cropTexture(texture, tailRect, width, height));
    layout.legs.forEach((leg, index) => {
      const rect = pixelRect(leg.crop, width, height);
      partTextures.set(`${key}:leg:${index}`, cropTexture(texture, rect, width, height));
    });
    if (currentKey === key) {
      configureParts(key, texture);
      configureAccessories(key, currentCostume);
    }
  }

  function textureFor(id) {
    const key = Object.hasOwn(PUPPY_ARTWORK, id) ? id : 'biscuit';
    if (!sourceTextures.has(key)) {
      const texture = loader.load(puppyArtworkUrl(key), loaded => prepare(key, loaded));
      sourceTextures.set(key, prepareTexture(texture));
    }
    return {key, texture: sourceTextures.get(key)};
  }

  function apply(puppy) {
    const id = typeof puppy === 'string' ? puppy : puppy?.id;
    const {key, texture} = textureFor(id);
    currentKey = key;
    configureParts(key, texture);
    return key;
  }

  function setCostume(costume = 'scarf') {
    currentCostume = costume || 'scarf';
    configureAccessories(currentKey, currentCostume);
  }

  function setPose({
    time = 0,
    legs = [],
    turn = 0,
    airborne = false,
    sliding = false,
    menu = false,
    reducedMotion = false,
  } = {}) {
    const motion = reducedMotion ? 0 : 1;
    const stride = menu ? .02 : sliding ? .10 : airborne ? .16 : .24;
    legGroups.forEach((item, index) => {
      const target = Number.isFinite(legs[index]) ? legs[index] : 0;
      const side = index % 2 === 0 ? 1 : -1;
      const phase = index === 0 || index === 3 ? 0 : Math.PI;
      const swing = THREE.MathUtils.clamp(target, -1.2, 1.2);
      const legAngle = -swing * .44 + Math.sin(time * 10 + phase) * stride * motion;
      // Sprite geometry billboards to the camera, so its own material rotation
      // is the reliable joint angle. Rotating only the parent group would move
      // the crop but leave the painted paw facing stiffly forward.
      item.sprite.material.rotation = legAngle;
      item.group.rotation.z = 0;
      item.group.position.y = item.basePosition.y + Math.sin(time * 11 + phase) * .028 * motion;
      item.group.position.x = item.basePosition.x + side * Math.cos(time * 11 + phase) * .018 * motion;
      item.sprite.scale.set(
        item.baseScale.x * (1 + Math.sin(time * 11 + phase) * .025 * motion),
        item.baseScale.y * (1 - Math.sin(time * 11 + phase) * .035 * motion),
        1,
      );
    });
    const tailMotion = reducedMotion ? 0 : Math.sin(time * (menu ? 3.8 : 8.5)) * (menu ? .18 : .30);
    tailSprite.material.rotation = tailMotion + (airborne ? -.06 : sliding ? .04 : 0);
    tailGroup.rotation.z = 0;
    const look = THREE.MathUtils.clamp(turn, -1, 1);
    const headTurn = reducedMotion
      ? 0
      : -look * .16 + Math.sin(time * 3.6) * (menu ? .045 : .075);
    const bodyBounce = reducedMotion ? 0 : Math.abs(Math.sin(time * 11)) * (menu ? .010 : .024);
    const bodySway = reducedMotion ? 0 : Math.sin(time * 5.5) * (menu ? .012 : .026);
    const headBob = reducedMotion ? 0 : Math.sin(time * (menu ? 2.6 : 7.4)) * (menu ? .022 : .042);
    headGroup.rotation.z = headTurn * .7;
    headGroup.position.set(
      headBasePosition.x + look * .075 + bodySway * .55,
      headBasePosition.y + headBob + bodyBounce + (airborne ? .045 : sliding ? -.024 : 0),
      headBasePosition.z,
    );
    headSprite.material.rotation = headTurn;
    const headLookScale = 1 - Math.abs(look) * .085;
    headSprite.scale.set(headBaseScale.x * headLookScale, headBaseScale.y * (2 - headLookScale), 1);
    earGroups.forEach((item, index) => {
      const side = index === 0 ? -1 : 1;
      const earFlop = reducedMotion ? 0 : Math.sin(time * (menu ? 2.8 : 8.8) + index * 1.3) * (menu ? .035 : .12);
      item.sprite.material.rotation = headTurn * .8 + side * earFlop;
      item.group.position.set(
        item.basePosition.x + look * .028 + bodySway * .4,
        item.basePosition.y + headBob + bodyBounce,
        item.basePosition.z,
      );
    });
    const bodyTilt = reducedMotion ? 0 : Math.sin(time * 3.2) * (menu ? .012 : .025) + bodySway * .35;
    const legContrast = (Number.isFinite(legs[0]) ? legs[0] : 0) - (Number.isFinite(legs[3]) ? legs[3] : 0);
    bodySprite.material.rotation = bodyTilt + legContrast * .018;
    bodySprite.position.set(
      bodyBasePosition.x + bodySway,
      bodyBasePosition.y + bodyBounce,
      bodyBasePosition.z,
    );
    const breath = reducedMotion ? 1 : 1 + Math.sin(time * 4.2) * (menu ? .010 : .006);
    bodySprite.scale.set(bodyBaseScale.x * breath, bodyBaseScale.y * (2 - breath), 1);
    accessorySprites.back.position.set(
      bodyBasePosition.x + bodySway,
      bodyBasePosition.y + bodyBounce,
      -.018,
    );
    accessorySprites.mid.position.set(
      bodyBasePosition.x + bodySway,
      bodyBasePosition.y + bodyBounce,
      .022,
    );
    accessorySprites.top.position.set(
      bodyBasePosition.x + bodySway + look * .02,
      bodyBasePosition.y + bodyBounce + headBob,
      .055,
    );
    for (const sprite of Object.values(accessorySprites)) {
      sprite.scale.set(bodyBaseScale.x * breath, bodyBaseScale.y * (2 - breath), 1);
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
