import * as THREE from 'three';

// Photo-inspired anatomy, built once. Fur is instanced rather than one draw
// call per curl; no photograph, external texture or per-frame mesh allocation.
export function createMochiModel() {
  const group = new THREE.Group(); group.name = 'mochi';
  const sphere = new THREE.SphereGeometry(1, 28, 20);
  // Soft, curved hair cards form overlapping locks. Fine individual strands
  // share one tiny generated texture instead of thousands of tube meshes.
  const curl = new THREE.PlaneGeometry(2, 2, 2, 3);
  const curlVertices = curl.attributes.position;
  for (let i = 0; i < curlVertices.count; i++) {
    const x = curlVertices.getX(i), y = curlVertices.getY(i);
    curlVertices.setXYZ(i, x, y, .10 + (y + 1) * .24 + x * x * .13);
  }
  curl.computeVertexNormals();
  const collarGeometry = new THREE.TorusGeometry(.35, .028, 8, 28);
  // Fine undercoat grain softens the skin between silhouette curls. Generated
  // from a fixed seed so the photo itself never becomes a shipped asset.
  const grain = new Uint8Array(128 * 128 * 4);
  let grainSeed = 7123;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    grainSeed = (Math.imul(grainSeed, 1664525) + 1013904223) >>> 0;
    const value = Math.round(210 + 30 * Math.sin(x * 1.25 + 2 * Math.sin(y * .7)) * Math.sin(y * 1.3 + 2 * Math.sin(x * .65)) + 25 * (grainSeed / 4294967296 - .5));
    const index = (y * 128 + x) * 4;
    grain[index] = grain[index + 1] = grain[index + 2] = value; grain[index + 3] = 255;
  }
  const undercoat = new THREE.DataTexture(grain, 128, 128);
  undercoat.wrapS = undercoat.wrapT = THREE.RepeatWrapping;
  undercoat.repeat.set(3, 3); undercoat.magFilter = THREE.LinearFilter;
  undercoat.minFilter = THREE.LinearMipmapLinearFilter; undercoat.generateMipmaps = true; undercoat.needsUpdate = true;
  const materials = new Map();
  function material(color, roughness = .94) {
    const key = `${color}:${roughness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness,
      ...(roughness >= .9 ? {map: undercoat, bumpMap: undercoat, bumpScale: .045} : {})}));
    return materials.get(key);
  }
  const strands = new Uint8Array(128 * 128 * 4);
  for (let i = 0; i < strands.length; i += 4) strands[i] = strands[i + 1] = strands[i + 2] = 255;
  let strandSeed = 431;
  const strandRandom = () => { strandSeed = (Math.imul(strandSeed, 1664525) + 1013904223) >>> 0; return strandSeed / 4294967296; };
  for (let hair = 0; hair < 48; hair++) {
    const root = 18 + strandRandom() * 92, phase = strandRandom() * 6.28;
    const length = 75 + strandRandom() * 40, tone = 225 + strandRandom() * 30;
    for (let sample = 0; sample <= 180; sample++) {
      const t = sample / 180, y = 5 + t * length;
      const x = root + (6 + t * 8) * Math.sin(t * 10 + phase) + 4 * Math.sin(t * 20 + phase);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const px = Math.round(x) + dx, py = Math.round(y) + dy;
        if (px < 0 || px > 127 || py < 0 || py > 127) continue;
        const coverage = Math.max(0, 1 - Math.hypot(px - x, py - y) / .95) * Math.min(1, (1 - t) * 8);
        const index = (py * 128 + px) * 4;
        if (coverage * 255 > strands[index + 3]) {
          strands[index] = strands[index + 1] = strands[index + 2] = tone;
          strands[index + 3] = coverage * 255;
        }
      }
    }
  }
  const hairTexture = new THREE.DataTexture(strands, 128, 128);
  hairTexture.magFilter = THREE.LinearFilter; hairTexture.minFilter = THREE.LinearMipmapLinearFilter;
  hairTexture.generateMipmaps = true; hairTexture.needsUpdate = true;
  const furMaterial = new THREE.MeshStandardMaterial({color: '#ffffff', map: hairTexture,
    roughness: 1, side: THREE.DoubleSide, alphaTest: .015, transparent: true,
    depthWrite: false, forceSinglePass: true});
  function ellipsoid(parent, name, color, position, scale, roughness) {
    const mesh = new THREE.Mesh(sphere, material(color, roughness));
    mesh.name = name; mesh.position.set(...position); mesh.scale.set(...scale);
    parent.add(mesh); return mesh;
  }
  // Even surface coverage with gentle deterministic variation in curl size,
  // direction and color. Each patch follows its anatomical animation joint.
  let seed = 1989;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  function fur(parent, name, center, axes, count, palette, size = .045, include = () => true) {
    const entries = [], color = new THREE.Color(), dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const y = 1 - 2 * (i + .5) / count, angle = i * 2.399963229728653;
      const r = Math.sqrt(1 - y * y), x = r * Math.cos(angle), z = r * Math.sin(angle);
      if (!include(x, y, z)) continue;
      const normal = new THREE.Vector3(x / axes[0], y / axes[1], z / axes[2]).normalize();
      dummy.position.set(center[0] + x * axes[0], center[1] + y * axes[1], center[2] + z * axes[2]);
      dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      dummy.rotateZ(random() * Math.PI * 2);
      const radius = size * (1.15 + random() * .45);
      dummy.scale.set(radius, radius * (.85 + random() * .35), radius);
      dummy.updateMatrix();
      color.set(palette[Math.floor(random() * palette.length)]);
      entries.push({matrix: dummy.matrix.clone(), color: color.clone()});
    }
    const mesh = new THREE.InstancedMesh(curl, furMaterial, entries.length);
    mesh.name = name;
    entries.forEach((entry, i) => { mesh.setMatrixAt(i, entry.matrix); mesh.setColorAt(i, entry.color); });
    mesh.computeBoundingSphere(); parent.add(mesh); return mesh;
  }
  const coat = ['#484e49', '#555b55', '#62675f', '#73776d', '#4e554f'];
  const silver = ['#8d9187', '#a0a397', '#888e85', '#b1b3a2', '#969d91'];
  const dark = ['#303731', '#343b34', '#3d443a', '#394138'];
  const cream = ['#c3b08b', '#d2c09c', '#d9c7a0', '#bba17d', '#c9b48d'];

  ellipsoid(group, 'ribcage', '#484c47', [0, .99, .17], [.405, .345, .79]);
  fur(group, 'salt-and-pepper-body-curls', [0, .99, .17], [.41, .35, .79], 610, coat, .057);
  ellipsoid(group, 'chest', '#686961', [0, 1.05, -.39], [.33, .35, .34]);
  fur(group, 'soft-chest-curls', [0, 1.05, -.39], [.335, .35, .34], 180, coat, .046);
  ellipsoid(group, 'dark-face', '#303733', [0, 1.39, -.64], [.405, .385, .43]);
  fur(group, 'short-face-fur', [0, 1.39, -.64], [.406, .386, .431], 320, dark, .025);
  ellipsoid(group, 'curly-crown-base', '#858b81', [0, 1.67, -.59], [.445, .24, .40]);
  fur(group, 'silver-curly-crown', [0, 1.67, -.59], [.45, .245, .405], 360, silver, .049,
    (x, y, z) => y > -.35 || z > -.4);

  const ears = [], eyes = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group(); ear.name = side < 0 ? 'left-floppy-ear' : 'right-floppy-ear';
    ear.position.set(side * .40, 1.58, -.50); ear.rotation.z = side * .07; group.add(ear);
    ellipsoid(ear, 'long-dark-ear', '#2c322e', [side * .025, -.27, .015], [.165, .375, .18]);
    fur(ear, 'ear-curls', [side * .025, -.27, .015], [.168, .375, .183], 200, dark, .035);
    ears.push({ear, side});

    const eye = new THREE.Group(); eye.name = side < 0 ? 'left-eye' : 'right-eye';
    eye.position.set(side * .205, 1.43, -1.002); group.add(eye); eyes.push(eye);
    ellipsoid(eye, 'eye-socket', '#171d19', [0, 0, .013], [.083, .094, .024]);
    ellipsoid(eye, 'warm-brown-eye', '#453528', [0, 0, -.012], [.059, .073, .023], .25);
    ellipsoid(eye, 'pupil', '#101711', [0, .002, -.032], [.039, .054, .008], .15);
    ellipsoid(eye, 'catchlight', '#f4f3dd', [-.018, .027, -.041], [.011, .014, .006], .18);
    ellipsoid(group, 'cream-eyebrow', '#c5b594', [side * .218, 1.54, -.98], [.169, .06, .10]);
    fur(group, `eyebrow-curls-${side}`, [side * .218, 1.54, -.98], [.169, .063, .104], 54, cream, .025);
  }
  ellipsoid(group, 'muzzle', '#aa987b', [0, 1.13, -1.12], [.29, .21, .27]);
  for (const side of [-1, 1]) {
    ellipsoid(group, 'bearded-cheek', '#c1ab85', [side * .145, 1.10, -1.15], [.18, .195, .23]);
    fur(group, `cream-beard-${side}`, [side * .145, 1.10, -1.15], [.182, .20, .235], 110, cream, .034);
  }
  ellipsoid(group, 'chin', '#b7a17b', [0, .96, -1.13], [.20, .095, .20]);
  fur(group, 'chin-curls', [0, .97, -1.13], [.21, .10, .20], 65, cream, .031);
  ellipsoid(group, 'dark-nose-bridge', '#30362f', [0, 1.285, -1.126], [.124, .15, .185]);
  ellipsoid(group, 'nose', '#161d19', [0, 1.19, -1.405], [.145, .10, .08], .34);
  for (const side of [-1, 1]) ellipsoid(group, 'nostril', '#080c09', [side * .066, 1.177, -1.473], [.035, .024, .012], .55);
  ellipsoid(group, 'nose-highlight', '#5a6256', [-.03, 1.23, -1.471], [.045, .014, .007], .4);
  ellipsoid(group, 'mouth', '#4e4334', [0, 1.01, -1.319], [.104, .014, .025]);

  const legs = [];
  for (const x of [-.29, .29]) for (const z of [-.36, .64]) {
    const leg = new THREE.Group(); leg.name = `${x < 0 ? 'left' : 'right'}-${z < 0 ? 'front' : 'rear'}-leg`;
    leg.position.set(x, .82, z); group.add(leg); legs.push(leg);
    ellipsoid(leg, 'upper-leg', '#4e534d', [0, -.18, 0], [.108, .26, .13]);
    ellipsoid(leg, 'lower-leg', '#565c53', [0, -.43, -.015], [.086, .20, .10]);
    fur(leg, 'leg-curls', [0, -.285, 0], [.105, .335, .13], 105, coat, .034);
    ellipsoid(leg, 'cream-paw', '#c9b48f', [0, -.61, -.067], [.135, .098, .188]);
    fur(leg, 'cream-paw-curls', [0, -.60, -.067], [.137, .095, .185], 55, cream, .027,
      (x, y) => y > -.4);
  }
  const tail = new THREE.Group(); tail.name = 'curled-tail'; tail.position.set(0, 1.08, .88); group.add(tail);
  ellipsoid(tail, 'tail-base', '#565d53', [0, .17, .12], [.095, .25, .14]);
  fur(tail, 'tail-curls', [0, .17, .12], [.10, .25, .145], 110, coat, .034);
  const collar = new THREE.Mesh(collarGeometry, material('#514536'));
  collar.name = 'leather-collar'; collar.position.set(0, 1.13, -.38); collar.scale.y = .82; group.add(collar);
  ellipsoid(group, 'small-brass-tag', '#ac925a', [0, .85, -.68], [.055, .07, .018], .45);
  return {group, legs, eyes, ears, tail};
}
