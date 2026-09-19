import * as THREE from 'three';

// One connected anatomy rig powers every selectable puppy.  The silhouette,
// joints and motion stay consistent while these small palette variations keep
// each dog recognisable in camp, gameplay and the results sheet.
const PUPPY_STYLES = Object.freeze({
  mochi: Object.freeze({
    body: ['#b6a38b', '#c8b89d', '#9a948e', '#7d7c7b', '#d2c2a4', '#8c8986'],
    chest: ['#c7b494', '#d6c4a4', '#a29a90'],
    saddle: ['#777676', '#96918b', '#a9a092'],
    face: ['#303236', '#34373a', '#3d4043', '#393c40'],
    crown: ['#aeb0ae', '#c0beb8', '#979a9b', '#d0c8b6', '#9b9fa0'],
    ears: ['#4d4b4b', '#716b65', '#8b8278'],
    beard: ['#c3b08b', '#c8b58f', '#cbb893', '#bda985', '#c6b28d'],
    legs: ['#b6a38b', '#c8b89d', '#9a948e', '#8c8986'],
    paws: ['#c3b08b', '#c8b58f', '#d6c4a4'],
    tail: ['#b6a38b', '#c8b89d', '#9a948e', '#d2c2a4'],
    solids: {
      ribcage: '#b8a891', chest: '#c7b494', saddle: '#888783',
      face: '#33363a', crown: '#979b9e', ears: '#5f5b59', muzzle: '#bba786',
      beard: '#beaa87', chin: '#b7a17b', noseBridge: '#303337',
      nose: '#161d19', nostril: '#080c09', mouth: '#4e4334',
      legs: '#55585c', paws: '#c9b48f', tail: '#595c60',
      collar: '#2879b8', tag: '#8ed6f1',
    },
  }),
  biscuit: Object.freeze({
    body: ['#b97947', '#d08e50', '#e5b274', '#f1c995', '#a96845'],
    chest: ['#e8bd86', '#f4d2a3', '#c88752'],
    saddle: ['#9e6748', '#b77a4f', '#d19b65'],
    face: ['#714b3b', '#805541', '#93644a'],
    crown: ['#d9a86f', '#edc28d', '#f4d3a9'],
    ears: ['#744b3d', '#915c43', '#ac7451'],
    beard: ['#f0c995', '#f6d9ad', '#dca36e', '#e7b981'],
    legs: ['#c7823d', '#d89043', '#e4ac6a', '#a96845'],
    paws: ['#f0c995', '#f6d9ad', '#e7b981'],
    tail: ['#c7823d', '#e0a35c', '#f1c995', '#b97947'],
    solids: {
      ribcage: '#c7823d', chest: '#e8bd86', saddle: '#a86d49',
      face: '#7b5140', crown: '#dfa971', ears: '#895946', muzzle: '#e2b47b',
      beard: '#e7b981', chin: '#dba06a', noseBridge: '#805545',
      nose: '#28211b', nostril: '#15100d', mouth: '#563b31',
      legs: '#b66f43', paws: '#efc58f', tail: '#b66f43',
      collar: '#df6b47', tag: '#f5d27a',
    },
  }),
  pepper: Object.freeze({
    body: ['#e9e3d7', '#f5eee1', '#c6beb5', '#a49c96', '#d7d0c7'],
    chest: ['#f4ede2', '#fff8eb', '#d1c6b9'],
    saddle: ['#747277', '#969198', '#b6afb0'],
    face: ['#514d50', '#615d61', '#403d42'],
    crown: ['#e8e4de', '#c8c5c2', '#aaa8a7'],
    ears: ['#59575c', '#737178', '#8d8988'],
    beard: ['#eee5d5', '#fff5e4', '#d5c8b9', '#e3d2bd'],
    legs: ['#e8e0d4', '#cbc2b8', '#b1a9a5', '#f0e7d8'],
    paws: ['#f4e9d8', '#fff7e8', '#d9cabb'],
    tail: ['#d9d3ca', '#b9b3b2', '#8e898e', '#eee5d7'],
    solids: {
      ribcage: '#e8e1d6', chest: '#f4ede2', saddle: '#8d898f',
      face: '#4c494e', crown: '#d0cdca', ears: '#6b6870', muzzle: '#e5d8c6',
      beard: '#e8d8c5', chin: '#d7c5ad', noseBridge: '#4a474b',
      nose: '#24242a', nostril: '#101014', mouth: '#42353a',
      legs: '#b5afb0', paws: '#f4e8d4', tail: '#a9a4a6',
      collar: '#4f9aa8', tag: '#bce8eb',
    },
  }),
  luna: Object.freeze({
    body: ['#8194a0', '#9eafb8', '#667c88', '#c1ccd0', '#728895'],
    chest: ['#cbd5d7', '#e4e9e7', '#9eafb4'],
    saddle: ['#536b79', '#6f8590', '#8ea1a8'],
    face: ['#364952', '#435862', '#2e3d46'],
    crown: ['#b8c8cf', '#d7e0e2', '#92a5b0'],
    ears: ['#506875', '#627b88', '#7f929c'],
    beard: ['#e6e9e3', '#f5f3e8', '#bdc8c6', '#d4d9d4'],
    legs: ['#708794', '#8ea0a9', '#aebbc0', '#617782'],
    paws: ['#e6e9e3', '#f5f3e8', '#c4cfce'],
    tail: ['#6d8490', '#91a4ad', '#bec9cc', '#536a77'],
    solids: {
      ribcage: '#718793', chest: '#cbd5d7', saddle: '#617783',
      face: '#3d505b', crown: '#b2c4cb', ears: '#5e7480', muzzle: '#dfe7e2',
      beard: '#dce4df', chin: '#c2d0cf', noseBridge: '#40525d',
      nose: '#1b2830', nostril: '#0b1116', mouth: '#33424c',
      legs: '#617884', paws: '#e2e8df', tail: '#607b87',
      collar: '#485d9a', tag: '#a6d9ee',
    },
  }),
});

const styleFor = (id) => PUPPY_STYLES[id] || PUPPY_STYLES.mochi;

// Photo-inspired anatomy, built once. Fur is instanced rather than one draw
// call per curl; no photograph, external texture or per-frame mesh allocation.
export function createMochiModel(initialStyle = 'mochi') {
  const group = new THREE.Group(); group.name = 'mochi';
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  // Fine curved strands share one geometry and texture. Small locks keep the
  // silhouette soft while the low-contrast undercoat carries the body shading.
  const curl = new THREE.PlaneGeometry(2,2,2,3);
  const curlVertices=curl.attributes.position;
  for(let i=0;i<curlVertices.count;i++) {
    const x=curlVertices.getX(i),y=curlVertices.getY(i);
    curlVertices.setXYZ(i,x,y,.10+(y+1)*.24+x*x*.13);
  }
  curl.computeVertexNormals();
  const collarGeometry = new THREE.TorusGeometry(.35, .028, 8, 28);
  // Fine undercoat grain softens the skin between silhouette curls. Generated
  // from a fixed seed so the photo itself never becomes a shipped asset.
  const grain = new Uint8Array(128 * 128 * 4);
  let grainSeed = 7123;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    grainSeed = (Math.imul(grainSeed, 1664525) + 1013904223) >>> 0;
    const value = Math.round(232 + 10 * Math.sin(x * 1.25 + 2 * Math.sin(y * .7)) * Math.sin(y * 1.3 + 2 * Math.sin(x * .65)) + 8 * (grainSeed / 4294967296 - .5));
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
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({color, roughness, fog: false,
      // A restrained lift keeps Mochi's expression readable in the foggy camp
      // hero shot without making the coat look like a flat unlit sticker.
      emissive: color, emissiveIntensity: roughness >= .9 ? .055 : .025,
      ...(roughness >= .9 ? {map: undercoat, bumpMap: undercoat, bumpScale: .035} : {})}));
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
  const furMaterial = new THREE.MeshStandardMaterial({color:'#ffffff',map:hairTexture, fog: false,
    roughness:1,emissive:'#fff5df',emissiveIntensity:.035,side:THREE.DoubleSide,alphaTest:.015,transparent:true,
    depthWrite:false,forceSinglePass:true});
  const styleMeshes = [];
  const styleFur = [];
  function ellipsoid(parent, name, color, position, scale, roughness) {
    const mesh = new THREE.Mesh(sphere, material(color, roughness));
    mesh.name = name; mesh.position.set(...position); mesh.scale.set(...scale);
    mesh.userData.styleRole = name;
    styleMeshes.push(mesh);
    mesh.receiveShadow = true;
    // Keep the articulated body shadow, but leave hundreds of transparent
    // fur locks out of the shadow pass to avoid shimmer and extra mobile work.
    mesh.castShadow = name === 'ribcage' || name === 'dark-face';
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
      const radius = size * (.8 + random() * .3);
      dummy.scale.set(radius, radius * (.85 + random() * .35), radius);
      dummy.updateMatrix();
      const paletteIndex = Math.floor(random() * palette.length);
      color.set(palette[paletteIndex]);
      entries.push({matrix: dummy.matrix.clone(), color: color.clone(), paletteIndex});
    }
    const mesh = new THREE.InstancedMesh(curl, furMaterial, entries.length);
    mesh.name = name;
    entries.forEach((entry, i) => { mesh.setMatrixAt(i, entry.matrix); mesh.setColorAt(i, entry.color); });
    mesh.userData.styleRole = name;
    mesh.userData.paletteLength = palette.length;
    mesh.userData.paletteIndices = entries.map(entry => entry.paletteIndex);
    styleFur.push(mesh);
    mesh.computeBoundingSphere(); parent.add(mesh); return mesh;
  }
  const initial = styleFor(initialStyle);
  // Mochi's default is a warm salt-and-pepper doodle. Other dogs reuse the
  // exact anatomy and motion with their own coat palettes.
  const coat = initial.body;
  const silver = initial.crown;
  const dark = initial.face;
  const cream = initial.beard;

  ellipsoid(group, 'ribcage', initial.solids.ribcage, [0, .99, .17], [.405, .345, .79]);
  fur(group, 'salt-and-pepper-body-curls', [0, .99, .17], [.42, .36, .80], 610, coat, .078);
  ellipsoid(group, 'chest', initial.solids.chest, [0, 1.05, -.39], [.33, .35, .34]);
  fur(group, 'soft-chest-curls', [0, 1.05, -.39], [.335, .35, .34], 180, initial.chest, .046);
  // A soft saddle breaks up the torso volume and gives Mochi the gray patch
  // pattern visible in the reference photos without adding a second rig.
  ellipsoid(group, 'gray-saddle', initial.solids.saddle, [0, 1.16, .38], [.38, .26, .47]);
  fur(group, 'saddle-curls', [0, 1.16, .38], [.385, .265, .475], 190, initial.saddle, .044);
  const head = new THREE.Group(); head.name = 'puppy-head'; group.add(head);
  ellipsoid(head, 'dark-face', initial.solids.face, [0, 1.39, -.64], [.405, .385, .43]);
  fur(head, 'short-face-fur', [0, 1.39, -.64], [.406, .386, .431], 320, dark, .025);
  ellipsoid(head, 'curly-crown-base', initial.solids.crown, [0, 1.67, -.59], [.425, .225, .385]);
  fur(head, 'silver-curly-crown', [0, 1.67, -.59], [.45, .245, .405], 360, silver, .049,
    (x, y, z) => y > -.35 || z > -.4);

  const ears = [], eyes = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group(); ear.name = side < 0 ? 'left-floppy-ear' : 'right-floppy-ear';
    ear.position.set(side * .40, 1.58, -.50); ear.rotation.z = side * .07; head.add(ear);
    ellipsoid(ear, 'long-dark-ear', initial.solids.ears, [side * .025, -.27, .015], [.165, .375, .18]);
    fur(ear, 'ear-curls', [side * .025, -.27, .015], [.168, .375, .183], 200, initial.ears, .035);
    ears.push({ear, side});

    const eye = new THREE.Group(); eye.name = side < 0 ? 'left-eye' : 'right-eye';
    eye.position.set(side * .205, 1.43, -1.002); head.add(eye); eyes.push(eye);
    ellipsoid(eye, 'eye-socket', '#171d19', [0, 0, .013], [.083, .094, .024]);
    ellipsoid(eye, 'warm-brown-eye', '#453528', [0, 0, -.012], [.059, .073, .023], .25);
    ellipsoid(eye, 'pupil', '#101711', [0, .002, -.032], [.039, .054, .008], .15);
    ellipsoid(eye, 'catchlight', '#f4f3dd', [-.018, .027, -.041], [.011, .014, .006], .18);
    ellipsoid(head, 'cream-eyebrow', initial.solids.crown, [side * .218, 1.53, -.90], [.16, .042, .07]);
    fur(head, `eyebrow-curls-${side}`, [side * .218, 1.53, -.925], [.163, .046, .05], 54, silver, .023);
  }
  ellipsoid(head, 'muzzle', initial.solids.muzzle, [0, 1.13, -1.12], [.27, .20, .25]);
  for (const side of [-1, 1]) {
    ellipsoid(head, 'bearded-cheek', initial.solids.beard, [side * .11, 1.10, -1.15], [.17, .185, .215]);
    fur(head, `cream-beard-${side}`, [side * .11, 1.10, -1.15], [.172, .19, .22], 110, cream, .032);
  }
  ellipsoid(head, 'chin', initial.solids.chin, [0, .96, -1.13], [.20, .095, .20]);
  fur(head, 'chin-curls', [0, .97, -1.13], [.21, .10, .20], 65, cream, .031);
  ellipsoid(head, 'dark-nose-bridge', initial.solids.noseBridge, [0, 1.285, -1.126], [.124, .15, .185]);
  ellipsoid(head, 'nose', initial.solids.nose, [0, 1.19, -1.405], [.145, .10, .08], .34);
  for (const side of [-1, 1]) ellipsoid(head, 'nostril', initial.solids.nostril, [side * .066, 1.177, -1.473], [.035, .024, .012], .55);
  ellipsoid(head, 'nose-highlight', '#5a6256', [-.03, 1.23, -1.471], [.045, .014, .007], .4);
  ellipsoid(head, 'mouth', initial.solids.mouth, [0, 1.01, -1.319], [.104, .014, .025]);

  const legs = [];
  for (const x of [-.29, .29]) for (const z of [-.36, .64]) {
    const leg = new THREE.Group(); leg.name = `${x < 0 ? 'left' : 'right'}-${z < 0 ? 'front' : 'rear'}-leg`;
    leg.position.set(x, .82, z); group.add(leg); legs.push(leg);
    ellipsoid(leg, 'upper-leg', initial.solids.legs, [0, -.18, 0], [.108, .26, .13]);
    ellipsoid(leg, 'lower-leg', initial.solids.legs, [0, -.43, -.015], [.086, .20, .10]);
    fur(leg, 'leg-curls', [0, -.285, 0], [.105, .335, .13], 105, initial.legs, .034);
    ellipsoid(leg, 'cream-paw', initial.solids.paws, [0, -.61, -.067], [.135, .098, .188]);
    fur(leg, 'cream-paw-curls', [0, -.60, -.067], [.137, .095, .185], 55, initial.paws, .027,
      (x, y) => y > -.4);
  }
  const tail = new THREE.Group(); tail.name = 'curled-tail'; tail.position.set(0, 1.08, .88); group.add(tail);
  ellipsoid(tail, 'tail-base', initial.solids.tail, [0, .17, .12], [.095, .25, .14]);
  fur(tail, 'tail-curls', [0, .17, .12], [.10, .25, .145], 110, initial.tail, .034);
  const collar = new THREE.Mesh(collarGeometry, material(initial.solids.collar));
  collar.name = 'leather-collar'; collar.position.set(0, 1.13, -.38); collar.scale.y = .82; group.add(collar);
  collar.userData.styleRole = 'collar'; styleMeshes.push(collar);
  ellipsoid(group, 'small-brass-tag', initial.solids.tag, [0, .85, -.68], [.055, .07, .018], .45);

  const roleForMesh = {
    'gray-saddle': 'saddle',
    'dark-face': 'face',
    'curly-crown-base': 'crown',
    'long-dark-ear': 'ears',
    'cream-eyebrow': 'crown',
    'bearded-cheek': 'beard',
    chin: 'chin',
    'dark-nose-bridge': 'noseBridge',
    nose: 'nose',
    nostril: 'nostril',
    mouth: 'mouth',
    'upper-leg': 'legs',
    'lower-leg': 'legs',
    'cream-paw': 'paws',
    'tail-base': 'tail',
    'small-brass-tag': 'tag',
  };
  const roleForFur = (name) => {
    if (name === 'salt-and-pepper-body-curls') return 'body';
    if (name === 'soft-chest-curls') return 'chest';
    if (name === 'saddle-curls') return 'saddle';
    if (name === 'short-face-fur') return 'face';
    if (name === 'silver-curly-crown' || name.startsWith('eyebrow-curls')) return 'crown';
    if (name === 'ear-curls') return 'ears';
    if (name.startsWith('cream-beard') || name === 'chin-curls') return 'beard';
    if (name === 'leg-curls') return 'legs';
    if (name === 'cream-paw-curls') return 'paws';
    if (name === 'tail-curls') return 'tail';
    return null;
  };
  const styleMaterials = new Map();
  function setStyle(id = 'mochi') {
    const style = styleFor(id);
    for (const mesh of styleMeshes) {
      const role = roleForMesh[mesh.name] || mesh.userData.styleRole;
      const color = style.solids[role];
      if (!color || !mesh.material?.clone) continue;
      const key = id + ':' + role + ':' + color;
      let styled = styleMaterials.get(key);
      if (!styled) {
        styled = mesh.material.clone();
        styled.color.set(color);
        if (styled.emissive) styled.emissive.set(color);
        styleMaterials.set(key, styled);
      }
      mesh.material = styled;
    }
    for (const mesh of styleFur) {
      const role = roleForFur(mesh.name);
      const palette = role && style[role];
      if (!palette || !mesh.instanceColor) continue;
      const oldLength = mesh.userData.paletteLength || palette.length;
      for (let index = 0; index < mesh.count; index++) {
        const sourceIndex = mesh.userData.paletteIndices[index] ?? 0;
        const nextIndex = Math.min(palette.length - 1, Math.floor(((sourceIndex + .5) / oldLength) * palette.length));
        mesh.setColorAt(index, new THREE.Color(palette[nextIndex]));
      }
      mesh.instanceColor.needsUpdate = true;
    }
    group.userData.style = id;
  }
  setStyle(initialStyle);
  return {group, legs, eyes, ears, tail, head, setStyle};
}
