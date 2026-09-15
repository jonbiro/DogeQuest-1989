import * as THREE from "three";
import {createInstanceBatch} from './instance-batch.js';
import {createShaderPreparation} from './shader-preparation.js';
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { LANES, PICKUPS, seededRandom } from "./world.js";
import { createRouteSampler } from "./route.js";
import { upcomingCorner } from "./turns.js";
import { objectVisible, ziplineSignVisible } from "./visibility.js";
import { createCornerRoad } from "./corner-road.js";
import { PUPPIES, DEFAULT_PUPPY } from "./collection.js";
import { puppyVisual } from "./puppy-visuals.js";
import { REGIONS, regionAt, horizonProfile } from "./regions.js";
import {AREAS,areaAt,areaBlend} from './areas.js';
import {createBoneGeometry} from './bone-model.js';
import {createCapeGeometry} from './cape-model.js';
import {createSky} from './sky.js';
import {createMountainGeometry,blendMountainArea} from './mountain.js';
import { puppyPose, smoothLegAngles, bodyMotion, mochiCrouch } from "./puppy-pose.js";
import { createMochiModel } from "./mochi-model.js";
import { createClassicEarGeometries } from "./ear-model.js";
import { createClassicFur } from "./classic-fur.js";
import { isBridge } from "./bridges.js";
import { ziplineAt, ZIPLINE_HEIGHT, cableSegment, CABLE_SEGMENT_LENGTH } from "./ziplines.js";
import {createPuppyFramer,gameplayFov} from './framing.js';
import {createQualityController} from './quality.js';
import {contactShadow} from './contact-shadow.js';
import {effectColor} from './impact-color.js';
import {createBranchModel} from './branch-model.js';
import {createLogModel} from './log-model.js';
import {detourCameraWeight} from './route-detour.js';
import {createSurfaceTexture} from './surface.js';
import {createWaterSurface} from './water.js';
import {BANK_SURFACE_Y} from './terrain.js';
import {trailColors,sampleTrailColor} from './trail-palette.js';
import {createShieldMaterial} from './shield-material.js';
import {magnetPulse} from './magnet-field.js';
import {pickupYaw} from './pickup-motion.js';
import {themeHazard} from './hazard-palette.js';
import {createBoulderGeometry} from './boulder-model.js';
import {createPalmFrondGeometry,createFeatheredPalmGeometry} from './palm-frond.js';
import {addBambooLeaves} from './bamboo-leaves.js';
import {createMushroomCapGeometry} from './mushroom-cap.js';
import {createTerrainMaterial,terrainStation} from './terrain-material.js';
import {raftAt,raftIntersecting} from './rafts.js';
import {createRaftModel} from './raft-model.js';
import {minecartIntersecting} from './minecart.js';
import {createMinecartModel} from './minecart-model.js';
import {createRiverBanks} from './river-banks.js';
import {createPuppyArtwork,PUPPY_HANG_HANDLE_HEIGHT} from './puppy-artwork.js';

// Shared sculpted geometry and materials keep the mobile scene inexpensive.
export function createView(canvas) {
  // Resolve the device profile before asking the browser for a context. The
  // context attributes are part of the allocation decision on iOS; changing
  // quality after a high-cost context exists is too late to prevent a GPU
  // process eviction.
  const mobile = window.matchMedia?.('(pointer: coarse)')?.matches === true
    || /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(window.navigator?.userAgent || '');
  // Probe the exact context that Three will use before constructing the full
  // scene. Some Chrome profiles report a WebGL creation failure only after
  // allocating a renderer, which used to leave the player in a reload loop.
  // A quiet probe lets app.js show an actionable 3D setup screen without
  // logging a second renderer error or claiming the canvas for a context that
  // does not exist.
  let context = null;
  try {
    context = canvas.getContext('webgl2', {
      alpha: true,
      depth: true,
      stencil: false,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: mobile ? 'low-power' : 'default',
      failIfMajorPerformanceCaveat: false,
    });
  } catch {
    // Keep the null probe result and let the caller show its setup state.
  }
  if (!context) throw new Error('WebGL2 is unavailable; full 3D setup required');
  // iOS keeps the page alive while the GPU process is aggressively budgeted.
  // Treat a coarse-pointer/mobile canvas as a small-screen profile from the
  // first allocation: one physical pixel per CSS pixel, no shadow atlas, and
  // no high-anisotropy sampling. The authored trail, lighting and contact
  // shadow remain intact, but the renderer leaves enough headroom for Safari
  // or Brave to restore a backgrounded tab instead of killing its context.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    antialias: false,
    powerPreference: mobile ? "low-power" : "default",
    failIfMajorPerformanceCaveat: false,
  });
  const quality = createQualityController(mobile ? 1 : window.devicePixelRatio || 1);
  renderer.setPixelRatio(quality.ratio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#a9d9cb");
  scene.fog = new THREE.Fog("#a9d9cb", 35, 145);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 190);
  const sky=createSky();
  scene.add(sky);
  scene.add(new THREE.HemisphereLight("#dcf7ff", "#1f403a", 1.8));
  const sun = new THREE.DirectionalLight("#fff0ce", 3.5);
  sun.position.set(-12, 24, 4);
  sun.target.position.set(0, 0, -12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
  Object.assign(sun.shadow.camera, {left:-18,right:18,top:26,bottom:-18,near:1,far:90});
  sun.shadow.bias = -.0003;
  sun.shadow.normalBias = .045;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  const surface = createSurfaceTexture();
  surface.anisotropy = Math.min(mobile ? 1 : 4, renderer.capabilities.getMaxAnisotropy());
  const materialCache = new Map();
  const mat = (color) => {
    if (!materialCache.has(color))
      materialCache.set(
        color,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.72,
          map: surface, bumpMap: surface, bumpScale: .025,
          flatShading: false,
        }),
      );
    return materialCache.get(color);
  };
  const boxGeometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.055);
  const sphereGeometry = new THREE.SphereGeometry(1, 20, 14);
  const trunkGeometry = new THREE.CylinderGeometry(.7, 1, 1, 10);
  const canopyGeometry = new THREE.SphereGeometry(1, 20, 14);
  const palmFrondGeometry=createPalmFrondGeometry();
  const featheredPalmGeometry=createFeatheredPalmGeometry();
  const mushroomCapGeometry=createMushroomCapGeometry();
  const canopyVertices = canopyGeometry.attributes.position;
  for (let i=0;i<canopyVertices.count;i++) {
    const x=canopyVertices.getX(i),y=canopyVertices.getY(i),z=canopyVertices.getZ(i);
    const radius=1+.07*Math.sin(x*5+y*3)*Math.sin(z*4-y*3);
    canopyVertices.setXYZ(i,x*radius,y*radius,z*radius);
  }
  canopyGeometry.computeVertexNormals();
  const coneGeometry = new THREE.ConeGeometry(1, 1, 5);
  const classicEarGeometries = createClassicEarGeometries();
  function mesh(parent, geometry, color, x, y, z, sx, sy, sz) {
    const item = new THREE.Mesh(geometry, mat(color));
    item.position.set(x, y, z);
    item.scale.set(sx, sy, sz);
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  const box = (parent, color, x, y, z, sx, sy, sz) =>
    mesh(parent, boxGeometry, color, x, y, z, sx, sy, sz);
  const ball = (parent, color, x, y, z, sx, sy, sz) =>
    mesh(parent, sphereGeometry, color, x, y, z, sx, sy, sz);
  const cone = (parent, color, x, y, z, sx, sy, sz) =>
    mesh(parent, coneGeometry, color, x, y, z, sx, sy, sz);
  const ground = box(scene, "#285f57", 0, -1.4, -60, 200, 0.3, 220);
  ground.material = ground.material.clone();
  const regionColors = REGIONS.map(region => ({sky:new THREE.Color(region.sky),ground:new THREE.Color(region.ground),stone:new THREE.Color(region.stone)}));
  const areaColors=AREAS.map(area=>({sky:new THREE.Color(area.sky),ground:new THREE.Color(area.ground)}));
  const areaGroundColor=new THREE.Color();
  // Recycled slabs, lane inlays, and scenery are translated rather than rebuilt.
  const scenery = new THREE.Group();
  scene.add(scenery);
  const tiles = [];
  for (let i = 0; i < 35; i++) {
    const tile = new THREE.Group();
    // A thick, height-following bank anchors trees and paving on hills. It uses
    // the existing box batch and gives way to water at river crossings.
    box(tile, '#285f57', 0, BANK_SURFACE_Y - 6, 0, 60, 12, 5.4).userData.terrain = true;
    box(tile, "#304b45", 0, -0.55, 0, 9.2, 1, 5.4);
    box(tile, "#d6c993", 0, -0.04, 0, 7.8, 0.15, 5.4);
    for (const x of [-4.25, 4.25])
      box(tile, "#526453", x, 0.08, 0, 0.45, 0.3, 5.4).userData.edge = true;
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
      box(tile, "#667557", x, 0.11, 0, 0.065, 0.03, 2.8).userData.edge = true;
    // Alternative deck shares the road's recycled instances and curve transform.
    const bridge = new THREE.Group();
    const bridgeBox = (...args) => {
      const part = box(bridge, ...args);
      part.userData.bridge = true;
      return part;
    };
    for (let plank = 0; plank < 6; plank++)
      bridgeBox(plank % 2 ? "#b77c4c" : "#c9915e", 0, .02, -2.08 + plank * .833, 7.8, .22, .79);
    for (const x of [-4.05, 4.05]) {
      bridgeBox("#765036", x, .65, 0, .23, 1.6, .23);
      for (const y of [.5, 1.3]) bridgeBox("#efd6a0", x, y, 0, .1, .1, 5.4);
      bridgeBox("#64472e", x, -.45, 0, .22, .22, 5.4);
    }
    tile.add(bridge);
    const cable = box(tile, "#25494d", 0, 6.5, 0, .075, .075, CABLE_SEGMENT_LENGTH);
    cable.userData.cable = true;
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
    mesh(group,trunkGeometry,"#655c3b",0,height/2,0,.34,height,.34);
    for (let j = 0; j < 5; j++)
      mesh(group,canopyGeometry,["#246044", "#357751", "#4a8b5b", "#63995f", "#80ac70"][j],
        Math.sin(j * 2.4) * 1.3,height - .8 + Math.cos(j * 1.7) * .75,
        Math.cos(j * 2.4) * 1.2,1.9,1.5 + random() * .5,1.8);
    for (const side of [-1,1]) {
      const root = ball(group,"#5b563c",side*.38,.35,0,.22,.8,.32);
      root.rotation.z = side * .45;
      ball(group,"#3c8057",side*1.8,.35,.8,.8,.35,1.1);
    }
    ball(group, "#5c8857", 1, 0.5, 1, 1.5, 1, 1.2);
    group.position.x = x;
    group.userData.offset = i * 3.8;
    group.userData.region = 0;
    group.userData.variant = 0;
    scenery.add(group);
    decorations.push(group);
  }
  // Region-specific silhouettes, pooled with the rest of the scenery.
  for (let region=1;region<3;region++) for(let i=0;i<40;i++) {
    const group=new THREE.Group();
    group.position.x=(i%2?1:-1)*(6+random()*13);
    group.userData.offset=i*4.7;
    group.userData.region=region;
    group.userData.variant=0;
    if(region===1) {
      const height=2+random()*5;
      mesh(group,trunkGeometry,"#a75c3d",0,height/2-.4,0,2+random(),height+.8,2);
      mesh(group,trunkGeometry,"#d18d62",.05,height*.77,0,1.8,height*.3,1.7);
      ball(group,"#ebba82",.1,height*.96,0,1.4,.24,1.3);
      if(i%3===0) {
        box(group,"#709567",2,1.6,0,.5,3.2,.5);
        box(group,"#709567",2.6,2,0,1.2,.35,.4);
        box(group,"#709567",3,2.4,0,.35,1,.4);
      }
    } else {
      for(let j=0;j<3;j++) {
        const shard=cone(group,["#80bdd1","#bbb1e7","#85ded1"][j],j*.65,1.8,0,.65,3+random()*3,.7);
        shard.rotation.z=(j-1)*.22;
      }
      ball(group,"#ddd8f4",0,.4,0,1.8,.5,1.4);
    }
    scenery.add(group);decorations.push(group);
  }
  // Alternate destinations have genuinely different silhouettes, not just a
  // color wash. They share the existing geometry/material batches.
  for(let region=0;region<3;region++)for(let i=0;i<36;i++){
    const group=new THREE.Group();
    group.position.x=(i%2?1:-1)*(5+random()*9);
    Object.assign(group.userData,{offset:i*5.2,region,variant:1});
    if(region===0){
      for(let j=0;j<4;j++){
        const height=5+random()*7,x=(j-1.5)*.65;
        mesh(group,trunkGeometry,'#688d44',x,height/2,0,.16,height,.16);
        for(let y=1;y<height;y+=1.6)ball(group,'#b6c67b',x,y,0,.19,.065,.19);
        addBambooLeaves(group,palmFrondGeometry,mesh,x,height);
      }
    }else if(region===1){
      const height=5+random()*4;
      const trunk=mesh(group,trunkGeometry,'#8b6941',0,height/2,0,.25,height,.25);trunk.rotation.z=.12;
      const crownX=-Math.sin(.12)*height/2,crownY=height/2+Math.cos(.12)*height/2;
      for(let j=0;j<8;j++){
        const a=j*Math.PI/4;
        const leaf=mesh(group,featheredPalmGeometry,j%2?'#628d48':'#326648',crownX+Math.cos(a)*2,crownY,Math.sin(a)*2,2,1.5,1.5);
        leaf.rotation.y=-a;
      }
      ball(group,'#d8b783',0,.32,0,1.3,.32,1);
    }else{
      for(let j=0;j<3;j++){
        const height=2+j*1.3,x=(j-1)*1.5;
        mesh(group,trunkGeometry,'#b9b8d5',x,height/2,0,.3,height,.3);
        mesh(group,mushroomCapGeometry,['#997dab','#b99bc9','#777cac'][j],x,height,0,1.5,1,1.35);
        ball(group,'#e0cbdc',x,height-.19,0,1.12,.055,1);
        for(const offset of [-.5,.4])ball(group,'#dccfe9',x+offset,height+.52,.25,.17,.045,.18);
      }
    }
    ball(group,region===1?'#d1ab73':region===2?'#77769b':'#506e44',.3,.22,.3,1.6,.24,1.2);
    for(let leaf=0;leaf<3;leaf++){
      const tuft=ball(group,region===2?'#a39ab8':'#70965e',(leaf-1)*.55,.4,1,.16,.7,.23);
      tuft.rotation.z=(leaf-1)*.4;
    }
    scenery.add(group);decorations.push(group);
  }
  for (let i = 0; i < 12; i++) {
    const group = new THREE.Group();
    for (const side of [-1, 1]) {
      const x = side * 5.3;
      mesh(group,trunkGeometry,"#8b9875",x,1.6,0,.72,3.2,.7);
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
    group.userData.gateway = true;
    scenery.add(group);
    decorations.push(group);
  }
  const mountains = [];
  const mountainGeometry=createMountainGeometry();
  const horizon = {};
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
    mountain.rotation.y = random() * Math.PI * 2;
    mountain.geometry = mountainGeometry;
    mountain.updateMorphTargets();
    mountain.material = mountain.material.clone();
    mountain.material.vertexColors = true;
    // Horizon haze is blended explicitly below; scene fog would erase these
    // distant silhouettes a second time, leaving the regional backdrop blank.
    mountain.material.fog = false;
    mountain.userData.baseScale = mountain.scale.clone();
    mountain.userData.depthHaze = (-mountain.position.z - 115) / 25 * .18;
    mountains.push(mountain);
  }
  // Separate road receivers from scenery casters to avoid layered paving
  // shadowing itself. Each geometry remains one shared instanced scenery draw.
  const batches = [];
  const batchMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.82,
    flatShading: false,
    map: surface, bumpMap: surface, bumpScale: .04,
  });
  const terrainMaterial=createTerrainMaterial(surface);
  // Keep a wider visual corridor around playable lanes without moving hazards.
  for (const group of decorations) {
    group.position.y = BANK_SURFACE_Y;
    if (!group.userData.gateway) {
      group.position.x *= 1.4;
      group.scale.setScalar(.82);
    }
  }
  scenery.updateMatrixWorld(true);
  for (const geometry of [boxGeometry, coneGeometry, sphereGeometry, trunkGeometry, canopyGeometry,palmFrondGeometry,featheredPalmGeometry,mushroomCapGeometry]) {
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
            road: true,
            bridge: item.userData.bridge === true,
            cable: item.userData.cable === true,
            terrain: item.userData.terrain === true,
            edge: item.userData.edge === true,
          });
      });
    for (const group of decorations.filter(
      (group, index) => group.userData.gateway || index % 3 !== 1,
    ))
      group.traverse((item) => {
        if (item.geometry === geometry)
          entries.push({
            matrix: item.matrixWorld.clone(),
            color: item.material.color,
            offset: group.userData.offset,
            period: 190,
            start: 14,
            region: group.userData.region,
            variant: group.userData.variant,
            gateway: group.userData.gateway === true,
          });
      });
    for (const groupEntries of [entries.filter(entry=>entry.terrain),entries.filter(entry=>entry.road&&!entry.terrain),entries.filter(entry=>!entry.road)]) {
    if (!groupEntries.length) continue;
    const isTerrain=groupEntries[0].terrain;
    const batchGeometry=isTerrain?geometry.clone():geometry;
    if(isTerrain)batchGeometry.setAttribute('terrainStation',new THREE.InstancedBufferAttribute(new Float32Array(groupEntries.length),1).setUsage(THREE.DynamicDrawUsage));
    const instanced = new THREE.InstancedMesh(
      batchGeometry,
      isTerrain?terrainMaterial:batchMaterial,
      groupEntries.length,
    );
    instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    groupEntries.forEach((entry, i) => {
      entry.colors = regionColors.map((palette,index) => entry.terrain ? palette.ground : index===0 ? entry.color : entry.color.clone().lerp(palette.stone,entry.edge ? .08 : .72));
      if(entry.road)entry.trailColors=trailColors(entry.color,entry.edge);
      instanced.setColorAt(i, entry.color);
    });
    instanced.frustumCulled = false;
    instanced.castShadow = !groupEntries[0].road;
    instanced.receiveShadow = true;
    scene.add(instanced);
    batches.push({ instanced, entries:groupEntries });
    }
  }
  scene.remove(scenery);
  const cornerRoad = createCornerRoad(scene);
  const water = createWaterSurface(scene);
  const raftWater=createWaterSurface(scene);
  const raftModel=createRaftModel(mesh,boxGeometry,trunkGeometry);scene.add(raftModel);
  const minecartModel=createMinecartModel(mesh,boxGeometry,trunkGeometry);scene.add(minecartModel);
  // The classic dogs share mobile-friendly geometry, but each has a distinct
  // silhouette. Proportions and face details are applied by puppyVisual().
  const dog = new THREE.Group();
  scene.add(dog);
  // The two main volumes cast the moving silhouette without sending every
  // eye, marking and accessory through a second mobile rendering pass.
  const body = ball(dog, "#d89043", 0, 0.88, 0.12, 0.47, 0.40, .88);
  body.castShadow = true;
  const shoulder = ball(dog, "#d89043", 0, 1.0, -.38, .37, .40, .35);
  const head = ball(dog, "#f2c67b", 0, 1.2, -.62, .49, .46, .54);
  head.castShadow = true;
  const muzzle = ball(dog, "#ffe0a1", 0, 1.06, -1.13, .33, .23, .33);
  const noseBridge = ball(dog, "#243b33", 0, 1.22, -1.36, .16, .12, .09);
  // The mouth and tongue sit on the muzzle's front surface so the happy
  // expression survives the small collection cards and the moving chase
  // camera. The old tongue was buried inside the muzzle at gameplay scale.
  const mouth = ball(dog, "#4a292b", 0, .92, -1.47, .14, .065, .035);
  const tongue = ball(dog, "#f5919d", 0, .87, -1.51, .095, .105, .045);
  // A small chest bib gives every classic face a readable light break against
  // the torso, especially on the narrow mobile viewport.
  const chestPatch = ball(dog, "#ffe0a1", 0, 1.01, -.72, .23, .28, .12);
  const ears = [], eyes = [], eyeDetails = [], eyePatches = [], brows = [];
  for (const side of [-1, 1]) {
    // Ears pivot from a skull anchor, so scaling or lifting a head cannot
    // leave a visible gap. The outer and inner layers share smooth profiles
    // instead of the old five-sided cone and detached box.
    const ear = new THREE.Group();
    ear.name = side < 0 ? "left-ear-anchor" : "right-ear-anchor";
    const outer = mesh(ear, classicEarGeometries.floppy, "#e9ac59", 0, 0, 0, 1, 1, 1);
    outer.castShadow = true;
    const inner = mesh(ear, classicEarGeometries.floppy, "#b97847", 0, 0, .16, 1, 1, 1);
    dog.add(ear);
    ears.push({ear, outer, inner, side});
    const eye = new THREE.Group(); eye.position.set(side*.25,1.39,-1.082);dog.add(eye);eyes.push(eye);
    const iris = ball(eye,"#20352d",0,0,0,.067,.09,.05);
    const pupil = ball(eye,"#111713",0,0,-.052,.035,.052,.012);
    const catchlight = ball(eye,"#fff7db",-.025,.04,-.066,.025,.033,.018);
    eyeDetails.push({eye, iris, pupil, catchlight});
    const patch = ball(dog, "#76503b", side * .25, 1.39, -1.11, .11, .12, .025);
    const brow = ball(dog, "#dcae70", side * .25, 1.56, -1.10, .15, .038, .035);
    brow.rotation.z = side * .10;
    eyePatches.push({patch, side});
    brows.push({brow, side});
  }
  const collar = ball(dog, "#ed734b", 0, 0.95, -0.26, 0.49, 0.13, 0.24);
  const scarf = ball(dog, "#d85235", 0.45, 0.82, 0.15, 0.09, 0.20, 0.48);
  scarf.rotation.z = -0.2;
  const legs = [], legParts = [];
  for (const x of [-0.29, 0.29])
    for (const z of [-0.34, 0.64]) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.68, z);
      const upper = ball(leg, "#c7823d", 0, -0.22, 0, 0.14, 0.29, 0.16);
      const paw = ball(leg, "#ffe3b1", 0, -0.46, -0.07, 0.16, 0.13, 0.22);
      dog.add(leg);
      legs.push(leg);
      legParts.push({leg, upper, paw});
    }
  const tail = new THREE.Group();
  tail.position.set(0, 1.05, 0.85);
  tail.rotation.x = 0.5;
  const tailBase = ball(tail, "#db994e", 0, 0.24, 0.16, 0.18, 0.35, 0.2);
  const tailTip = ball(tail, "#ffe3b1", 0, 0.57, 0.16, 0.17, 0.18, 0.19);
  dog.add(tail);
  const classicFur = createClassicFur(mat);
  dog.add(classicFur.group);
  const originalParts = dog.children.filter(part => part !== collar && part !== scarf);
  const furMeshes = [];
  dog.traverse(item => {
    if (item.isMesh) furMeshes.push({item, color: `#${item.material.color.getHexString()}`});
  });
  const spots = new THREE.Group(); dog.add(spots);
  const markingParts = [];
  for (const side of [-1, 1]) {
    markingParts.push(ball(spots, "#293a43", side * .47, .95, .3, .055, .17, .24));
    markingParts.push(ball(spots, "#293a43", side * .48, .75, -.1, .04, .12, .16));
  }
  markingParts.push(ball(spots, "#293a43", -.22, 1.34, -1.079, .18, .22, .035));
  // The extra face pieces are still shared sphere geometry. They become a
  // pale husky mask for Luna while Pepper keeps the original spot pattern.
  markingParts.push(ball(spots, "#293a43", .22, 1.34, -1.079, .18, .22, .035));
  markingParts.push(ball(spots, "#293a43", 0, 1.57, -1.055, .13, .17, .03));
  const outfits = Object.fromEntries(["explorer", "hero", "raincoat", "royal", "party"].map(id => {
    const group = new THREE.Group(); dog.add(group); return [id, group];
  }));
  ball(outfits.explorer, "#8c673c", 0, 1.68, -.62, .62, .07, .55);
  ball(outfits.explorer, "#cba96e", 0, 1.79, -.55, .38, .25, .34);
  box(outfits.explorer, "#687e4b", 0, 1.28, .28, .75, .36, .7);
  box(outfits.explorer, "#e7c984", 0, 1.48, .3, .14, .04, .67);
  const cape = mesh(outfits.hero,createCapeGeometry(),"#3988e8",0,1.23,.52,1,1,1);
  cape.material=cape.material.clone();cape.material.side=THREE.DoubleSide;
  cape.rotation.x = -.14;
  ball(outfits.hero, "#ffe577", 0, 1.33, .24, .18, .035, .18);
  ball(outfits.raincoat, "#ffd34e", 0, .91, .16, .50, .36, .76);
  box(outfits.raincoat, "#fff1a0", 0, 1.24, .12, .08, .04, 1.25);
  box(outfits.royal, "#f8c648", 0, 1.69, -.58, .7, .14, .65);
  for (const x of [-.25, 0, .25]) cone(outfits.royal, "#ffe286", x, 1.9, -.65, .13, .38, .13);
  cone(outfits.party, "#d97cf1", 0, 1.97, -.55, .36, .72, .36);
  ball(outfits.party, "#fff0a0", 0, 2.34, -.55, .12, .12, .12);
  const outfitPositions = Object.fromEntries(Object.entries(outfits).map(([id, group]) => [id, group.children.map(part => part.position.clone())]));
  const mochi = createMochiModel(); dog.add(mochi.group); mochi.group.visible = false;
  // The shipped puppy look is hand-painted raster artwork. Keep the old rig
  // alive for compatibility with the pose/diagnostic helpers, but take every
  // procedural dog part out of the render path so no low-poly pieces can peek
  // through the illustrated sprite during a swap or a costume preview.
  const rasterArtwork = createPuppyArtwork({mobile});
  dog.add(rasterArtwork.group);
  // Keep the painted dog as the only anatomy source, but let the progression
  // costumes sit on top of it.  Previously this list swallowed the outfit
  // groups along with the old rig, so every non-scarf wardrobe preview looked
  // identical to the bare dog (and the equipped reward silently disappeared
  // in a run).  Accessories are deliberately kept as their own shallow layer;
  // the low-poly anatomy remains hidden.
  const outfitGroups = new Set(Object.values(outfits));
  const legacyDogParts = dog.children.filter(
    part => part !== rasterArtwork.group && !outfitGroups.has(part),
  );
  const classicRig = {legs, eyes, ears, tail};
  const markingBase = markingParts.map(part => ({position:part.position.clone(),scale:part.scale.clone()}));
  let activeRig = classicRig;
  let appearanceKey = "";
  function dress(appearance = {}) {
    const key = `${appearance.puppy}:${appearance.costume}`;
    if (key === appearanceKey) return;
    appearanceKey = key;
    const puppyId = Object.hasOwn(PUPPIES, appearance.puppy) ? appearance.puppy : DEFAULT_PUPPY;
    const puppy = PUPPIES[puppyId];
    const isMochi = puppyId === "mochi";
    const visual = puppyVisual(puppyId);
    mochi.group.visible = isMochi;
    for (const part of originalParts) part.visible = !isMochi;
    classicFur.group.visible = !isMochi;
    activeRig = isMochi ? mochi : classicRig;
    const palette = {"#d89043":puppy.fur,"#e9ac59":puppy.fur,"#c7823d":puppy.fur,"#db994e":puppy.fur,"#f2c67b":puppy.head,"#ffe0a1":puppy.muzzle,"#ffe3b1":puppy.paws};
    for (const {item,color} of furMeshes) if (palette[color]) item.material = mat(palette[color]);

    // Sculpt each classic dog from the same shared geometry set. Keeping
    // these absolute resets makes rapid collection preview swaps stable.
    body.position.set(...visual.bodyPosition);
    body.scale.set(.47 * visual.bodyScale[0], .40 * visual.bodyScale[1], .88 * visual.bodyScale[2]);
    shoulder.position.set(...visual.shoulderPosition);
    shoulder.scale.set(.37 * visual.shoulderScale[0], .40 * visual.shoulderScale[1], .35 * visual.shoulderScale[2]);
    head.position.set(...visual.headPosition);
    head.scale.set(.49 * visual.headScale[0], .46 * visual.headScale[1], .54 * visual.headScale[2]);
    muzzle.position.set(...visual.muzzlePosition);
    muzzle.scale.set(.33 * visual.muzzleScale[0], .23 * visual.muzzleScale[1], .33 * visual.muzzleScale[2]);
    chestPatch.position.set(0, visual.muzzlePosition[1] - .05, visual.muzzlePosition[2] + .41);
    chestPatch.scale.set(.23 * visual.chestScale[0], .28 * visual.chestScale[1], .12 * visual.chestScale[2]);
    noseBridge.position.set(0, visual.muzzlePosition[1] + .16, visual.muzzlePosition[2] - .23);
    noseBridge.scale.set(.16 * visual.muzzleScale[0], .12 * visual.muzzleScale[1], .09 * visual.muzzleScale[2]);
    noseBridge.material = mat(visual.noseColor);
    mouth.position.set(0, visual.muzzlePosition[1] - .14, visual.muzzlePosition[2] - .34);
    mouth.scale.set(.14 * visual.muzzleScale[0], .065 * visual.muzzleScale[1], .035 * visual.muzzleScale[2]);
    tongue.position.set(0, visual.muzzlePosition[1] - .19, visual.muzzlePosition[2] - .39);
    tongue.scale.set(.10 * visual.muzzleScale[0], .12 * visual.muzzleScale[1], .045 * visual.muzzleScale[2]);
    classicFur.apply({visual, puppy});

    const headRadius = {
      x: .49 * visual.headScale[0],
      y: .46 * visual.headScale[1],
      z: .54 * visual.headScale[2],
    };
    for (const {ear,outer,inner,side} of ears) {
      const floppy = puppy.ears === "floppy";
      outer.geometry = floppy ? classicEarGeometries.floppy : classicEarGeometries.upright;
      inner.geometry = outer.geometry;
      outer.material = mat(puppy.fur);
      inner.material = mat(visual.earInnerColor || puppy.muzzle);
      // Root the group on the upper cheek. The small overlap is intentional:
      // it reads as fur growing out of the skull from every camera angle.
      const rootY = visual.headPosition[1] + headRadius.y * (floppy ? .38 : .53);
      const rootX = visual.headPosition[0] + side * Math.max(
        visual.earSpread,
        headRadius.x * (floppy ? .72 : .77),
      );
      // Keep the ear root just ahead of the skull. This small forward bias
      // makes the cheek-to-ear join read from the chase camera as well as the
      // front-facing clubhouse cards, instead of disappearing inside the head.
      const rootZ = (visual.earZ ?? visual.headPosition[2]) - headRadius.z * .16;
      ear.position.set(rootX, rootY, rootZ);
      ear.rotation.z = side * (floppy ? .10 : -.06);
      outer.position.set(0, 0, 0);
      outer.scale.set(...visual.earScale);
      inner.visible = true;
      inner.position.set(0, 0, .09);
      inner.scale.set(visual.earScale[0] * .62, visual.earScale[1] * .68, visual.earScale[2] * .16);
    }
    for (const {eye,iris,pupil,catchlight} of eyeDetails) {
      const side = eye.position.x < 0 ? -1 : 1;
      eye.position.set(side * visual.eyeSpread, visual.eyeY, visual.eyeZ);
      eye.scale.set(...visual.eyeScale);
      eye.userData.restScaleY = visual.eyeScale[1];
      iris.material = mat(visual.eyeColor);
      pupil.material = mat(visual.pupilColor);
      catchlight.position.set(-.025, .04, -.066);
      catchlight.scale.set(.025, .033, .018);
    }
    for (const {patch,side} of eyePatches) {
      patch.position.set(side * visual.eyeSpread, visual.eyeY, visual.eyeZ + .04);
      patch.scale.set(.11 * visual.eyeScale[0], .12 * visual.eyeScale[1], .025);
      patch.material = mat(visual.eyePatchColor || '#76503b');
    }
    for (const {brow,side} of brows) {
      brow.position.set(side * visual.eyeSpread, visual.eyeY + .15, visual.eyeZ - .025);
      brow.scale.set(.15 * visual.eyeScale[0], .038 * visual.eyeScale[1], .035);
      brow.material = mat(visual.browColor || puppy.head);
    }
    for (const {leg,upper,paw} of legParts) {
      leg.position.y = visual.legY;
      upper.scale.set(.14 * visual.legScale[0], .29 * visual.legScale[1], .16 * visual.legScale[2]);
      paw.scale.set(.16 * visual.legScale[0], .13 * visual.legScale[1], .22 * visual.legScale[2]);
    }
    tail.position.set(...visual.tailPosition);
    tail.rotation.x = visual.tailTilt;
    tailBase.scale.set(.18 * visual.tailScale[0], .35 * visual.tailScale[1], .20 * visual.tailScale[2]);
    tailTip.scale.set(.17 * visual.tailScale[0], .18 * visual.tailScale[1], .19 * visual.tailScale[2]);

    const layouts = visual.marking === 'mask'
      ? [
        {position:[-.17, 1.42, -1.095], scale:[.14, .19, .035]},
        {position:[.17, 1.42, -1.095], scale:[.14, .19, .035]},
        {position:[0, 1.66, -1.065], scale:[.14, .22, .035]},
      ]
      : markingBase.map(({position,scale}) => ({position:position.toArray(),scale:scale.toArray()}));
    for (let index = 0; index < markingParts.length; index++) {
      const part = markingParts[index];
      const layout = layouts[index];
      if (layout) {
        part.position.set(...layout.position);
        part.scale.set(...layout.scale);
      } else {
        part.position.copy(markingBase[index].position);
        part.scale.copy(markingBase[index].scale);
      }
      part.material = mat(visual.marking === 'mask' ? '#edf1f1' : '#343e45');
      part.visible = !isMochi && visual.marking !== 'none' && Boolean(layout);
    }
    spots.visible = !isMochi && visual.marking !== 'none';
    // The supplied raster illustrations already include their own collars and
    // tags. Never re-enable the old procedural collar/scarf meshes: at the
    // chase-camera scale they read as floating red orbs beside the torso.
    collar.material = mat(visual.collarColor || '#ed734b');
    collar.visible = scarf.visible = false;
    for (const [id, group] of Object.entries(outfits)) {
      // The illustrated puppet owns its costume plates now. Keep the legacy
      // mesh groups allocated for compatibility with older diagnostics, but
      // never let their coarse primitives cover the painted fur.
      group.visible = false;
      group.scale.set(1, 1, 1); group.position.set(0, 0, 0);
      group.children.forEach((part, index) => part.position.copy(outfitPositions[id][index]));
    }
    // Costumes are rendered as transparent raster accessory plates that share
    // the same source illustration and stay aligned through pose changes.
    rasterArtwork.apply(puppyId);
    rasterArtwork.setCostume(appearance.costume);
    for (const part of legacyDogParts) part.visible = false;
    rasterArtwork.group.visible = true;
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
      color: "#102b2d",
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      map: new THREE.CanvasTexture(shadowCanvas),
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.13;
  scene.add(shadow);
  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 20, 12),
    createShieldMaterial(),
  );
  aura.position.y = 0.9;
  dog.add(aura);
  const magnetField = new THREE.Group();
  scene.add(magnetField);
  const ringGeometry = new THREE.TorusGeometry(0.94, 0.028, 6, 48);
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({
        color: "#136a66",
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    magnetField.add(ring);
  }
  const flashes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 6, 4),
    new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
    192,
  );
  flashes.frustumCulled = false;
  scene.add(flashes);
  const flashMatrix = new THREE.Matrix4();
  const flashColor = new THREE.Color();
  // Allocate instance colors before shader warmup, not on the first pickup/hit.
  flashes.setColorAt(0,flashColor);
  const templates = {};
  const boneGeometry=createBoneGeometry();
  templates.bone = new THREE.Mesh(boneGeometry,
    new THREE.MeshStandardMaterial({
      vertexColors:true,
      roughness:.28,
      metalness:.05,
      emissive:'#fff0b8',
      emissiveIntensity:.18,
    }));
  templates.bone.scale.setScalar(1.55);
  const boneTransform=templates.bone.clone();
  const boneBatch=createInstanceBatch(scene,boneGeometry,templates.bone.material);
  templates.rock = new THREE.Group();
  const boulder = mesh(templates.rock,createBoulderGeometry(),"#293e49",0,1.05,0,.94,1.1,.8);
  const riverBanks=createRiverBanks(scene,boulder.geometry);
  boulder.rotation.y = .35;
  ball(templates.rock, "#77996b", -.12, 1.98, 0, .78, .2, .65);
  box(templates.rock, "#e9dca6", 0, 1.08, 0.72, 0.35, 0.7, 0.06);
  templates.log = createLogModel(mesh,box);
  templates.arch = new THREE.Group();
  for (const x of [-1, 1])
    box(templates.arch, "#154052", x, 1.45, 0, 0.3, 2.9, 0.6);
  box(templates.arch, "#175c70", 0, 1.95, 0, 2.2, 1.15, 0.7);
  box(templates.arch, "#78a89a", 0, 2.56, 0, 2.3, .12, .78);
  for (const x of [-1,1]) box(templates.arch,"#8fa98f",x,.15,0,.43,.3,.72);
  box(templates.arch, "#102b36", 0, 1.46, 0.38, 1.85, 0.22, 0.08);
  for(const x of [-.72,.72])
    box(templates.arch, "#b3ffe7", x, 1.48, .43, .2, .15, .04);
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
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(-.5,.55);
  shieldShape.lineTo(.5,.55);
  shieldShape.lineTo(.45,-.1);
  shieldShape.quadraticCurveTo(.3,-.45,0,-.65);
  shieldShape.quadraticCurveTo(-.3,-.45,-.45,-.1);
  shieldShape.closePath();
  const shieldGeometry = new THREE.ExtrudeGeometry(shieldShape, {
    depth: .16, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 1, steps: 1, curveSegments: 4,
  });
  const shieldFace = new THREE.Mesh(shieldGeometry,mat("#126078"));
  templates.shield.add(shieldFace);
  box(templates.shield, "#d3fff3", 0, .02, .21, .12, .7, .05);
  box(templates.shield, "#d3fff3", 0, .16, .21, .58, .12, .05);
  templates.rock.scale.y = 0.72;
  templates.branch = createBranchModel(box,ball);
  templates.gate = new THREE.Group();
  for (const x of [-1, 1])
    box(templates.gate, "#154052", x, 1.5, 0, 0.3, 3, 0.4);
  for (const x of [-0.65, 0, 0.65])
    box(templates.gate, "#175c70", x, 2.1, 0, 0.16, 1.55, 0.3);
  box(templates.gate, "#102b36", 0, 1.33, 0, 2.1, 0.22, 0.4);
  for(const x of [-.8,.8])
    box(templates.gate, "#b3ffe7", x, 1.35, .23, .2, .15, .04);
  templates.gem = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.66),
    new THREE.MeshStandardMaterial({color:"#962ed4",roughness:.3,metalness:.15,flatShading:true}));
  gem.scale.set(.8,1.15,.65);
  templates.gem.add(gem);
  templates.double = new THREE.Group();
  ball(templates.double, "#ffce4f", 0, 0, 0, 0.65, 0.65, 0.22);
  // A readable ×2 stamp, not two vertical bars resembling Pause.
  for (const angle of [-Math.PI / 4, Math.PI / 4])
    box(templates.double, "#784e22", -.23, 0, .24, .07, .32, .07).rotation.z = angle;
  for (const y of [-.22, 0, .22])
    box(templates.double, "#784e22", .18, y, .24, .28, .07, .07);
  box(templates.double, "#784e22", .285, .11, .24, .07, .22, .07);
  box(templates.double, "#784e22", .075, -.11, .24, .07, .22, .07);
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
  const haloGeometry = new THREE.TorusGeometry(0.96, 0.026, 6, 40);
  templates.zoomies = new THREE.Group();
  ball(templates.zoomies, "#a4d329", 0, 0, 0, .55, .55, .55);
  const tennisSeam = new THREE.TorusGeometry(.55,.045,6,32);
  for (const tilt of [-.7,.7]) {
    const seam = new THREE.Mesh(tennisSeam,mat("#244c2b"));
    seam.rotation.y = tilt; templates.zoomies.add(seam);
  }
  // Course relics are compact, area-tinted keepsakes: a faceted core and a
  // vertical ring make the optional end-of-course reward legible at speed.
  templates.relic = new THREE.Group();
  // Reuse the gem's octahedron and the magnet-field torus so this reward adds
  // no new GPU geometry to the mobile renderer's fixed resource budget.
  const relicCore = new THREE.Mesh(gem.geometry, mat("#efbf67"));
  relicCore.name = "relic-core";
  relicCore.scale.set(.25, .41, .25);
  templates.relic.add(relicCore);
  const relicRing = new THREE.Mesh(ringGeometry, mat("#fff0b7"));
  relicRing.name = "relic-ring";
  relicRing.scale.setScalar(.48);
  relicRing.rotation.x = Math.PI / 2;
  templates.relic.add(relicRing);
  box(templates.relic, "#173b3e", 0, 0, .08, .08, .5, .08).name = "relic-mark";
  const speedTrail = new THREE.Group(); scene.add(speedTrail);
  for (let i=0;i<8;i++) {
    const streak = box(speedTrail,"#386326",(i%2 ? 1 : -1)*(.65+(i%3)*.2),.3+(i%3)*.3,.6+i*.4,.055,.055,.8);
    streak.userData.phase=i/8;
  }
  for (const type of PICKUPS.filter((type) => type !== "bone")) {
    const halo = new THREE.Mesh(
      haloGeometry,
      new THREE.MeshBasicMaterial({
        color: type === "magnet" ? "#85f8ed" : "#fff1bb",
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      }),
    );
    templates[type].add(halo);
    templates[type].scale.multiplyScalar(1.38);
  }
  templates.gap = new THREE.Group();
  templates['crystal-rock'] = new THREE.Group();
  for (const [x,height] of [[-.45,.8],[0,1.55],[.45,1.05]]) {
    const crystal=cone(templates['crystal-rock'],x===0?'#513187':'#256884',x,height/2,0,.65,height,.65);
    crystal.rotation.z=x*.3;
  }
  box(templates.gap,"#153c48",0,-.24,0,2.4,.08,5);
  for(const z of [-2.6,2.6]) {
    box(templates.gap,"#efae45",0,.12,z,2.4,.22,.22);
    for(const x of [-.8,0,.8]) box(templates.gap,"#5d422c",x,.25,z,.3,.04,.24);
  }
  const routeLabels=document.createElement('canvas');
  routeLabels.width=1024;routeLabels.height=512;
  const routeText=routeLabels.getContext('2d');
  for(const [index,title,subtitle,color] of [[0,'SCENIC','Fewer obstacles','#a7e59e'],[1,'CHALLENGE','More points','#f0b762'],[2,'↑ JUMP','Catch the zipline','#a2ffde']]) {
    const x=(index%2)*512,y=Math.floor(index/2)*256;
    routeText.fillStyle=color;routeText.fillRect(x,y,512,256);
    routeText.fillStyle='#102a28';routeText.textAlign='center';
    routeText.font='bold 58px Arial';routeText.fillText(title,x+256,y+110);
    routeText.font='36px Arial';routeText.fillText(subtitle,x+256,y+174);
  }
  const routeLabelTexture=new THREE.CanvasTexture(routeLabels);
  routeLabelTexture.colorSpace=THREE.SRGBColorSpace;
  const routeLabelMaterial=new THREE.MeshBasicMaterial({map:routeLabelTexture,toneMapped:false});
  function routeLabel(width,height,index) {
    const geometry=new THREE.PlaneGeometry(width,height),uv=geometry.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+index%2)/2,(uv.getY(i)+1-Math.floor(index/2))/2);
    return new THREE.Mesh(geometry,routeLabelMaterial);
  }
  for(const [index,type,color] of [[0,"choice-left","#a7e59e"],[1,"choice-right","#f0b762"]]) {
    const gate=new THREE.Group();templates[type]=gate;
    for(const x of [-1,1])box(gate,"#66795f",x,1.8,0,.12,3.6,.18);
    box(gate,color,0,3.3,0,2.1,1.05,.18);
    const label=routeLabel(2.05,1,index);label.position.set(0,3.3,.105);gate.add(label);
  }
  // Roadside chevrons identify a deliberate corner without covering the trail.
  for (const direction of ['left', 'right']) {
    const marker = new THREE.Group();
    templates[`corner-${direction}`] = marker;
    const sign = direction === 'right' ? 1 : -1;
    for (const x of [-5.1, 5.1]) {
      box(marker, '#65543c', x, 1.05, 0, .14, 2.1, .16);
      box(marker, '#edc36d', x, 1.95, 0, 1.28, .82, .18);
      box(marker, '#173b3e', x, 1.95, .13, 1.14, .65, .07);
      for (const offset of [-.38, .38]) for (const side of [-1, 1]) {
        const stripe = box(marker, '#fff0b7', x + offset * .7 + sign * .06, 1.95 + side * .13, .20, .38, .10, .05);
        stripe.rotation.z = -sign * side * Math.PI / 4;
      }
    }
  }
  for (const type of ["zipline-start", "zipline-end"]) {
    const station = new THREE.Group();
    templates[type] = station;
    for (const x of [-4.5, 4.5]) {
      box(station, "#765036", x, 3.3, 0, .5, 6.6, .6);
      box(station, "#efd6a0", x, .35, 0, .75, .7, .9);
    }
    box(station, "#cf9e61", 0, 6.5, 0, 9.5, .4, .6);
    if (type === "zipline-start") {
      box(station, "#25494d", 0, 4.75, 0, .08, 3.5, .08);
      box(station, "#185965", 0, 3, 0, 6.5, .24, .24);
      // Three visible grips show that jumping can catch from any lane.
      for(const x of LANES)box(station,"#a2ffde",x,3,.03,.6,.3,.3);
      box(station, "#225c60", 0, 5.4, .4, 3.6, 1.8, .12).userData.ziplineSign=true;
      const label=routeLabel(3.5,1.7,2);label.userData.ziplineSign=true;label.position.set(0,5.4,.47);station.add(label);
    }
  }
  // Mine-cart stations are deliberately lower than the zipline gantry. They
  // read as a new traversal beat at speed without filling the phone viewport
  // with another overhead wall.
  for (const type of ["minecart-start", "minecart-end"]) {
    const station = new THREE.Group();
    templates[type] = station;
    const accent = type === 'minecart-start' ? '#f2c56d' : '#a7e59e';
    for (const x of [-3.8, 3.8]) {
      box(station, '#5c493d', x, 1.4, 0, .22, 2.8, .24);
      box(station, accent, x, 2.65, 0, .42, .16, .32);
    }
    box(station, '#6d4934', 0, 2.65, 0, 8.1, .22, .28);
    box(station, accent, 0, 3.05, .05, 3.2, .64, .12);
    for (const x of [-1.15, 0, 1.15])
      box(station, '#f8e7ae', x, 3.05, .14, .16, .42, .05);
    if (type === 'minecart-start') {
      const lamp = ball(station, '#ffe18a', 0, 1.75, .32, .20, .20, .12);
      lamp.userData.lantern = true;
    }
  }
  const zipHandle = new THREE.Group(); scene.add(zipHandle);
  box(zipHandle, "#185965", 0, 0, 0, 1.6, .22, .22);
  for(const side of [-1,1]) box(zipHandle, "#a2ffde", side*.65, 0, .03, .3, .24, .24);
  const zipTether = box(scene, "#25494d", 0, 0, 0, .065, 1, .065);
  const active = new Map(),
    pools = Object.fromEntries(
      Object.keys(templates).map((type) => [type, []]),
    );
  // Reuse the small per-frame lookup collections. The trail already recycles
  // meshes; keeping these caches recycled too avoids periodic Safari GC while
  // a portrait run is rendering thousands of frames.
  const frameCache = new Map();
  const visibleIds = new Set();
  const gapObjects = [];
  function resize() {
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  let visualRun = null,
    pose = 1,
    lean = 0,
    pitch = 0,
    cameraX = 0,
    cameraLift = 0,
    animationTime = 0;
  const bendMatrix = new THREE.Matrix4(),
    instanceMatrix = new THREE.Matrix4();
  const bendScale = new THREE.Vector3();
  const bendEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const routeRotation = new THREE.Quaternion();
  const routePosition = new THREE.Vector3();
  const framePuppy=createPuppyFramer();
  let puppyFrame=null;
  const templateScene=new THREE.Group();
  for (const [type, template] of Object.entries(templates)) {
    if (!PICKUPS.includes(type)) template.traverse(part => {
      if (part.isMesh) { part.castShadow = part.userData.shadowDetail!==true; part.receiveShadow = true; }
    });
  }
  templateScene.add(...Object.values(templates));
  const shaderPreparation=createShaderPreparation(renderer,scene,camera,templateScene);
  return {
    prepareShaders:(force=false)=>shaderPreparation.start(force),
    instructionImage(action) {
      const subject=new THREE.Group();
      if(action==='lanes') {
        for(const x of [-1.2,1.2]){const item=templates.rock.clone(true);item.scale.setScalar(.7);item.position.x=x;subject.add(item);}
      } else subject.add(templates[action==='jump'?'log':'arch'].clone(true));
      scene.add(subject);
      const visibility=scene.children.map(item=>[item,item.visible]);
      const background=scene.background,fog=scene.fog;
      try {
        for(const item of scene.children)item.visible=item===subject||item.isLight===true;
        scene.background=new THREE.Color('#24483f');scene.fog=null;
        camera.fov=52;camera.aspect=192/112;camera.position.set(0,2.6,5.2);camera.lookAt(0,1.1,0);
        camera.updateProjectionMatrix();renderer.setSize(192,112,false);renderer.render(scene,camera);
        return canvas.toDataURL('image/png');
      } finally {
        scene.remove(subject);
        for(const [item,visible] of visibility)item.visible=visible;
        scene.background=background;scene.fog=fog;resize();
      }
    },
    portrait(run, appearance, rear = false) {
      // Reuse the existing GPU context; thumbnails never create another renderer.
      this.draw(run, 0, "kennel", true, 0, 1, appearance);
      const visibility = scene.children.map(item => [item, item.visible]);
      const background = scene.background, fog = scene.fog;
      try {
        for (const item of scene.children) item.visible = item === dog || item.isLight === true;
        scene.background = new THREE.Color('#24483f'); scene.fog = null;
        // The painted illustrations already carry a friendly three-quarter
        // view. Avoid the old procedural rig's near-sideways turn here: a
        // large Y rotation makes billboarded raster layers drift apart.
        dog.position.set(0,0,0); dog.rotation.set(0,rear ? .35 : 0,0);
        camera.fov=52;camera.aspect = 1; camera.position.set(0,2.0,3.4); camera.lookAt(0,1.1,0);
        camera.updateProjectionMatrix(); renderer.setSize(192,192,false);
        renderer.render(scene,camera);
        return canvas.toDataURL('image/png');
      } finally {
        for (const [item, visible] of visibility) item.visible = visible;
        scene.background = background; scene.fog = fog;
        resize();
      }
    },
    draw(run, time, state, reducedMotion, dt, alpha = 1, collection, frameDt = dt) {
      const menu = ["menu", "help", "shop", "kennel"].includes(state);
      // Action paintings are warmed when a trail actually starts, not while the
      // menu idles. Streaming them on the menu uploaded textures the player had
      // not asked for and pushed mobile GPUs toward a context loss; deferring
      // them to the first jump instead made that first silhouette pop.
      if (!menu && state === 'playing') rasterArtwork.warmActionPoses();
      const fov=menu ? 52 : gameplayFov(camera.aspect);
      if(camera.fov!==fov) { camera.fov=fov;camera.updateProjectionMatrix(); }
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
        pitch = 0;
        cameraX = run.x;
        cameraLift = 0;
        for (const leg of [...legs, ...mochi.legs]) leg.rotation.x = 0;
      }
      if (state === "playing" || menu) animationTime += dt;
      time = animationTime;
      const blend = state === "playing" ? alpha : 1;
      const x = THREE.MathUtils.lerp(run.previous.x, run.x, blend),
        y = THREE.MathUtils.lerp(run.previous.y, run.y, blend);
      const distance = menu
        ? time * (reducedMotion ? 0 : 2)
        : THREE.MathUtils.lerp(run.previous.distance, run.distance, blend);
      // Several hundred instanced pieces share fewer than 200 route frames.
      frameCache.clear();
      const sampleRoute=createRouteSampler(distance,{route:menu?null:run.route});
      const frameAt = z => {
        if (!frameCache.has(z)) frameCache.set(z, sampleRoute(z));
        return frameCache.get(z);
      };
      const groundFrame = frameAt(0);
      // The valley floor stays below the elevated trail instead of cutting it off.
      ground.position.y = -12;
      const smooth = 1 - Math.exp(-18 * dt);
      const weight = bodyMotion({vx:run.vx,vy:run.vy,y,time:run.time,landing:run.landing,
        ziplining:Boolean(run.zipline),reducedMotion:reducedMotion||menu});
      const atmosphere = areaBlend(menu ? 0 : distance);
      scene.background.copy(areaColors[atmosphere.previous].sky).lerp(areaColors[atmosphere.index].sky,atmosphere.blend);
      scene.fog.color.copy(scene.background);
      sky.material.color.copy(scene.background);
      ground.material.color.copy(areaColors[atmosphere.previous].ground).lerp(areaColors[atmosphere.index].ground,atmosphere.blend);
      horizonProfile(menu ? 0 : distance, horizon);
      for(const mountain of mountains) {
        blendMountainArea(mountain,atmosphere);
        mountain.material.color.copy(ground.material.color).lerp(scene.background,horizon.haze+mountain.userData.depthHaze);
        const base=mountain.userData.baseScale;
        mountain.scale.set(base.x*horizon.width,base.y*horizon.height,base.z);
      }
      gapObjects.length = 0;
      if (!menu)
        for (const object of run.objects)
          if (object.type === "gap" && object.lane === 1) gapObjects.push(object);
      const gaps = gapObjects;
      if (state === "playing" || menu) {
        pose += ((menu || run.slide === 0 ? 1 : 0.46) - pose) * smooth;
        lean += (weight.lean - lean) * smooth;
        pitch += (weight.pitch - pitch) * smooth;
      }
      for (const { instanced, entries } of batches) {
        entries.forEach((entry, i) => {
          const z =
            entry.start -
            ((entry.offset - (distance % entry.period) + entry.period) %
              entry.period);
          const region = regionAt(menu ? 0 : distance-z);
          if(entry.region!==undefined&&(entry.region!==region||entry.variant!==areaAt(menu?0:distance-z)%2)){
            instanced.setMatrixAt(i,instanceMatrix.makeScale(0,0,0));return;
          }
          const cableClip = entry.cable ? cableSegment(z) : null;
          const frame = frameAt(cableClip ? cableClip.z : z);
          bendEuler.set(frame.pitch, frame.yaw, 0, 'YXZ');
          routeRotation.setFromEuler(bendEuler);
          // Extra overlap closes the outside edge of the short curved slabs.
          const overlap = entry.road && !entry.cable ? 1 + (entry.terrain ? 30 : 4.6) * Math.abs(frame.curvature) : 1;
          bendMatrix.compose(routePosition.set(frame.x, frame.y, frame.z), routeRotation, bendScale.set(1, 1, overlap*(entry.road?(frame.stretch||1):1)));
          instanceMatrix.multiplyMatrices(bendMatrix, entry.matrix);
          if(cableClip) instanceMatrix.scale(bendScale.set(cableClip.thicknessScale,cableClip.thicknessScale,cableClip.scale));
          const bridge = !menu && isBridge(distance-z);
          const cableSection = !menu && ziplineAt(distance-z);
          const raftSection=!menu&&run.raftPrototype&&raftAt(distance-z);
          const corner = upcomingCorner(distance-z-70);
          const cornerSection = !menu && corner && distance-z > corner.at-45 && distance-z < corner.end+20;
          if (entry.cable ? !cableSection : (entry.road && entry.bridge !== bridge) || (!entry.road && (bridge || cableSection))) instanceMatrix.scale(bendScale.set(0,0,0));
          if(raftSection&&(!entry.road||!entry.terrain))instanceMatrix.scale(bendScale.set(0,0,0));
          // Decorative gateways must not masquerade as playable slide gates.
          if (entry.gateway && (!menu || cornerSection || z > 0)) instanceMatrix.scale(bendScale.set(0,0,0));
          if (!menu && entry.road && !entry.terrain && !entry.cable &&
              corner && distance-z >= corner.at && distance-z <= corner.end)
            instanceMatrix.scale(bendScale.set(0,0,0));
          if(entry.road && !entry.cable && gaps.some(gap => Math.abs(distance-z-gap.at)<.1)) instanceMatrix.scale(bendScale.set(0,0,0));
          if(entry.terrain){
            instanced.geometry.attributes.terrainStation.setX(i,terrainStation(distance,z));
            const blend=areaBlend(menu?0:distance-z);
            areaGroundColor.copy(areaColors[blend.previous].ground).lerp(areaColors[blend.index].ground,blend.blend);
            instanced.setColorAt(i,areaGroundColor);
          }else if(entry.road && !entry.bridge && !entry.cable){
            instanced.setColorAt(i,sampleTrailColor(entry.trailColors,menu?0:distance-z,areaGroundColor));
          }else if(entry.road || entry.region === undefined) instanced.setColorAt(i,entry.bridge || entry.cable ? entry.color : entry.colors[region]);
          instanced.setMatrixAt(i, instanceMatrix);
        });
        instanced.instanceMatrix.needsUpdate = true;
        instanced.instanceColor.needsUpdate = true;
        if(entries[0].terrain)instanced.geometry.attributes.terrainStation.needsUpdate=true;
      }
      cornerRoad.update(distance, frameAt, menu);
      water.update(distance, frameAt, menu, dt, state === 'playing' && !reducedMotion);
      const river=run.raftPrototype&&!menu?raftIntersecting(distance-12,distance+170):null;
      if(river)raftWater.update(distance,frameAt,false,dt,state==='playing'&&!reducedMotion,river,run.raft?x:null);
      else raftWater.mesh.visible=false;
      riverBanks.update(distance,frameAt,river);
      const cartSection=!menu&&run.minecartPrototype?minecartIntersecting(distance-12,distance+170):null;
      dog.position.set(
        menu ? 0 : x,
        (menu ? 0 : y) +
          Math.abs(Math.sin(time * 12)) *
            (reducedMotion || (!menu && (state !== "playing" || y>.05 || run.slide>0 || run.zipline || run.raft || run.minecart)) ? 0 : 0.045),
        0,
      );
      // Keep the illustrated artwork front-facing in camp. The source pose
      // already has a natural three-quarter angle; a 135° procedural turn
      // would mirror the tail and make the articulated raster layers read as
      // detached pieces. Gameplay still banks with the route via `lean`.
      dog.rotation.y = menu ? 0 : lean;
      dog.rotation.z = menu || reducedMotion ? 0 : lean * 0.3;
      dog.rotation.x = menu ? 0 : groundFrame.pitch + (reducedMotion ? 0 : pitch);
      dog.scale.setScalar(1);
      const personality = puppyPose(time,distance,{menu,reducedMotion,airborne:y>.1&&!run.minecart,sliding:run.slide>0,ziplining:!menu && Boolean(run.zipline),rafting:!menu&&Boolean(run.raft)});
      const crouch=activeRig===mochi?mochiCrouch((1-pose)/.54):null;
      dog.scale.y = ((crouch?.scaleY ?? pose) + personality.breathe) * (1-weight.compression);
      dog.scale.x = dog.scale.z = 1+weight.compression*.4;
      if(crouch) {
        dog.position.y-=crouch.lowering;
        dog.scale.z*=crouch.scaleZ;
        if(y<=.1&&!run.zipline)personality.legs=personality.legs.map((angle,i)=>THREE.MathUtils.lerp(angle,crouch.legs[i],crouch.amount));
      }
      dog.visible = true;
      raftModel.visible=!menu&&(Boolean(run.raft)||Boolean(river&&distance<river.start));
      if(run.raft&&!menu){
        raftModel.position.set(x,0,0);
        raftModel.rotation.set(groundFrame.pitch,reducedMotion?0:lean*.5,0);
        dog.position.y+=run.raft.boardingHeight*Math.max(0,1-(run.time-run.raft.boardedAt)/.25);
      }else if(raftModel.visible){
        const boarding=frameAt(distance-river.start);
        raftModel.position.set(boarding.x+x*Math.cos(boarding.yaw),boarding.y,boarding.z-x*Math.sin(boarding.yaw));
        raftModel.rotation.set(boarding.pitch,boarding.yaw,0,'YXZ');
      }
      minecartModel.visible=!menu&&!run.raft&&(
        Boolean(run.minecart)||Boolean(cartSection&&distance<cartSection.start)
      );
      if(run.minecart&&!menu){
        minecartModel.position.set(
          groundFrame.x+x*Math.cos(groundFrame.yaw),
          groundFrame.y,
          groundFrame.z-x*Math.sin(groundFrame.yaw),
        );
        minecartModel.rotation.set(
          groundFrame.pitch,
          groundFrame.yaw+(reducedMotion?0:lean*.18),
          0,
          'YXZ',
        );
        // Give the puppy a little settling lift as the cart catches it. The
        // authored cart body remains visible under the paws instead of making
        // the ride look like a floating sprite.
        dog.position.y+=.24+(run.minecart.boardingHeight||0)*Math.max(0,1-(run.time-run.minecart.boardedAt)/.22);
      }else if(minecartModel.visible){
        const boarding=frameAt(distance-cartSection.start);
        minecartModel.position.set(boarding.x,boarding.y,boarding.z);
        minecartModel.rotation.set(boarding.pitch,boarding.yaw,0,'YXZ');
      }
      const cartWheels=minecartModel.userData.wheels||[];
      const cartAnimated=state==='playing'&&!reducedMotion&&minecartModel.visible;
      cartWheels.forEach((wheel,index)=>{
        const spin=cartAnimated?(time*7.5+(index%2)*Math.PI):0;
        wheel.rotation.set(spin,0,wheel.userData.baseRotation||Math.PI/2);
      });
      const lantern=minecartModel.userData.lantern;
      if(lantern)lantern.scale.setScalar(cartAnimated?1+.08*Math.sin(time*8):1);
      // Stroke the shared raft paddles as a paired, out-of-phase gesture. The
      // motion is cosmetic and frozen for reduced-motion users, while the
      // existing parent transform keeps the paddles aligned to bends and
      // banking just like the logs and the sailor puppy.
      const raftOars=raftModel.userData.oars||[];
      const paddleAnimated=state==='playing'&&!reducedMotion&&raftModel.visible;
      const paddleStroke=paddleAnimated?Math.sin(time*4.8)*.22:0;
      raftOars.forEach((oar,index)=>{
        const base=oar.userData.baseRotation||{x:0,y:0,z:0};
        const side=oar.userData.side|| (index===0?-1:1);
        const phase=paddleAnimated?Math.sin(time*4.8+index*Math.PI)*.22:0;
        oar.rotation.set(
          base.x + phase,
          base.y + paddleStroke*.16*side,
          base.z,
        );
      });
      let rasterAngles = activeRig.legs.map(leg => leg.rotation.x);
      if (state === "playing" || menu) {
        rasterAngles=smoothLegAngles(rasterAngles,personality.legs,dt);
        for (let i = 0; i < activeRig.legs.length; i++) activeRig.legs[i].rotation.x = rasterAngles[i];
      }
      // The painted puppy is an authored full-body pose stack. Keep the
      // eased route lean for turns, but let jump/slide/hang silhouettes follow
      // the same collision state as the physics rather than faking the action
      // by scaling a portrait. A caught cable selects the dedicated hanging
      // painting so the paws meet the handle and the body trails below it.
      rasterArtwork.setPose({
        time,
        legs:rasterAngles,
        verticalVelocity:run.vy,
        impact:weight.compression,
        // `bodyMotion.lean` is already eased from the lane velocity, so use
        // the opposite signed velocity as a decisive turn impulse. The two
        // terms reinforce instead of cancelling during the first half of a
        // lane change, which guarantees the authored three-quarter frame is
        // visible for the actual steering gesture.
        turn:THREE.MathUtils.clamp(
          lean * 2 + groundFrame.yaw * .45 - run.vx * .055
            + (!run.zipline && !run.raft ? -x * .32 : 0),
          -1,
          1,
        ),
        airborne:y>.1 && !run.zipline && !run.raft && !run.minecart,
        sliding:run.slide>0,
        hanging:!menu && Boolean(run.zipline),
        rafting:!menu && Boolean(run.raft),
        // Mochi's default ground run is viewed from the owner's chase-camera
        // perspective. The dedicated rear painting is optional and scoped to
        // Mochi, while jumps, slides, turns, ziplines, and raft travel keep
        // their more legible authored action silhouettes.
        away:!menu && activeRig===mochi && !run.zipline && !run.raft,
        // The wide supplied gallop frame is reserved for a real bend or lane
        // bank, where its side profile reinforces the direction of travel.
        side:!menu && activeRig===mochi && !run.zipline && !run.raft &&
          (Math.abs(lean)>.045 || Math.abs(groundFrame.yaw)>.055),
        menu,
        reducedMotion,
      });
      for (const eye of activeRig.eyes) eye.scale.y = (eye.userData.restScaleY ?? 1) * personality.blink;
      for (const {ear,side} of activeRig.ears) ear.rotation.x = personality.ears*side;
      cape.rotation.x = -.14 + personality.cape;
      activeRig.tail.rotation.z = personality.tail;
      zipHandle.visible = zipTether.visible = !menu && Boolean(run.zipline);
      zipHandle.position.set(x, y + PUPPY_HANG_HANDLE_HEIGHT, -.15);
      const tetherHeight = 6.5 - (y + PUPPY_HANG_HANDLE_HEIGHT);
      zipTether.position.set(x / 2, (6.5 + y + PUPPY_HANG_HANDLE_HEIGHT) / 2, -.15);
      zipTether.scale.y = Math.hypot(x, tetherHeight);
      zipTether.rotation.z = Math.atan2(x, tetherHeight);
      scarf.rotation.x = reducedMotion ? 0 : Math.sin(time * 12) * 0.15;
      shadow.position.x = dog.position.x;
      shadow.rotation.x = -Math.PI / 2 + (menu ? 0 : groundFrame.pitch);
      const contact=contactShadow(y,distance,gaps);
      shadow.scale.setScalar(contact.scale);
      shadow.material.opacity = contact.opacity;
      shadow.visible = contact.opacity > 0 && !run.raft && !run.minecart;
      aura.visible = !menu && run.shield > 0;
      magnetField.visible = !menu && run.magnet > 0;
      speedTrail.visible = !menu && run.zoomies > 0;
      speedTrail.position.set(x,y,0);
      speedTrail.children.forEach(streak => {
        streak.position.z = .6 + (reducedMotion ? streak.userData.phase : (animationTime * 2 + streak.userData.phase) % 1) * 3;
      });
      magnetField.position.set(x, 0.18, 0);
      // Use the trail tangent, not an always-horizontal plane or the jumping
      // dog's pose. This keeps rings above the paving on climbs and descents.
      magnetField.rotation.set(groundFrame.pitch,groundFrame.yaw,0,'YXZ');
      magnetField.children.forEach((ring, i) => {
        const pulse=magnetPulse(time,i,reducedMotion);
        // Keep the attraction cue close to the puppy. The old full-size
        // rings spread across the lane and hid the next obstacle on phones;
        // two compact pulses communicate the same active state at a glance.
        ring.scale.setScalar(pulse.scale * .42);
        ring.material.opacity = pulse.opacity * .42;
      });
      let sparkCount = 0;
      if (!menu && !reducedMotion && !run.ended)
        for (const effect of run.effects) {
          const age = run.time - effect.time;
          if (age < 0 || age >= .45) continue;
          flashColor.set(effectColor(effect.type));
          const impact=effect.type==='hit'||effect.type==='shield-break';
          const landing=effect.type==='land';
          const takeoff=effect.type==='jump';
          const size=(impact?.14:landing?.075:takeoff?.052:.07)*(1-age/.45);
          const spread=landing?4.5:takeoff?2.2:impact?5:3;
          const lift=landing?1.4:takeoff?1.0:2;
          for (let i = 0; i < 6 && sparkCount < 192; i++) {
            const angle = (i * Math.PI) / 3;
            flashMatrix.makeScale(
              size,
              size,
              size,
            );
            flashMatrix.setPosition(
              effect.x + Math.cos(angle) * age * spread,
              effect.y + Math.sin(angle) * age * lift,
              age * 2,
            );
            flashes.setColorAt(sparkCount, flashColor);
            flashes.setMatrixAt(sparkCount++, flashMatrix);
          }
        }
      flashes.count = sparkCount;
      flashes.instanceMatrix.needsUpdate = true;
      if(flashes.instanceColor)flashes.instanceColor.needsUpdate = true;
      visibleIds.clear();
      boneBatch.begin();
      if (!menu)
        for (const object of run.objects) {
          if (!objectVisible(object, distance)) continue;
          const bone=object.type==='bone';
          if(!bone)visibleIds.add(object.id);
          let item = bone ? boneTransform : active.get(object.id);
          if (!item) {
            const renderType = object.type === 'rock' && object.courseRegion === 2 ? 'crystal-rock' : object.type;
            item = pools[renderType].pop() || templates[renderType].clone();
            item.userData.type = renderType;
            themeHazard(item,renderType,object.at,mat);
            active.set(object.id, item);
            scene.add(item);
          }
          const pickup = PICKUPS.includes(object.type);
          for (const child of item.children) if (child.userData.ziplineSign)
            child.visible=ziplineSignVisible(object,distance);
          item.position.set(
            LANES[object.lane],
            pickup
              ? (object.airborne ? ZIPLINE_HEIGHT + 1.1 : 1.1) +
                  (reducedMotion ? 0 : Math.sin(time * 3 + object.id) * 0.12)
              : object.raftHazard?-.55:0,
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
            ? pickupYaw(object.type,time,reducedMotion)
            : 0;
          const frame = frameAt(item.position.z), across = item.position.x;
          item.position.set(frame.x + across * Math.cos(frame.yaw), item.position.y + frame.y,
            frame.z - across * Math.sin(frame.yaw));
          item.rotation.x = pickup ? 0 : frame.pitch;
          item.rotation.y += frame.yaw;
          item.rotation.order = 'YXZ';
          if(bone) {
            item.updateMatrix();
            boneBatch.add(item.matrix);
          }
        }
      boneBatch.end();
      for (const [id, item] of active)
        if (!visibleIds.has(id)) {
          scene.remove(item);
          pools[item.userData.type].push(item);
          active.delete(id);
        }
      if (menu) {
        puppyFrame=null;
        const mobile = camera.aspect < 0.85;
        camera.position.set(6, mobile ? 4 : 3.3, mobile ? 11 : 7.7);
        const compact = mobile && canvas.clientHeight<=700 && canvas.clientHeight>520;
        camera.lookAt(mobile ? -1 : -3.5, mobile ? compact ? .5 : 2.2 : 1.25, 0);
      } else {
        if (state === "playing") {
          cameraX += (x - cameraX) * (1 - Math.exp(-5 * dt));
          cameraLift += ((run.zipline ? y * .7 : 0) - cameraLift) * (1 - Math.exp(-4 * dt));
        }
        camera.position.set(
          cameraX * (camera.aspect < 0.85 ? 0.45 : 0.13),
          4.5 + cameraLift,
          camera.aspect < 0.85 ? 10.8 : 9,
        );
        const look = frameAt(-13);
        camera.lookAt(cameraX * (camera.aspect < 0.85 ? 0.4 : 0.12) + look.x * detourCameraWeight(distance,run.route), 0.75 + cameraLift + look.y * .65, -13);
        puppyFrame=framePuppy(camera,dog.position);
      }
      const nextRatio = quality.sample(frameDt, state === 'playing');
      if (nextRatio !== null) {
        renderer.setPixelRatio(nextRatio);
        resize();
      }
      renderer.render(scene, camera);
      if(menu&&shaderPreparation.status==='idle')void shaderPreparation.start();
    },
    // Some iOS/WebKit builds expose the context-lost flag one frame before
    // dispatching the canvas event. The app uses this lightweight probe to
    // enter the same paused recovery path instead of treating that frame as a
    // fatal renderer exception.
    contextLost() {
      try { return renderer.getContext()?.isContextLost?.() === true; }
      catch { return false; }
    },
    diagnostics() {
      return {shaderPreparation:shaderPreparation.status,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawCalls:renderer.info.render.calls,activeObjects:active.size+boneBatch.count,boneInstances:boneBatch.count,boneCapacity:boneBatch.capacity,pooledObjects:Object.values(pools).reduce((sum,items)=>sum+items.length,0),puppyFrame:puppyFrame?{...puppyFrame}:null,legAngles:activeRig.legs.map(leg=>leg.rotation.x),bodyTransform:[...dog.position.toArray(),dog.rotation.x,dog.rotation.y,dog.rotation.z,...dog.scale.toArray()]};
    },
  };
}
