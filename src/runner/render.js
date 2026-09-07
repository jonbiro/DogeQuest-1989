import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { LANES, PICKUPS, seededRandom } from "./world.js";
import { routeOffset, routeHeading } from "./route.js";
import { PUPPIES } from "./collection.js";

// Shared low-poly geometry and materials keep the mobile scene inexpensive.
export function createView(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#8ec5aa");
  scene.fog = new THREE.Fog("#8ec5aa", 35, 145);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 190);
  scene.add(new THREE.HemisphereLight("#e9fff1", "#345342", 3));
  const sun = new THREE.DirectionalLight("#ffe1a2", 4);
  sun.position.set(-10, 20, 10);
  scene.add(sun);
  const materialCache = new Map();
  const mat = (color) => {
    if (!materialCache.has(color))
      materialCache.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.88,
          flatShading: false,
        }),
      );
    return materialCache.get(color);
  };
  const boxGeometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.055);
  const sphereGeometry = new THREE.SphereGeometry(1, 12, 8);
  const coneGeometry = new THREE.ConeGeometry(1, 1, 5);
  function mesh(parent, geometry, color, x, y, z, sx, sy, sz) {
    const item = new THREE.Mesh(geometry, mat(color));
    item.position.set(x, y, z);
    item.scale.set(sx, sy, sz);
    parent.add(item);
    return item;
  }
  const box = (parent, color, x, y, z, sx, sy, sz) =>
    mesh(parent, boxGeometry, color, x, y, z, sx, sy, sz);
  const ball = (parent, color, x, y, z, sx, sy, sz) =>
    mesh(parent, sphereGeometry, color, x, y, z, sx, sy, sz);
  const cone = (parent, color, x, y, z, sx, sy, sz) =>
    mesh(parent, coneGeometry, color, x, y, z, sx, sy, sz);
  box(scene, "#397d6e", 0, -1.4, -60, 200, 0.3, 220);
  // Recycled slabs, lane inlays, and scenery are translated rather than rebuilt.
  const scenery = new THREE.Group();
  scene.add(scenery);
  const tiles = [];
  for (let i = 0; i < 35; i++) {
    const tile = new THREE.Group();
    box(tile, "#526d49", 0, -0.55, 0, 9.2, 1, 5.4);
    box(tile, "#c1ba88", 0, -0.04, 0, 7.8, 0.15, 5.4);
    for (const x of [-4.25, 4.25])
      box(tile, "#ddd1a0", x, 0.08, 0, 0.45, 0.3, 5.4);
    for (let lane = 0; lane < 3; lane++) {
      box(
        tile,
        (i + lane) % 3 ? "#c8c194" : "#b9b483",
        LANES[lane],
        0.06,
        0,
        2.32,
        0.07,
        4.9,
      );
    }
    for (const x of [-1.2, 1.2])
      box(tile, "#e3d7a3", x, 0.11, 0, 0.045, 0.03, 2.8);
    scenery.add(tile);
    tiles.push(tile);
  }
  const random = seededRandom(1989),
    decorations = [];
  for (let i = 0; i < 48; i++) {
    const group = new THREE.Group(),
      side = i % 2 ? 1 : -1,
      x = side * (6 + random() * 15);
    const height = 4 + random() * 6;
    box(group, "#655c3b", 0, height / 2, 0, 0.5, height, 0.5);
    for (let j = 0; j < 3; j++)
      cone(
        group,
        ["#285947", "#3e7750", "#659459"][j],
        0,
        height - j * 1.1,
        0,
        2.5 - j * 0.25,
        3,
        2.8,
      );
    ball(group, "#5c8857", 1, 0.5, 1, 1.5, 1, 1.2);
    group.position.x = x;
    group.userData.offset = i * 3.8;
    scenery.add(group);
    decorations.push(group);
  }
  for (let i = 0; i < 12; i++) {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      const x = side * 5.3;
      box(group, "#8b9875", x, 1.6, 0, 1.15, 3.2, 1.1);
      box(group, "#b6bc92", x, 3.3, 0, 1.6, 0.35, 1.45);
      box(group, "#748762", x, 0.25, 0, 1.65, 0.5, 1.6);
      ball(group, "#799c55", x + 0.3, 3.65, 0, 0.9, 0.5, 0.7);
      if (i % 3 === 0) {
        box(group, "#d8c68b", x, 2.3, 0.59, 0.38, 0.75, 0.1);
        ball(group, "#ffb951", x, 2.4, 0.8, 0.17, 0.3, 0.15);
      }
    }
    if (i % 3 === 0) {
      box(group, "#9daa80", 0, 5.5, 0, 12, 0.8, 1.4);
      for (const side of [-1, 1])
        box(group, "#8b9875", side * 5.3, 4.3, 0, 1.15, 2.2, 1.1);
    }
    group.userData.offset = i * 16;
    scenery.add(group);
    decorations.push(group);
  }
  for (let i = 0; i < 8; i++) {
    const mountain = cone(
      scene,
      i % 2 ? "#5b9a80" : "#74af90",
      (i - 4) * 23,
      7,
      -115 - random() * 25,
      30,
      30 + random() * 30,
      22,
    );
    mountain.rotation.y = random();
  }
  // Batch hundreds of trees, paving stones, and ruin pieces into three draws.
  const batches = [];
  const batchMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.9,
    flatShading: true,
  });
  scenery.updateMatrixWorld(true);
  for (const geometry of [boxGeometry, coneGeometry, sphereGeometry]) {
    const entries = [];
    for (let i = 0; i < tiles.length; i++)
      tiles[i].traverse((item) => {
        if (item.geometry === geometry)
          entries.push({
            matrix: item.matrixWorld.clone(),
            color: item.material.color,
            offset: i * 5,
            period: 175,
            start: 10,
          });
      });
    for (const group of decorations)
      group.traverse((item) => {
        if (item.geometry === geometry)
          entries.push({
            matrix: item.matrixWorld.clone(),
            color: item.material.color,
            offset: group.userData.offset,
            period: 190,
            start: 14,
          });
      });
    const instanced = new THREE.InstancedMesh(
      geometry,
      batchMaterial,
      entries.length,
    );
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    entries.forEach((entry, i) => instanced.setColorAt(i, entry.color));
    instanced.frustumCulled = false;
    scene.add(instanced);
    batches.push({ instanced, entries });
  }
  scene.remove(scenery);
  // Biscuit is an original articulated model, not a billboard.
  const dog = new THREE.Group();
  scene.add(dog);
  box(dog, "#d89043", 0, 0.82, 0.12, 0.83, 0.72, 1.45);
  box(dog, "#f2c67b", 0, 1.2, -0.62, 0.95, 0.85, 0.9);
  box(dog, "#ffe0a1", 0, 1.06, -1.13, 0.66, 0.42, 0.4);
  box(dog, "#243b33", 0, 1.22, -1.36, 0.26, 0.2, 0.12);
  const ears = [];
  for (const side of [-1, 1]) {
    const ear = box(dog, "#e9ac59", side * 0.35, 1.85, -0.55, 0.26, 0.62, 0.32);
    ear.rotation.z = -side * 0.15;
    const inner = box(dog, "#b97847", side * 0.35, 1.87, -0.73, 0.13, 0.36, 0.04);
    ears.push({ear, inner, side});
    box(dog, "#20352d", side * 0.25, 1.39, -1.082, 0.11, 0.15, 0.025);
    box(dog, "#fff7db", side * 0.25 - 0.02, 1.43, -1.1, 0.035, 0.05, 0.02);
  }
  const collar = box(dog, "#ed734b", 0, 0.95, -0.26, 0.93, 0.25, 0.3);
  const scarf = box(dog, "#d85235", 0.48, 0.82, 0.15, 0.13, 0.38, 0.85);
  scarf.rotation.z = -0.2;
  const legs = [];
  for (const x of [-0.29, 0.29])
    for (const z of [-0.34, 0.64]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.68, z);
      box(leg, "#c7823d", 0, -0.22, 0, 0.23, 0.5, 0.25);
      box(leg, "#ffe3b1", 0, -0.48, -0.07, 0.25, 0.16, 0.37);
      dog.add(leg);
      legs.push(leg);
    }
  const tail = new THREE.Group();
  tail.position.set(0, 1.05, 0.85);
  tail.rotation.x = 0.5;
  box(tail, "#db994e", 0, 0.24, 0.16, 0.25, 0.55, 0.3);
  box(tail, "#ffe3b1", 0, 0.57, 0.16, 0.27, 0.2, 0.3);
  dog.add(tail);
  const furMeshes = [];
  dog.traverse(item => {
    if (item.isMesh) furMeshes.push({item, color: `#${item.material.color.getHexString()}`});
  });
  const spots = new THREE.Group(); dog.add(spots);
  for (const side of [-1, 1]) {
    ball(spots, "#293a43", side * .414, .95, .3, .04, .22, .29);
    ball(spots, "#293a43", side * .414, .75, -.1, .04, .12, .16);
  }
  ball(spots, "#293a43", -.22, 1.34, -1.079, .18, .22, .035);
  const outfits = Object.fromEntries(["explorer", "hero", "raincoat", "royal", "party"].map(id => {
    const group = new THREE.Group(); dog.add(group); return [id, group];
  }));
  box(outfits.explorer, "#8c673c", 0, 1.68, -.62, 1.12, .1, 1.02);
  box(outfits.explorer, "#cba96e", 0, 1.84, -.55, .65, .32, .55);
  box(outfits.explorer, "#687e4b", 0, 1.28, .28, .75, .36, .7);
  box(outfits.explorer, "#e7c984", 0, 1.48, .3, .14, .04, .67);
  const cape = box(outfits.hero, "#3988e8", 0, 1.23, .52, 1.07, .09, 1.48);
  cape.rotation.x = -.14;
  ball(outfits.hero, "#ffe577", 0, 1.33, .24, .18, .035, .18);
  box(outfits.raincoat, "#ffd34e", 0, .91, .16, .94, .61, 1.34);
  box(outfits.raincoat, "#fff1a0", 0, 1.24, .12, .08, .04, 1.25);
  box(outfits.royal, "#f8c648", 0, 1.69, -.58, .7, .14, .65);
  for (const x of [-.25, 0, .25]) cone(outfits.royal, "#ffe286", x, 1.9, -.65, .13, .38, .13);
  cone(outfits.party, "#d97cf1", 0, 1.97, -.55, .36, .72, .36);
  ball(outfits.party, "#fff0a0", 0, 2.34, -.55, .12, .12, .12);
  let appearanceKey = "";
  function dress(appearance = {}) {
    const key = `${appearance.puppy}:${appearance.costume}`;
    if (key === appearanceKey) return;
    appearanceKey = key;
    const puppy = PUPPIES[appearance.puppy] || PUPPIES.biscuit;
    const palette = {"#d89043":puppy.fur,"#e9ac59":puppy.fur,"#c7823d":puppy.fur,"#db994e":puppy.fur,"#f2c67b":puppy.head,"#ffe0a1":puppy.muzzle,"#ffe3b1":puppy.paws};
    for (const {item,color} of furMeshes) if (palette[color]) item.material = mat(palette[color]);
    for (const {ear,inner,side} of ears) {
      const floppy = puppy.ears === "floppy";
      ear.position.set(side * (floppy ? .53 : .35), floppy ? 1.38 : 1.85, -.55);
      ear.rotation.z = side * (floppy ? .15 : -.15);
      inner.visible = !floppy;
    }
    spots.visible = !!puppy.spots;
    collar.visible = scarf.visible = !appearance.costume || appearance.costume === "scarf";
    for (const [id, group] of Object.entries(outfits)) group.visible = appearance.costume === id;
  }
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowContext = shadowCanvas.getContext("2d");
  const gradient = shadowContext.createRadialGradient(32, 32, 4, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  shadowContext.fillStyle = gradient;
  shadowContext.fillRect(0, 0, 64, 64);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 2.5),
    new THREE.MeshBasicMaterial({
      color: "#364c35",
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      map: new THREE.CanvasTexture(shadowCanvas),
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.13;
  scene.add(shadow);
  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 20, 12),
    new THREE.MeshBasicMaterial({
      color: "#bcecff",
      wireframe: false,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
  );
  aura.position.y = 0.9;
  dog.add(aura);
  const magnetField = new THREE.Group();
  scene.add(magnetField);
  const ringGeometry = new THREE.TorusGeometry(1, 0.025, 6, 48);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({
        color: "#85f8ed",
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    magnetField.add(ring);
  }
  const flashes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 6, 4),
    new THREE.MeshBasicMaterial({
      color: "#fff0a6",
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
    192,
  );
  flashes.frustumCulled = false;
  scene.add(flashes);
  const flashMatrix = new THREE.Matrix4();
  const templates = {};
  templates.bone = new THREE.Group();
  box(templates.bone, "#ffd66e", 0, 0, 0, 0.6, 0.14, 0.14);
  for (const x of [-0.32, 0.32])
    for (const y of [-0.09, 0.09])
      ball(templates.bone, "#ffe39a", x, y, 0, 0.15, 0.15, 0.15);
  templates.bone.updateMatrixWorld(true);
  const boneParts = templates.bone.children.map((part) =>
    (part.geometry.index
      ? part.geometry.toNonIndexed()
      : part.geometry.clone()
    ).applyMatrix4(part.matrixWorld),
  );
  templates.bone = new THREE.Mesh(mergeGeometries(boneParts), mat("#ffe39a"));
  boneParts.forEach((part) => part.dispose());
  templates.rock = new THREE.Group();
  box(templates.rock, "#758e72", 0, 1.05, 0, 1.75, 2.1, 1.4);
  box(templates.rock, "#aec191", 0, 2.13, 0, 1.9, 0.2, 1.5);
  box(templates.rock, "#e9dca6", 0, 1.08, 0.72, 0.35, 0.7, 0.06);
  templates.log = new THREE.Group();
  box(templates.log, "#815b37", 0, 0.48, 0, 1.95, 0.95, 0.8);
  box(templates.log, "#b28850", 0, 0.98, 0, 1.9, 0.1, 0.7);
  for (const x of [-0.7, 0.7])
    box(templates.log, "#ebc078", x, 0.5, 0.41, 0.18, 0.65, 0.04);
  templates.arch = new THREE.Group();
  for (const x of [-1, 1])
    box(templates.arch, "#618979", x, 1.45, 0, 0.22, 2.9, 0.6);
  box(templates.arch, "#6d9580", 0, 1.95, 0, 2.2, 1.15, 0.7);
  box(templates.arch, "#e8c582", 0, 1.46, 0.38, 1.85, 0.16, 0.04);
  templates.magnet = new THREE.Group();
  for (const x of [-0.28, 0.28]) {
    box(templates.magnet, "#ff8d83", x, 0, 0, 0.2, 0.75, 0.2);
    box(templates.magnet, "#fff1d6", x, 0.35, 0, 0.21, 0.2, 0.21);
  }
  box(templates.magnet, "#ff8d83", 0, -0.37, 0, 0.75, 0.2, 0.2);
  // Rounded horseshoe with contrasting poles, readable even at a distance.
  templates.magnet.clear();
  const horseshoe = new THREE.Mesh(
    new THREE.TorusGeometry(0.38, 0.14, 10, 24, Math.PI),
    new THREE.MeshStandardMaterial({
      color: "#ff6389",
      roughness: 0.3,
      metalness: 0.25,
      emissive: "#74112c",
      emissiveIntensity: 0.3,
    }),
  );
  horseshoe.rotation.z = Math.PI;
  templates.magnet.add(horseshoe);
  for (const x of [-0.38, 0.38]) {
    box(templates.magnet, "#ff6389", x, 0.17, 0, 0.28, 0.35, 0.28);
    box(templates.magnet, "#c4fffa", x, 0.4, 0, 0.28, 0.15, 0.28);
  }
  templates.shield = new THREE.Group();
  ball(templates.shield, "#a5e8ee", 0, 0, 0, 0.45, 0.6, 0.2);
  box(templates.shield, "#effff0", 0, 0, 0.19, 0.09, 0.6, 0.04);
  templates.rock.scale.y = 0.72;
  templates.branch = new THREE.Group();
  box(templates.branch, "#6c4b2e", 0, 1.7, 0, 2.3, 0.8, 0.8);
  for (const x of [-0.9, 0.6])
    ball(templates.branch, "#4e944f", x, 2.2, 0, 0.7, 0.5, 0.6);
  box(templates.branch, "#e7bc70", 0, 1.28, 0.43, 1.8, 0.13, 0.06);
  templates.gate = new THREE.Group();
  for (const x of [-1, 1])
    box(templates.gate, "#6a808a", x, 1.5, 0, 0.2, 3, 0.4);
  for (const x of [-0.65, 0, 0.65])
    box(templates.gate, "#bac7bd", x, 2.1, 0, 0.16, 1.55, 0.3);
  box(templates.gate, "#ecc36f", 0, 1.33, 0, 2.1, 0.15, 0.4);
  templates.gem = new THREE.Group();
  ball(templates.gem, "#bf8bff", 0, 0, 0, 0.5, 0.65, 0.4);
  templates.double = new THREE.Group();
  ball(templates.double, "#ffce4f", 0, 0, 0, 0.65, 0.65, 0.22);
  for (const x of [-0.18, 0.18])
    box(templates.double, "#784e22", x, 0, 0.24, 0.1, 0.65, 0.07);
  templates.heart = new THREE.Group();
  for (const x of [-0.19, 0.19])
    ball(templates.heart, "#ff7b95", x, 0.14, 0, 0.3, 0.3, 0.2);
  const heartTip = box(
    templates.heart,
    "#ff7b95",
    0,
    -0.08,
    0,
    0.48,
    0.48,
    0.25,
  );
  heartTip.rotation.z = Math.PI / 4;
  templates.gift = new THREE.Group();
  box(templates.gift, "#bd77e9", 0, 0, 0, .85, .8, .75);
  box(templates.gift, "#fff0a1", 0, 0, 0, .16, .83, .78);
  box(templates.gift, "#fff0a1", 0, .08, 0, .88, .15, .78);
  for (const side of [-1,1]) ball(templates.gift, "#ffe89b", side * .19, .48, 0, .23, .14, .13);
  const haloGeometry = new THREE.TorusGeometry(0.86, 0.022, 6, 40);
  for (const type of PICKUPS.filter((type) => type !== "bone")) {
    const halo = new THREE.Mesh(
      haloGeometry,
      new THREE.MeshBasicMaterial({
        color: type === "magnet" ? "#85f8ed" : "#fff1bb",
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );
    templates[type].add(halo);
    templates[type].scale.multiplyScalar(1.2);
  }
  const active = new Map(),
    pools = Object.fromEntries(
      Object.keys(templates).map((type) => [type, []]),
    );
  function resize() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  let slowFrames = 0,
    qualityReduced = false;
  let visualRun = null,
    pose = 1,
    lean = 0,
    cameraX = 0,
    animationTime = 0;
  const bendMatrix = new THREE.Matrix4(),
    instanceMatrix = new THREE.Matrix4();
  const bendScale = new THREE.Vector3();
  return {
    draw(run, time, state, reducedMotion, dt, alpha = 1, collection) {
      const menu = ["menu", "help", "shop", "kennel"].includes(state);
      dress(menu ? collection : run.appearance);
      if (visualRun !== run) {
        // IDs restart on a new route; never reuse an old obstacle under a new type.
        for (const item of active.values()) {
          scene.remove(item);
          pools[item.userData.type].push(item);
        }
        active.clear();
        visualRun = run;
        pose = 1;
        lean = 0;
        cameraX = run.x;
      }
      if (state === "playing" || menu) animationTime += dt;
      time = animationTime;
      const blend = state === "playing" ? alpha : 1;
      const x = THREE.MathUtils.lerp(run.previous.x, run.x, blend),
        y = THREE.MathUtils.lerp(run.previous.y, run.y, blend);
      const distance = menu
        ? time * (reducedMotion ? 0 : 2)
        : THREE.MathUtils.lerp(run.previous.distance, run.distance, blend);
      const smooth = 1 - Math.exp(-18 * dt);
      if (state === "playing" || menu) {
        pose += ((menu || run.slide === 0 ? 1 : 0.46) - pose) * smooth;
        lean += ((menu ? 0 : -(LANES[run.lane] - x) * 0.12) - lean) * smooth;
      }
      for (const { instanced, entries } of batches) {
        entries.forEach((entry, i) => {
          const z =
            entry.start -
            ((entry.offset - (distance % entry.period) + entry.period) %
              entry.period);
          bendMatrix.makeRotationY(routeHeading(distance, z));
          bendMatrix.scale(
            bendScale.set(1, 1, 1 / Math.cos(routeHeading(distance, z))),
          );
          bendMatrix.setPosition(routeOffset(distance, z), 0, z);
          instanceMatrix.multiplyMatrices(bendMatrix, entry.matrix);
          instanced.setMatrixAt(i, instanceMatrix);
        });
        instanced.instanceMatrix.needsUpdate = true;
      }
      dog.position.set(
        menu ? 0 : x,
        (menu ? 0 : y) +
          Math.abs(Math.sin(time * 12)) *
            (reducedMotion || (!menu && state !== "playing") ? 0 : 0.045),
        0,
      );
      dog.rotation.y = menu ? -2.35 : lean;
      dog.rotation.z = menu || reducedMotion ? 0 : lean * 0.3;
      dog.scale.setScalar(1);
      dog.scale.y = pose;
      dog.visible = true;
      for (let i = 0; i < legs.length; i++)
        legs[i].rotation.x = !menu
          ? y > 0.1
            ? -0.3
            : Math.sin(distance * 0.82 + (i === 0 || i === 3 ? 0 : Math.PI)) *
              0.7
          : 0;
      tail.rotation.z = reducedMotion ? 0 : Math.sin(time * 9) * 0.3;
      scarf.rotation.x = reducedMotion ? 0 : Math.sin(time * 12) * 0.15;
      shadow.position.x = dog.position.x;
      shadow.scale.setScalar(Math.max(0.45, 1 - y * 0.12));
      shadow.material.opacity = 0.35 / (1 + y * 0.3);
      aura.visible = !menu && run.shield > 0;
      magnetField.visible = !menu && run.magnet > 0;
      magnetField.position.set(x, 0.18, 0);
      magnetField.children.forEach((ring, i) => {
        const phase = reducedMotion ? i / 3 : (time * 0.7 + i / 3) % 1;
        ring.scale.setScalar(1 + phase * 3.2);
        ring.material.opacity = 0.55 * (1 - phase);
      });
      let sparkCount = 0;
      if (!menu && !reducedMotion)
        for (const effect of run.effects) {
          const age = run.time - effect.time;
          for (let i = 0; i < 6 && sparkCount < 192; i++) {
            const angle = (i * Math.PI) / 3;
            flashMatrix.makeScale(
              0.07 * (1 - age / 0.45),
              0.07 * (1 - age / 0.45),
              0.07 * (1 - age / 0.45),
            );
            flashMatrix.setPosition(
              effect.x + Math.cos(angle) * age * 3,
              effect.y + Math.sin(angle) * age * 2,
              age * 2,
            );
            flashes.setMatrixAt(sparkCount++, flashMatrix);
          }
        }
      flashes.count = sparkCount;
      flashes.instanceMatrix.needsUpdate = true;
      const visibleIds = new Set();
      if (!menu)
        for (const object of run.objects) {
          if (object.used) continue;
          visibleIds.add(object.id);
          let item = active.get(object.id);
          if (!item) {
            item = pools[object.type].pop() || templates[object.type].clone();
            item.userData.type = object.type;
            active.set(object.id, item);
            scene.add(item);
          }
          const pickup = PICKUPS.includes(object.type);
          item.position.set(
            LANES[object.lane],
            pickup
              ? 1.1 +
                  (reducedMotion ? 0 : Math.sin(time * 3 + object.id) * 0.12)
              : 0,
            -(object.at - distance),
          );
          if (object.pull) {
            const p = Math.min(1, object.pull.elapsed / object.pull.duration),
              eased = p * p * (3 - 2 * p);
            item.position.set(
              THREE.MathUtils.lerp(object.pull.fromX, x, eased),
              THREE.MathUtils.lerp(object.pull.fromY, y + 1, eased) +
                Math.sin(p * Math.PI) * 0.7,
              THREE.MathUtils.lerp(-(object.pull.fromAt - distance), 0, eased),
            );
          }
          item.rotation.y = pickup
            ? object.type === "bone"
              ? time * (reducedMotion ? 0 : 1.8)
              : Math.sin(time * 1.5) * 0.25
            : 0;
          const z = item.position.z;
          const heading = routeHeading(distance, z),
            across = item.position.x;
          item.position.x =
            routeOffset(distance, z) + across * Math.cos(heading);
          item.position.z = z - across * Math.sin(heading);
          item.rotation.y += heading;
        }
      for (const [id, item] of active)
        if (!visibleIds.has(id)) {
          scene.remove(item);
          pools[item.userData.type].push(item);
          active.delete(id);
        }
      if (menu) {
        const mobile = camera.aspect < 0.85;
        camera.position.set(6, mobile ? 4 : 3.3, mobile ? 11 : 7.7);
        camera.lookAt(mobile ? -1 : -3.5, mobile ? 2.2 : 1.25, 0);
      } else {
        if (state === "playing")
          cameraX += (x - cameraX) * (1 - Math.exp(-5 * dt));
        camera.position.set(
          cameraX * (camera.aspect < 0.85 ? 0.45 : 0.13),
          4.5,
          camera.aspect < 0.85 ? 10.8 : 9,
        );
        camera.lookAt(cameraX * (camera.aspect < 0.85 ? 0.4 : 0.12), 0.75, -13);
      }
      if (state === "playing" && dt > 0.025) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 100 && !qualityReduced) {
        renderer.setPixelRatio(1);
        qualityReduced = true;
        resize();
      }
      renderer.render(scene, camera);
    },
  };
}
