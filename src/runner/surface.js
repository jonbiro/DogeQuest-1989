import * as THREE from 'three';

// Seeded, mipmapped surface grain shared by the world; no image downloads.
export function createSurfaceTexture(size = 128) {
  const data = new Uint8Array(size * size * 4);
  let seed = 1989;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const broad = Math.sin(x * Math.PI * 8 / size) * Math.sin(y * Math.PI * 6 / size);
    const value = Math.round(239 + broad * 7 + (seed / 4294967296 - .5) * 12);
    const i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = value;
    data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
