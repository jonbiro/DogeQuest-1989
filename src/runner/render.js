import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { LANES, PICKUPS, seededRandom } from "./world.js";

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
  renderer.toneMappingExposure = 1.25;
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
          flatShading: true,
        }),
      );
    return materialCache.get(color);
  };
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const sphereGeometry = new THREE.IcosahedronGeometry(1, 0);
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
  box(scene, "#526d49", 0, -0.55, -65, 9.2, 1, 175);
  box(scene, "#c1ba88", 0, -0.04, -65, 7.8, 0.15, 175);
  for (const x of [-4.25, 4.25])
    box(scene, "#ddd1a0", x, 0.08, -65, 0.45, 0.3, 175);
  // Recycled slabs, lane inlays, and scenery are translated rather than rebuilt.
  const scenery = new THREE.Group();
  scene.add(scenery);
  const tiles = [];
  for (let i = 0; i < 35; i++) {
    const tile = new THREE.Group();
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
  for (const side of [-1, 1]) {
    box(dog, "#e9ac59", side * 0.35, 1.85, -0.55, 0.26, 0.62, 0.32).rotation.z =
      -side * 0.15;
    box(dog, "#b97847", side * 0.35, 1.87, -0.73, 0.13, 0.36, 0.04);
    box(dog, "#20352d", side * 0.25, 1.39, -1.082, 0.11, 0.15, 0.025);
    box(dog, "#fff7db", side * 0.25 - 0.02, 1.43, -1.1, 0.035, 0.05, 0.02);
  }
  box(dog, "#ed734b", 0, 0.95, -0.26, 0.93, 0.25, 0.3);
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
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.75, 20),
    new THREE.MeshBasicMaterial({
      color: "#364c35",
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(1, 1.5, 1);
  shadow.position.y = 0.13;
  scene.add(shadow);
  const aura = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.4, 1),
    new THREE.MeshBasicMaterial({
      color: "#bcecff",
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    }),
  );
  aura.position.y = 0.9;
  dog.add(aura);
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
  return {
    draw(run, time, state, reducedMotion, dt) {
      const menu = ["menu", "help", "shop"].includes(state);
      const distance = menu ? time * (reducedMotion ? 0 : 2) : run.distance;
      for (const { instanced, entries } of batches) {
        entries.forEach((entry, i) => {
          const originalZ = entry.matrix.elements[14];
          entry.matrix.elements[14] =
            originalZ +
            entry.start -
            ((entry.offset - (distance % entry.period) + entry.period) %
              entry.period);
          instanced.setMatrixAt(i, entry.matrix);
          entry.matrix.elements[14] = originalZ;
        });
        instanced.instanceMatrix.needsUpdate = true;
      }
      dog.position.set(
        menu ? 0 : run.x,
        (menu ? 0 : run.y) +
          Math.abs(Math.sin(time * 12)) *
            (reducedMotion || (!menu && state !== "playing") ? 0 : 0.045),
        0,
      );
      dog.rotation.y = menu ? -2.35 : -(LANES[run.lane] - run.x) * 0.12;
      dog.scale.setScalar(1);
      dog.scale.y = !menu && run.slide > 0 ? 0.46 : 1;
      dog.visible = !(
        state === "playing" &&
        run.invulnerable > 0 &&
        !reducedMotion &&
        Math.sin(time * 28) < -0.25
      );
      for (let i = 0; i < legs.length; i++)
        legs[i].rotation.x =
          state === "playing"
            ? Math.sin(time * 17 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.8
            : 0;
      tail.rotation.z = reducedMotion ? 0 : Math.sin(time * 9) * 0.3;
      scarf.rotation.x = reducedMotion ? 0 : Math.sin(time * 12) * 0.15;
      shadow.position.x = dog.position.x;
      shadow.scale.setScalar(Math.max(0.45, 1 - run.y * 0.12));
      aura.visible = !menu && run.shield > 0;
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
            -(object.at - run.distance),
          );
          item.rotation.y = pickup ? time * (reducedMotion ? 0 : 1.8) : 0;
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
        camera.position.set(run.x * 0.13, 4.5, camera.aspect < 0.85 ? 10.8 : 9);
        camera.lookAt(run.x * 0.12, 0.75, -13);
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
