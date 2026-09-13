import * as THREE from 'three';

// The puppies are illustrated raster artwork, rather than a collection of
// procedural meshes. Keeping the paths in one place also means the clubhouse
// cards and the in-run sprite can never drift apart visually.
export const PUPPY_ARTWORK = Object.freeze({
  biscuit: './puppies/biscuit.webp',
  mochi: './puppies/mochi.webp',
  pepper: './puppies/pepper.webp',
  luna: './puppies/luna.webp',
});

const ASPECT_RATIOS = Object.freeze({
  biscuit: 1,
  mochi: 1230 / 1278,
  pepper: 1,
  luna: 1,
});

export function puppyArtworkUrl(id) {
  return PUPPY_ARTWORK[id] || PUPPY_ARTWORK.biscuit;
}

// Load only the equipped puppy's texture. The clubhouse can show every card
// with regular <img> elements, while the WebGL scene keeps one active artwork
// texture and swaps it when the player changes puppies.
export function createPuppyArtwork() {
  const group = new THREE.Group();
  group.name = 'puppy-raster-artwork';
  const loader = new THREE.TextureLoader();
  const textures = new Map();
  const material = new THREE.SpriteMaterial({
    color: '#ffffff',
    transparent: true,
    alphaTest: 0.03,
    depthTest: true,
    depthWrite: true,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = 'puppy-raster-sprite';
  sprite.position.y = 1.24;
  sprite.scale.set(2.48, 2.48, 1);
  sprite.frustumCulled = false;
  group.add(sprite);

  function textureFor(id) {
    const key = Object.hasOwn(PUPPY_ARTWORK, id) ? id : 'biscuit';
    if (!textures.has(key)) {
      const texture = loader.load(puppyArtworkUrl(key));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      texture.magFilter = THREE.LinearFilter;
      // The source illustrations are intentionally not power-of-two. A
      // linear NPOT sampler is portable across WebGL 1 and WebGL 2 phones and
      // avoids allocating a second mip pyramid for a single billboard.
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      textures.set(key, texture);
    }
    return { key, texture: textures.get(key) };
  }

  function apply(puppy) {
    const id = typeof puppy === 'string' ? puppy : puppy?.id;
    const { key, texture } = textureFor(id);
    material.map = texture;
    material.needsUpdate = true;
    const aspect = ASPECT_RATIOS[key] || 1;
    sprite.scale.set(2.48 * aspect, 2.48, 1);
    return key;
  }

  apply('biscuit');
  return { group, sprite, material, textures, apply };
}
