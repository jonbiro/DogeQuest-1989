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
// The windows are deliberately generous so the inked fur edge remains intact.
export const PUPPY_ARTWORK_LAYOUTS = Object.freeze({
  biscuit: {
    body: { head: [.34, .27, .36, .34] },
    tail: { crop: [.69, .02, .30, .44], root: [.70, .43] },
    legs: [
      { crop: [.18, .57, .23, .40], root: [.30, .59] },
      { crop: [.35, .56, .23, .42], root: [.46, .58] },
      { crop: [.50, .55, .23, .37], root: [.60, .57] },
      { crop: [.68, .52, .27, .41], root: [.79, .54] },
    ],
  },
  mochi: {
    body: { head: [.34, .28, .37, .34] },
    tail: { crop: [.66, .02, .32, .43], root: [.68, .42] },
    legs: [
      { crop: [.16, .57, .24, .39], root: [.29, .59] },
      { crop: [.34, .55, .24, .44], root: [.46, .57] },
      { crop: [.51, .54, .22, .39], root: [.61, .56] },
      { crop: [.68, .50, .28, .41], root: [.80, .53] },
    ],
  },
  pepper: {
    body: { head: [.34, .28, .36, .34] },
    tail: { crop: [.70, .02, .29, .42], root: [.71, .41] },
    legs: [
      { crop: [.18, .59, .23, .37], root: [.31, .60] },
      { crop: [.36, .57, .23, .40], root: [.47, .59] },
      { crop: [.52, .56, .22, .37], root: [.62, .58] },
      { crop: [.70, .53, .26, .39], root: [.80, .55] },
    ],
  },
  luna: {
    body: { head: [.32, .29, .40, .37] },
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
  const [headX, headY, headWidth, headHeight] = layout.body.head;
  context.beginPath();
  context.ellipse(
    headX * width,
    headY * height,
    headWidth * width,
    headHeight * height,
    0,
    0,
    Math.PI * 2,
  );

  // A curved torso mask keeps the illustrated chest and back together while
  // leaving the original lower-leg pixels out of the body layer. The generous
  // overlap at the shoulders gives the animated leg cutouts a natural furred
  // join, even during a long stride or slide.
  context.moveTo(.18 * width, .48 * height);
  context.bezierCurveTo(.26 * width, .39 * height, .67 * width, .38 * height, .86 * width, .48 * height);
  context.bezierCurveTo(.94 * width, .56 * height, .91 * width, .71 * height, .77 * width, .79 * height);
  context.bezierCurveTo(.59 * width, .86 * height, .34 * width, .84 * height, .23 * width, .73 * height);
  context.bezierCurveTo(.16 * width, .65 * height, .14 * width, .55 * height, .18 * width, .48 * height);
  context.closePath();
  context.fillStyle = '#fff';
  context.fill();
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
  let bodyBaseScale = new THREE.Vector3(WORLD_HEIGHT, WORLD_HEIGHT, 1);

  function configureParts(key, texture) {
    const layout = PUPPY_ARTWORK_LAYOUTS[key];
    const {width, height} = sourceSize(texture);
    if (!layout || !width || !height) return;
    const unit = WORLD_HEIGHT / height;
    const bodyWidth = width * unit;
    bodyBaseScale.set(bodyWidth, WORLD_HEIGHT, 1);
    bodySprite.scale.copy(bodyBaseScale);
    bodySprite.position.set(0, WORLD_HEIGHT / 2, 0);
    setSpriteMap(bodySprite, bodyTextures.get(key) || texture);

    const tailRect = pixelRect(layout.tail.crop, width, height);
    const tailRoot = pixelPoint(layout.tail.root, width, height);
    tailGroup.position.set(worldX(tailRoot.x, width, unit), worldY(tailRoot.y, height, unit), .012);
    tailSprite.position.set(
      (tailRect.x + tailRect.width / 2 - tailRoot.x) * unit,
      -(tailRect.y + tailRect.height / 2 - tailRoot.y) * unit,
      0,
    );
    tailSprite.scale.set(tailRect.width * unit, tailRect.height * unit, 1);
    setSpriteMap(tailSprite, partTextures.get(`${key}:tail`));

    layout.legs.forEach((leg, index) => {
      const rect = pixelRect(leg.crop, width, height);
      const root = pixelPoint(leg.root, width, height);
      const item = legGroups[index];
      item.group.position.set(worldX(root.x, width, unit), worldY(root.y, height, unit), .035 + index * .001);
      item.basePosition.copy(item.group.position);
      item.sprite.position.set(
        (rect.x + rect.width / 2 - root.x) * unit,
        -(rect.y + rect.height / 2 - root.y) * unit,
        0,
      );
      item.sprite.scale.set(rect.width * unit, rect.height * unit, 1);
      item.baseScale.copy(item.sprite.scale);
      setSpriteMap(item.sprite, partTextures.get(`${key}:leg:${index}`));
      item.group.rotation.set(0, 0, 0);
    });
  }

  function prepare(key, texture) {
    if (prepared.has(key)) return;
    const {width, height} = sourceSize(texture);
    if (!width || !height) return;
    prepared.add(key);
    prepareTexture(texture);
    bodyTextures.set(key, maskedBodyTexture(texture, key));
    const layout = PUPPY_ARTWORK_LAYOUTS[key];
    const tailRect = pixelRect(layout.tail.crop, width, height);
    partTextures.set(`${key}:tail`, cropTexture(texture, tailRect, width, height));
    layout.legs.forEach((leg, index) => {
      const rect = pixelRect(leg.crop, width, height);
      partTextures.set(`${key}:leg:${index}`, cropTexture(texture, rect, width, height));
    });
    if (currentKey === key) configureParts(key, texture);
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

  function setPose({
    time = 0,
    legs = [],
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
      item.group.rotation.z = -swing * .44 + Math.sin(time * 10 + phase) * stride * motion;
      item.group.position.y = item.basePosition.y + Math.sin(time * 11 + phase) * .018 * motion;
      item.group.position.x = item.basePosition.x + side * Math.cos(time * 11 + phase) * .012 * motion;
      item.sprite.scale.set(
        item.baseScale.x * (1 + Math.sin(time * 11 + phase) * .018 * motion),
        item.baseScale.y * (1 - Math.sin(time * 11 + phase) * .025 * motion),
        1,
      );
    });
    const tailMotion = reducedMotion ? 0 : Math.sin(time * (menu ? 3.8 : 8.5)) * (menu ? .14 : .24);
    tailGroup.rotation.z = tailMotion + (airborne ? -.06 : sliding ? .04 : 0);
    bodySprite.rotation.z = reducedMotion ? 0 : Math.sin(time * 3.2) * (menu ? .008 : .012);
    const breath = reducedMotion ? 1 : 1 + Math.sin(time * 4.2) * (menu ? .008 : .004);
    bodySprite.scale.set(bodyBaseScale.x * breath, bodyBaseScale.y * (2 - breath), 1);
  }

  return {
    group,
    sprite: bodySprite,
    material: bodyMaterial,
    textures: sourceTextures,
    legs: legGroups.map(item => item.group),
    tail: tailGroup,
    apply,
    setPose,
  };
}
