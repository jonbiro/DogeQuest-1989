import * as THREE from "three";
import {createInstanceBatch} from './instance-batch.js';
import {createShaderPreparation} from './shader-preparation.js';
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { LANES, PICKUPS, seededRandom } from "./world.js";
import { createRouteSampler } from "./route.js";
import { upcomingCorner } from "./turns.js";
import { objectVisible, ziplineSignVisible, ziplineSpineOpacity, ziplineSpineVisible } from "./visibility.js";
import { createCornerRoad } from "./corner-road.js";
import { PUPPIES, DEFAULT_PUPPY } from "./collection.js";
import { puppyVisual } from "./puppy-visuals.js";
import { REGIONS, regionAt, horizonProfile } from "./regions.js";
import {AREAS,areaAt,areaBlend,worldMoodAt,WORLD_MOODS,landmarkSway,landmarkVariation,LANDMARK_SHOULDER_MIN,LANDMARK_SHOULDER_SPREAD} from './areas.js';
import {createBoneGeometry} from './bone-model.js';
import {createCapeGeometry} from './cape-model.js';
import {createSky} from './sky.js';
import {createMountainGeometry,blendMountainArea} from './mountain.js';
import { puppyPose, smoothLegAngles, bodyMotion, mochiCrouch, pawDust } from "./puppy-pose.js";
import { createMochiModel } from "./mochi-model.js";
import { createClassicEarGeometries } from "./ear-model.js";
import { createClassicFur } from "./classic-fur.js";
import { isBridge, bridgeCollapseState } from "./bridges.js";
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
import {trailColors,sampleTrailColor,sampleTrailMarkColor} from './trail-palette.js';
import {createShieldMaterial} from './shield-material.js';
import {magnetPulse} from './magnet-field.js';
import {pickupYaw, pickupPulse, pickupBob} from './pickup-motion.js';
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
import {skiIntersecting, skiVisualBlend, skiYetiX, skiSnowballX} from './ski.js';
import {createSkiModel} from './ski-model.js';
import {movingGateX} from './moving-gate.js';
import {createRiverBanks} from './river-banks.js';
import {createPuppyArtwork,PUPPY_HANG_HANDLE_HEIGHT} from './puppy-artwork.js';
import {ATMOSPHERE_PARTICLE_COUNT,sampleAtmosphereParticle} from './atmosphere.js';
import {pickupBadgeFor} from './pickup-guide.js';
import {ghostAt} from './ghost.js';
import {dogChaseProgress} from './dog-chase.js';
import {laneTargetFor} from './lane-target.js';

const PICKUP_GLOW_COLORS = Object.freeze({
  magnet: '#8ff2e7',
  shield: '#b9edff',
  gem: '#edb5ff',
  double: '#ffe08c',
  heart: '#ffb4c8',
  gift: '#e8c5ff',
  zoomies: '#d9f58c',
  relic: '#e8c7ff',
});

// Set-piece approaches need a small world-space punctuation mark. The
// director already names the beat in the HUD; this palette lets the same beat
// arrive in the trail with a colour cue instead of another centre-screen card.
const SPECTACLE_BEACON_COLORS = Object.freeze([
  ['bridge', '#ff9b78'],
  ['river', '#8fd8ff'],
  ['mine-cart', '#ffd27a'],
  ['minecart', '#ffd27a'],
  ['zipline', '#a2ffde'],
  ['frostpeak', '#9fe4ff'],
  ['ski', '#9fe4ff'],
  ['moving gate', '#f4d58a'],
  ['puppy chase', '#f6b5ff'],
  ['fork', '#c5f0a5'],
]);

function spectacleBeaconColor(title) {
  const value = String(title || '').toLocaleLowerCase();
  return SPECTACLE_BEACON_COLORS.find(([needle]) => value.includes(needle))?.[1]
    || '#ffe0a0';
}

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
  // Keep one pair of lights alive for the whole run. Their colors and energy
  // are blended with the destination below, so each landscape gets a real
  // lighting identity without allocating lights every frame.
  const hemisphere = new THREE.HemisphereLight("#dcf7ff", "#1f403a", 1.8);
  scene.add(hemisphere);
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
  const areaLighting=AREAS.map(area=>({
    sky:new THREE.Color(area.lighting?.sky || area.sky),
    ground:new THREE.Color(area.lighting?.ground || area.ground),
    hemi:Number.isFinite(area.lighting?.hemi) ? area.lighting.hemi : 1.8,
    sun:new THREE.Color(area.lighting?.sun || '#fff0ce'),
    sunPower:Number.isFinite(area.lighting?.sunPower) ? area.lighting.sunPower : 3.5,
  }));
  const moodPalettes=WORLD_MOODS.map(mood=>({
    sky:new THREE.Color(mood.sky),
    ground:new THREE.Color(mood.ground),
    sun:new THREE.Color(mood.sun),
    strength:Number.isFinite(mood.strength)?mood.strength:.1,
  }));
  const hemisphereSkyColor=new THREE.Color();
  const hemisphereGroundColor=new THREE.Color();
  const sunlightColor=new THREE.Color();
  const areaGroundColor=new THREE.Color();
  const moodSkyColor=new THREE.Color();
  const moodGroundColor=new THREE.Color();
  const moodSunColor=new THREE.Color();
  const skiSkyColor=new THREE.Color('#b9d9ef');
  const skiGroundColor=new THREE.Color('#eef8fb');
  const skiSunColor=new THREE.Color('#fff8ec');
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
    // Destination inlays live on the outer shoulder, outside the collision
    // envelope of the three lanes. Their short, alternating dashes give a
    // player peripheral route feedback without adding another sign or HUD
    // layer. The recycled tile transform keeps them aligned through bends.
    for (const side of [-1, 1]) for (let mark = 0; mark < 3; mark++) {
      const inlay = box(tile, '#6d9d6c', side * 3.62, 0.145, -1.7 + mark * 1.7,
        0.23, 0.045, 0.58);
      inlay.rotation.y = side * (mark % 2 ? -0.18 : 0.18);
      inlay.userData.areaMark = true;
      inlay.userData.markSlot = mark;
    }
    // Alternative deck shares the road's recycled instances and curve transform.
    const bridge = new THREE.Group();
    const bridgeBox = (...args) => {
      const part = box(bridge, ...args);
      part.userData.bridge = true;
      return part;
    };
    for (let plank = 0; plank < 6; plank++) {
      const part = bridgeBox(plank % 2 ? "#b77c4c" : "#c9915e", 0, .02, -2.08 + plank * .833, 7.8, .22, .79);
      part.userData.bridgePart = 'deck';
      part.userData.bridgePlank = plank;
    }
    for (const x of [-4.05, 4.05]) {
      const post = bridgeBox("#765036", x, .65, 0, .23, 1.6, .23);
      post.userData.bridgePart = 'post';
      for (const y of [.5, 1.3]) {
        const rail = bridgeBox("#efd6a0", x, y, 0, .1, .1, 5.4);
        rail.userData.bridgePart = 'rail';
      }
      const brace = bridgeBox("#64472e", x, -.45, 0, .22, .22, 5.4);
      brace.userData.bridgePart = 'brace';
    }
    tile.add(bridge);
    // Keep the overhead cable in the same readable mint family as the catch
    // handle. It gets its own unlit batch below, so the line cannot inherit a
    // gateway shadow and turn into a near-black stroke across the sky.
    const cable = box(tile, "#6fcfbd", 0, 6.5, 0, .11, .11, CABLE_SEGMENT_LENGTH);
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
  // Each 225m destination gets a small landmark family. These are deliberately
  // low-count, pooled silhouettes rather than a second forest layer: the eye
  // gets a memorable place cue while the playable corridor stays uncluttered.
  for (let area = 0; area < AREAS.length; area++) for (let i = 0; i < 12; i++) {
    const group = new THREE.Group();
    const side = i % 2 ? 1 : -1;
    // The previous 7–17 unit spread was mostly outside a portrait chase
    // camera. Bring the signature into the shoulder zone so each destination
    // reads as a place while remaining safely beyond the road edge.
    group.position.x = side * (LANDMARK_SHOULDER_MIN + random() * LANDMARK_SHOULDER_SPREAD);
    Object.assign(group.userData, {
      area,
      offset: i * 8.4 + area * 17,
      variant: 2,
    });
    if (area === 0) {
      // Sunleaf: a broad tree with two warm firefly beacons in its crown.
      const height = 4.6 + random() * 2.8;
      mesh(group, trunkGeometry, '#5d5c3e', 0, height / 2, 0, .42, height, .42);
      ball(group, '#36775a', -.7, height, 0, 1.55, 1.18, 1.4);
      ball(group, '#5a9860', .75, height + .3, .1, 1.45, 1.12, 1.3);
      for (const x of [-.65, .62]) ball(group, '#ffe49a', x, height + .08, -.95, .12, .12, .12);
    } else if (area === 1) {
      // Bamboo: three slim stalks and a single lantern that reads at distance.
      for (let stalk = 0; stalk < 3; stalk++) {
        const x = (stalk - 1) * .62;
        const height = 4.5 + random() * 2.4;
        mesh(group, trunkGeometry, '#718f55', x, height / 2, 0, .16, height, .16);
        for (let y = 1.1; y < height - .2; y += 1.35) box(group, '#a7b56a', x, y, 0, .27, .1, .27);
        addBambooLeaves(group, palmFrondGeometry, mesh, x, height);
      }
      box(group, '#c49a59', 0, 2.55, -.78, .5, .72, .32);
      ball(group, '#ffe09a', 0, 2.55, -1.02, .15, .18, .15);
    } else if (area === 2) {
      // Redrock: layered buttes replace the generic round trees at the edge.
      for (let mesa = 0; mesa < 3; mesa++) {
        const x = (mesa - 1) * 1.15;
        const height = 2.2 + random() * 2.9;
        cone(group, mesa === 1 ? '#c8734f' : '#a6533b', x, height / 2, 0, .75 + random() * .3, height, .82);
        box(group, '#e1a36e', x, height + .12, 0, .75, .14, .8);
      }
      ball(group, '#eab27b', 0, .26, .1, 1.9, .28, 1.25);
    } else if (area === 3) {
      // Oasis: a readable fan palm and a low crescent of warm fruit.
      const height = 4.8 + random() * 2.2;
      mesh(group, trunkGeometry, '#8b6c43', 0, height / 2, 0, .28, height, .28);
      for (let frond = 0; frond < 7; frond++) {
        const angle = frond * Math.PI * 2 / 7;
        const leaf = mesh(group, featheredPalmGeometry, frond % 2 ? '#4f8051' : '#6da05d',
          Math.cos(angle) * 1.5, height, Math.sin(angle) * 1.5, 1.65, 1.08, 1.1);
        leaf.rotation.y = -angle;
      }
      for (const x of [-.5, 0, .5]) ball(group, '#e7bd69', x, .32, -.55, .16, .16, .16);
    } else if (area === 4) {
      // Crystal Reach: three translucent-looking color families of shard.
      for (let shard = 0; shard < 4; shard++) {
        const height = 2.4 + random() * 3.2;
        const x = (shard - 1.5) * .68;
        const crystal = cone(group, ['#79c5d8', '#9b8de4', '#b9e5ee', '#777fc4'][shard],
          x, height / 2, 0, .43, height, .48);
        crystal.rotation.z = (shard - 1.5) * .16;
      }
      ball(group, '#a9d5e0', 0, .28, .12, 1.8, .3, 1.2);
    } else {
      // Mooncap: a crescent of mushroom caps gives the night area a clear
      // silhouette without putting glowing geometry in the runner's lane.
      for (let mushroom = 0; mushroom < 3; mushroom++) {
        const x = (mushroom - 1) * 1.05;
        const height = 1.7 + mushroom * .65;
        mesh(group, trunkGeometry, '#8c7897', x, height / 2, 0, .22, height, .22);
        mesh(group, mushroomCapGeometry, ['#9278b1', '#b89bc9', '#7775ad'][mushroom], x, height, 0, 1.12, .72, 1.02);
        ball(group, '#e2d1e7', x, height - .17, -.72, .1, .1, .1);
      }
    }
    scenery.add(group);
    decorations.push(group);
  }
  // A handful of large, low-cost destination signatures make each area feel
  // like a place to arrive at rather than another palette swap. They sit just
  // beyond the lane shoulders, use the same shared geometry as the pooled
  // foliage above, and are intentionally sparse so bones and hazards remain
  // the visual priority. The four variants repeat at different depths, which
  // gives a run a changing skyline without allocating per-frame objects.
  for (let area = 0; area < AREAS.length; area++) for (let variant = 0; variant < 4; variant++) {
    const group = new THREE.Group();
    const side = variant % 2 ? 1 : -1;
    group.position.x = side * (LANDMARK_SHOULDER_MIN + 1.05 + (variant % 3) * 1.25);
    Object.assign(group.userData, {
      area,
      offset: area * 31 + variant * 47 + 13,
      variant: 3,
      signature: AREAS[area].landmark,
    });
    if (area === 0) {
      // Sunleaf: a forked root arch with a pair of warm firefly lamps.
      box(group, '#5a5036', -.82, 1.65, 0, .42, 3.3, .44).rotation.z = -.18;
      box(group, '#5a5036', .82, 1.65, 0, .42, 3.3, .44).rotation.z = .18;
      box(group, '#6f6340', 0, 3.15, 0, 1.82, .38, .46);
      ball(group, variant % 2 ? '#4e9864' : '#3f855a', 0, 4.05, 0, 1.55, 1.05, 1.25);
      ball(group, '#ffe49a', -.62, 3.35, -.52, .12, .12, .12);
      ball(group, '#fff0b0', .62, 3.35, -.52, .12, .12, .12);
    } else if (area === 1) {
      // Bamboo: a compact lantern gate; the open centre keeps the road visible.
      for (const x of [-.7, .7]) {
        mesh(group, trunkGeometry, '#6f8f53', x, 2.25, 0, .2, 4.5, .2);
        for (let y = 1; y < 4.3; y += 1.1) box(group, '#a8b86e', x, y, 0, .29, .08, .29);
      }
      box(group, '#7a5c3f', 0, 4.35, 0, 1.72, .22, .25);
      box(group, '#c89154', 0, 2.65, -.36, .42, .62, .3);
      ball(group, '#ffe49a', 0, 2.65, -.57, .12, .15, .12);
    } else if (area === 2) {
      // Redrock: a warm split butte with a bright cap that reads in silhouette.
      cone(group, '#a9513b', -.82, 2.05, 0, 1.05, 4.1, .92);
      cone(group, '#c16b4c', .78, 2.7, 0, 1.18, 5.4, 1.02);
      box(group, '#e2a16b', .78, 5.42, 0, .78, .16, .8);
      ball(group, '#e9b27b', 0, .3, .1, 1.55, .26, 1.05);
    } else if (area === 3) {
      // Oasis: fan palm, shallow pool and a few bright stepping stones.
      const height = 4.5 + (variant % 2) * .55;
      mesh(group, trunkGeometry, '#8a6741', 0, height / 2, 0, .3, height, .3);
      for (let frond = 0; frond < 6; frond++) {
        const angle = frond * Math.PI * 2 / 6;
        const leaf = mesh(group, featheredPalmGeometry, frond % 2 ? '#4d8052' : '#6d9f5c',
          Math.cos(angle) * 1.35, height, Math.sin(angle) * 1.35, 1.45, .95, 1.05);
        leaf.rotation.y = -angle;
      }
      ball(group, '#9ed7c7', 0, .18, -.42, 1.8, .12, .88);
      for (const x of [-.55, 0, .55]) ball(group, '#e9c477', x, .32, -.72, .14, .14, .14);
    } else if (area === 4) {
      // Crystal Reach: an unmistakable three-spire prism cluster.
      for (let shard = 0; shard < 3; shard++) {
        const height = 3 + shard * .85 + (variant % 2) * .35;
        const crystal = cone(group, ['#66c6d8', '#9e91e6', '#b9e6ee'][shard],
          (shard - 1) * .72, height / 2, 0, .54, height, .58);
        crystal.rotation.z = (shard - 1) * .14;
      }
      ball(group, '#7ba5c0', 0, .3, .12, 1.65, .25, 1.08);
    } else {
      // Mooncap: a crescent of luminous caps gives the night run its own icon.
      for (let mushroom = 0; mushroom < 3; mushroom++) {
        const x = (mushroom - 1) * .92;
        const height = 1.8 + mushroom * .7;
        mesh(group, trunkGeometry, '#806d91', x, height / 2, 0, .2, height, .2);
        mesh(group, mushroomCapGeometry, ['#846cab', '#b799ce', '#6c72a8'][mushroom], x, height, 0, 1.05, .68, .96);
        ball(group, '#e8d8ee', x, height - .16, -.66, .11, .11, .11);
      }
      ball(group, '#595a82', 0, .22, .08, 1.7, .23, 1.15);
    }
    scenery.add(group);
    decorations.push(group);
  }
  // Low, readable trail motifs give the player something to discover during
  // the quiet approach to a turn. They are deliberately shoulder-only and
  // much smaller than the destination signatures, so they add rhythm without
  // stealing the silhouette of bones, hazards, or Mochi. Each motif reuses the
  // pooled geometry above and is filtered by the active destination at runtime.
  for (let area = 0; area < AREAS.length; area++) for (let i = 0; i < 8; i++) {
    const group = new THREE.Group();
    const side = i % 2 ? 1 : -1;
    const shoulder = LANDMARK_SHOULDER_MIN + .18 + (i % 3) * .42;
    group.position.x = side * shoulder;
    Object.assign(group.userData, {
      area,
      offset: area * 29 + i * 13 + 9,
      variant: 4,
      trailMotif: true,
    });
    if (area === 0) {
      // Sunleaf: a small fern fan and a warm seed-stone.
      mesh(group, trunkGeometry, '#4e6f49', 0, .38, 0, .10, .76, .10);
      for (let leaf = 0; leaf < 3; leaf++) {
        const frond = mesh(group, palmFrondGeometry, leaf % 2 ? '#6e9b5b' : '#8ab56a',
          (leaf - 1) * .24, .75 + leaf * .08, -.06, .52, .34, .45);
        frond.rotation.z = (leaf - 1) * .24;
      }
      ball(group, '#e4c979', 0, .14, -.12, .38, .10, .28);
    } else if (area === 1) {
      // Bamboo: paired shoots with a tiny lantern stripe as a visual beat.
      for (const x of [-.26, .26]) {
        mesh(group, trunkGeometry, '#68884f', x, .66, 0, .09, 1.32, .09);
        for (const y of [.38, .83, 1.25]) box(group, '#a4b56d', x, y, 0, .14, .045, .14);
      }
      box(group, '#c79152', 0, .62, -.16, .24, .32, .18);
      ball(group, '#ffe49a', 0, .62, -.29, .07, .08, .07);
    } else if (area === 2) {
      // Redrock: three warm pebbles read as a cairn at the road edge.
      for (let rock = 0; rock < 3; rock++) {
        const pebble = cone(group, rock === 1 ? '#d28157' : '#a9573f',
          (rock - 1) * .28, .18 + rock * .18, -.04, .32 - rock * .035,
          .36 + rock * .13, .28);
        pebble.rotation.z = (rock - 1) * .15;
      }
    } else if (area === 3) {
      // Oasis: three stepping stones catch a pale highlight beside the road.
      for (let stone = 0; stone < 3; stone++) {
        ball(group, stone === 1 ? '#f0cf80' : '#c5ae6f', (stone - 1) * .34,
          .12, -.10 - stone * .04, .25, .09, .18);
      }
      ball(group, '#8fcfc0', 0, .075, .22, .48, .035, .22);
    } else if (area === 4) {
      // Crystal Reach: two low shards make the cool palette legible even when
      // the horizon is hazy.
      for (let shard = 0; shard < 2; shard++) {
        const crystal = cone(group, shard ? '#9d91e3' : '#6ec6d8',
          (shard - .5) * .35, .52, 0, .20, .98 + shard * .18, .24);
        crystal.rotation.z = shard ? .12 : -.12;
      }
      ball(group, '#c5efff', 0, .12, -.18, .27, .055, .20);
    } else {
      // Mooncap: a pair of tiny caps makes the night trail feel alive without
      // adding a bright HUD-like glow to the playable corridor.
      for (let mushroom = 0; mushroom < 2; mushroom++) {
        const x = (mushroom - .5) * .46;
        const height = .52 + mushroom * .20;
        mesh(group, trunkGeometry, '#77678b', x, height / 2, 0, .10, height, .10);
        mesh(group, mushroomCapGeometry, mushroom ? '#ae91c4' : '#7d78b0',
          x, height, 0, .44, .25, .38);
      }
      ball(group, '#d8cae8', 0, .09, -.18, .22, .045, .16);
    }
    scenery.add(group);
    decorations.push(group);
  }
  // One compact postcard landmark per destination makes a long run feel like
  // a sequence of places rather than an endless loop of trees. These silhouettes
  // sit outside the shoulders and reuse the existing batched geometries, so a
  // richer skyline costs no per-frame allocations or extra draw calls.
  for (let area = 0; area < AREAS.length; area++) {
    const group = new THREE.Group();
    const side = area % 2 ? 1 : -1;
    group.position.x = side * (LANDMARK_SHOULDER_MIN + 2.15);
    Object.assign(group.userData, {
      area,
      offset: area * 37 + 21,
      variant: 5,
      setPiece: AREAS[area].setPiece?.id,
    });
    if (area === 0) {
      // Sunleaf: a tiny paw-shelter hut with a bright sign and leafy roof.
      box(group, '#315968', 0, .92, 0, 1.15, 1.55, .72);
      cone(group, '#e08a58', 0, 1.95, 0, .98, .72, .74).rotation.y = Math.PI / 5;
      box(group, '#ffe09a', 0, 1.02, .39, .38, .52, .05);
      box(group, '#2a5360', 0, 1.02, .43, .06, .34, .035);
      box(group, '#2a5360', 0, 1.02, .43, .26, .06, .035);
      ball(group, '#ffe49a', -.72, 1.75, -.18, .12, .12, .12);
      ball(group, '#fff0b0', .72, 1.75, -.18, .12, .12, .12);
    } else if (area === 1) {
      // Bamboo: a small torii-style lantern shrine, open in the middle.
      for (const x of [-.72, .72]) {
        mesh(group, trunkGeometry, '#6f8f53', x, 1.45, 0, .18, 2.9, .18);
        box(group, '#a8b86e', x, .7, 0, .26, .08, .26);
      }
      box(group, '#7a5c3f', 0, 2.72, 0, 1.82, .2, .26);
      box(group, '#c89154', 0, 1.82, -.34, .42, .56, .3);
      ball(group, '#ffe49a', 0, 1.82, -.56, .13, .16, .13);
    } else if (area === 2) {
      // Redrock: a ranger flag and a three-stone cairn give the pass a
      // distinctive vertical marker without becoming another road hazard.
      mesh(group, trunkGeometry, '#59423d', 0, 1.6, 0, .1, 3.2, .1);
      box(group, '#f0b15e', .42, 2.45, 0, .72, .42, .06).rotation.z = -.12;
      for (let rock = 0; rock < 3; rock++)
        cone(group, rock === 1 ? '#d28157' : '#a9573f', 0, .22 + rock * .28, 0,
          .42 - rock * .05, .42 + rock * .12, .36);
    } else if (area === 3) {
      // Oasis: a waterwheel built from chunky spokes and a striped market awning.
      ball(group, '#d8b26c', 0, 1.12, .08, .72, .72, .16);
      for (let spoke = 0; spoke < 4; spoke++) {
        const arm = box(group, '#a87343', 0, 1.12, .2, .13, 1.35, .12);
        arm.rotation.z = spoke * Math.PI / 4;
      }
      box(group, '#4c815d', 0, 2.28, 0, 1.55, .16, .72);
      box(group, '#e8c476', 0, 2.05, .34, 1.62, .1, .05);
    } else if (area === 4) {
      // Crystal Reach: a little prism observatory with a three-shard crown.
      for (const x of [-.62, .62])
        box(group, '#4a7185', x, 1.12, 0, .11, 2.25, .11);
      box(group, '#6d94a6', 0, 2.18, 0, 1.52, .12, .14);
      for (let shard = 0; shard < 3; shard++) {
        const crystal = cone(group, ['#79c5d8', '#9b8de4', '#b9e5ee'][shard],
          (shard - 1) * .42, 2.65 + shard * .16, 0, .32, 1.2 + shard * .18, .32);
        crystal.rotation.z = (shard - 1) * .16;
      }
    } else {
      // Mooncap: a cozy tent and paired firefly lamps establish a clear night
      // chapter silhouette while leaving the road itself quiet.
      cone(group, '#6d5f91', 0, 1.28, 0, 1.1, 2.15, .9).rotation.y = Math.PI / 4;
      box(group, '#e1c77a', 0, 1.1, .64, .34, .5, .05);
      for (const x of [-.85, .85]) {
        mesh(group, trunkGeometry, '#806d91', x, 1.25, 0, .08, 2.5, .08);
        ball(group, '#e8d8ee', x, 2.35, -.08, .16, .16, .16);
      }
      mesh(group, mushroomCapGeometry, '#ae91c4', 0, .32, -.16, .42, .25, .38);
    }
    scenery.add(group);
    decorations.push(group);
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
      // Keep the gateway as a landmark, not a ceiling across the camera. Two
      // separated canopy pieces preserve the silhouette while opening a clear
      // window over the road, bones, and puppy as the player runs underneath.
      for (const side of [-1, 1])
        box(group, "#9daa80", side * 3.1, 5.65, 0, 4.2, 0.30, 1.15);
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
  // One recycled batch gives every destination a quiet visual signature:
  // fireflies in the woods, drifting leaves in bamboo, warm dust in Redrock,
  // glints in the oasis, crystal motes in the reach, and spores at Mooncap.
  // The particles live beyond the road shoulders so they enrich the horizon
  // without competing with bones, hazards, or the puppy's silhouette.
  const atmosphereGeometry = new THREE.OctahedronGeometry(1, 0);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: .46,
    depthWrite: false,
    depthTest: true,
    fog: true,
    toneMapped: false,
  });
  const atmosphereParticles = new THREE.InstancedMesh(
    atmosphereGeometry,
    atmosphereMaterial,
    ATMOSPHERE_PARTICLE_COUNT,
  );
  atmosphereParticles.name = 'area-atmosphere-particles';
  atmosphereParticles.frustumCulled = false;
  atmosphereParticles.renderOrder = .12;
  atmosphereParticles.setColorAt(0, new THREE.Color('#ffffff'));
  scene.add(atmosphereParticles);
  const atmospherePalettes = AREAS.map(area => ({
    color: new THREE.Color(area.atmosphere.color),
    accent: new THREE.Color(area.atmosphere.accent),
  }));
  const atmospherePrimary = new THREE.Color();
  const atmosphereAccent = new THREE.Color();
  const atmosphereParticleColor = new THREE.Color();
  const atmosphereMatrix = new THREE.Matrix4();
  const atmospherePosition = new THREE.Vector3();
  const atmosphereScale = new THREE.Vector3();
  const atmosphereEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const atmosphereQuaternion = new THREE.Quaternion();
  const atmospherePoint = {};
  // Separate road receivers from scenery casters to avoid layered paving
  // shadowing itself. Each geometry remains one shared instanced scenery draw.
  const batches = [];
  const batchMaterial = new THREE.MeshStandardMaterial({
    roughness: 0.82,
    flatShading: false,
    map: surface, bumpMap: surface, bumpScale: .04,
  });
  // Cables are route guidance, not scenery. An unlit material keeps their
  // silhouette consistent across bright and dark destinations, while the
  // slight transparency lets the horizon remain visible behind the line.
  const cableMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    vertexColors: true,
    transparent: true,
    opacity: .9,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false,
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
            bridgePart: item.userData.bridgePart,
            bridgePlank: item.userData.bridgePlank,
            cable: item.userData.cable === true,
            terrain: item.userData.terrain === true,
            edge: item.userData.edge === true,
            areaMark: item.userData.areaMark === true,
            markSlot: item.userData.markSlot || 0,
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
            area: group.userData.area,
            setPiece: group.userData.setPiece,
            gateway: group.userData.gateway === true,
            motion: group.userData.area !== undefined &&
              (geometry === palmFrondGeometry ||
                geometry === featheredPalmGeometry ||
                geometry === mushroomCapGeometry),
          });
      });
    for (const groupEntries of [
      entries.filter(entry=>entry.terrain),
      entries.filter(entry=>entry.road&&!entry.terrain&&!entry.cable),
      entries.filter(entry=>entry.road&&!entry.terrain&&entry.cable),
      entries.filter(entry=>!entry.road),
    ]) {
    if (!groupEntries.length) continue;
    const isTerrain=groupEntries[0].terrain;
    const isCable=groupEntries[0].cable === true;
    const batchGeometry=isTerrain?geometry.clone():geometry;
    if(isTerrain)batchGeometry.setAttribute('terrainStation',new THREE.InstancedBufferAttribute(new Float32Array(groupEntries.length),1).setUsage(THREE.DynamicDrawUsage));
    const instanced = new THREE.InstancedMesh(
      batchGeometry,
      isTerrain ? terrainMaterial : isCable ? cableMaterial : batchMaterial,
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
    instanced.receiveShadow = !isCable;
    scene.add(instanced);
    batches.push({ instanced, entries:groupEntries });
    }
  }
  scene.remove(scenery);
  // Frostpeak gets a small, persistent snow dressing that follows the same
  // curved route frames as the road. Reusing these pads and landmarks avoids
  // allocating a new mountain scene every time the chapter repeats.
  const skiLandscape = new THREE.Group();
  skiLandscape.name = 'frostpeak-landscape';
  skiLandscape.visible = false;
  scene.add(skiLandscape);
  const skiPads = [];
  for (let index = 0; index < 48; index++) {
    const pad = box(skiLandscape, '#eaf5f8', 0, .03, 0, 9.35, .07, 5.9);
    pad.material = pad.material.clone();
    pad.material.roughness = .96;
    pad.material.transparent = true;
    pad.material.opacity = .92;
    pad.userData.offset = index * 5.9 - 34;
    pad.castShadow = false;
    pad.receiveShadow = true;
    skiPads.push(pad);
  }
  const skiLandmarks = [];
  for (let index = 0; index < 14; index++) {
    const marker = new THREE.Group();
    const side = index % 2 ? 1 : -1;
    marker.userData.offset = index * 21 + 10;
    marker.userData.side = side;
    marker.userData.baseScale = .82 + (index % 3) * .12;
    // Layered snow cones read as distant peaks, while the turquoise flags
    // make the safe gate language visible from the approach.
    cone(marker, index % 3 ? '#d2e8f2' : '#c4dfec', 0, 2.25, 0, 1.4, 4.5 + (index % 4) * .45, 1.2);
    cone(marker, '#f5fbff', -.2, 3.25, -.15, .84, 1.75, .72);
    box(marker, '#5d8ca3', 0, .7, 0, .10, 1.4, .10);
    box(marker, index % 2 ? '#79d2df' : '#f2b76a', side * .28, 1.28, 0, .52, .34, .06);
    ball(marker, '#edfaff', side * .28, 1.28, -.05, .11, .11, .05);
    marker.visible = false;
    skiLandscape.add(marker);
    skiLandmarks.push(marker);
  }
  const cornerRoad = createCornerRoad(scene);
  const water = createWaterSurface(scene);
  const raftWater=createWaterSurface(scene);
  const raftModel=createRaftModel(mesh,boxGeometry,trunkGeometry);scene.add(raftModel);
  const minecartModel=createMinecartModel(mesh,boxGeometry,trunkGeometry);scene.add(minecartModel);
  const skiModel=createSkiModel(mesh,boxGeometry);scene.add(skiModel);
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
  const mochi = createMochiModel();
  dog.add(mochi.group);
  // Mochi's old procedural rig remains allocated for pose diagnostics and
  // backwards-compatible helpers, but it must never enter the live render.
  // Keeping it visible for the default puppy layered a low-poly second dog
  // underneath the authored paintings: ears and paws could peek through the
  // transparent gaps, and clubhouse outfit portraits picked up the same
  // polygon silhouette. Every selectable puppy now has one visual source.
  mochi.group.visible = false;
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
    // The active rig still supplies inexpensive timing data for diagnostics,
    // but the illustrated stack is the only anatomy rendered for Mochi too.
    // Do not re-enable the legacy procedural mesh when the default puppy is
    // selected; it creates a duplicate silhouette behind the painting.
    mochi.group.visible = false;
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
  // A personal ghost reuses the already-resident authored puppy painting. The
  // old box-and-sphere silhouette was cheap, but it made the replay look like
  // one of the polygon dogs the runner had just replaced. Keep the companion
  // in its own group so the trail frame, action pose and soft floor beacon can
  // move together without allocating another texture catalog on mobile.
  const ghostGroup = new THREE.Group();
  ghostGroup.name = 'personal-ghost-pacer';
  ghostGroup.visible = false;
  ghostGroup.renderOrder = 1.1;
  const ghostArtwork = new THREE.Sprite(new THREE.SpriteMaterial({
    color: '#e9fff9',
    transparent: true,
    opacity: .5,
    depthTest: true,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }));
  ghostArtwork.name = 'painted-puppy-ghost';
  ghostArtwork.visible = false;
  ghostArtwork.frustumCulled = false;
  ghostArtwork.renderOrder = 1.12;
  const ghostRim = new THREE.Sprite(new THREE.SpriteMaterial({
    color: '#71e1cd',
    transparent: true,
    opacity: .2,
    depthTest: true,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }));
  ghostRim.name = 'painted-puppy-ghost-rim';
  ghostRim.visible = false;
  ghostRim.frustumCulled = false;
  ghostRim.renderOrder = 1.105;
  ghostGroup.add(ghostRim, ghostArtwork);
  const ghostShadow = new THREE.Mesh(
    new THREE.CircleGeometry(1, 18),
    new THREE.MeshBasicMaterial({color:'#5cd9c1',transparent:true,opacity:.16,depthTest:true,depthWrite:false,fog:false,toneMapped:false}),
  );
  ghostShadow.name = 'painted-puppy-ghost-shadow';
  ghostShadow.position.set(0, .08, .12);
  ghostShadow.scale.setScalar(.62);
  ghostShadow.castShadow = false;
  ghostShadow.receiveShadow = false;
  ghostShadow.rotation.x = -Math.PI / 2;
  ghostGroup.add(ghostShadow);
  // A few small, ground-locked paw-light markers make the replay's direction
  // legible even when its pale painting crosses a bright road. They stay
  // behind the ghost, pulse as one quiet wake, and disappear with the replay
  // so they never compete with live bones or lane targets.
  const ghostWake = new THREE.Group();
  ghostWake.name = 'personal-ghost-wake';
  for (let index = 0; index < 3; index++) {
    const wake = new THREE.Mesh(
      new THREE.CircleGeometry(.13 - index * .018, 14),
      new THREE.MeshBasicMaterial({
        color: '#8ff2e7',
        transparent: true,
        opacity: .16,
        depthTest: true,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    );
    wake.name = `personal-ghost-wake-${index + 1}`;
    wake.position.set(0, .045, .72 + index * .62);
    wake.rotation.x = -Math.PI / 2;
    wake.userData.index = index;
    ghostWake.add(wake);
  }
  ghostWake.visible = false;
  ghostGroup.add(ghostWake);
  scene.add(ghostGroup);
  // The chase guide reuses the currently selected puppy's loaded painting.
  // Sharing that texture keeps the companion as cute and illustrated as the
  // player dog without doubling the mobile artwork catalog or introducing a
  // second polygonal puppy.
  const chaseArtwork = new THREE.Sprite(new THREE.SpriteMaterial({
    transparent: true,
    opacity: .88,
    depthTest: true,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  }));
  chaseArtwork.name = 'painted-puppy-chase-guide';
  chaseArtwork.visible = false;
  chaseArtwork.frustumCulled = false;
  chaseArtwork.renderOrder = 1.2;
  scene.add(chaseArtwork);
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
  // Give the menu's featured puppy a quiet pool of light so his painted fur
  // stays readable against the moving landscape. This lives in the WebGL
  // scene (rather than as a CSS overlay), which keeps the glow locked to the
  // same camera parallax as Mochi and disappears entirely once a run starts.
  const menuGlowCanvas = document.createElement("canvas");
  menuGlowCanvas.width = menuGlowCanvas.height = 128;
  const menuGlowContext = menuGlowCanvas.getContext("2d");
  const menuGlowGradient = menuGlowContext.createRadialGradient(64, 58, 8, 64, 64, 64);
  // Use a neutral mint-white lift rather than a yellow spotlight. The puppy
  // paintings already contain their cream highlights; warming the shared
  // backdrop made those authored colors read beige in the menu and in the
  // subtle runner focus wash that reuses this texture.
  menuGlowGradient.addColorStop(0, "rgba(239,250,248,.68)");
  menuGlowGradient.addColorStop(.42, "rgba(211,239,232,.28)");
  menuGlowGradient.addColorStop(1, "rgba(211,239,232,0)");
  menuGlowContext.fillStyle = menuGlowGradient;
  menuGlowContext.fillRect(0, 0, 128, 128);
  const menuGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(menuGlowCanvas),
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    opacity: .9,
  }));
  menuGlow.name = "menu-puppy-spotlight";
  menuGlow.position.set(0, 1.08, -.08);
  menuGlow.scale.set(3.9, 3.25, 1);
  menuGlow.renderOrder = 1.9;
  scene.add(menuGlow);
  // A soft dark falloff gives Mochi a clear figure/ground break when the camp
  // road carries the same cream and sage values as his coat. Keep this behind
  // the painted puppy and separate from the neutral spotlight so it reads as
  // a natural pool of shade, not a sticker or a new HUD panel.
  const menuContrastCanvas = document.createElement("canvas");
  menuContrastCanvas.width = menuContrastCanvas.height = 128;
  const menuContrastContext = menuContrastCanvas.getContext("2d");
  const menuContrastGradient = menuContrastContext.createRadialGradient(64, 64, 10, 64, 64, 64);
  menuContrastGradient.addColorStop(0, "rgba(12,43,48,.46)");
  menuContrastGradient.addColorStop(.52, "rgba(12,43,48,.28)");
  menuContrastGradient.addColorStop(1, "rgba(12,43,48,0)");
  menuContrastContext.fillStyle = menuContrastGradient;
  menuContrastContext.fillRect(0, 0, 128, 128);
  const menuContrast = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(menuContrastCanvas),
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    opacity: .9,
  }));
  menuContrast.name = "menu-puppy-contrast";
  menuContrast.position.set(0, 1.08, .01);
  menuContrast.scale.set(3.05, 3.15, 1);
  menuContrast.renderOrder = 1.88;
  scene.add(menuContrast);
  // Keep the running puppy legible when the trail and the coat share a pale
  // value. This is a soft, scene-locked contrast pool behind the dog rather
  // than a CSS badge or an outline: it follows jumps and rides, stays below
  // the painted silhouette, and reuses the menu contrast texture so it adds
  // no texture upload or warm cast to Mochi's coat.
  const puppyFocus = new THREE.Sprite(new THREE.SpriteMaterial({
    map: menuContrast.material.map,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    opacity: 0,
  }));
  puppyFocus.name = "runner-puppy-focus";
  puppyFocus.renderOrder = 1.92;
  puppyFocus.scale.set(2.35, 2.55, 1);
  scene.add(puppyFocus);
  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 20, 12),
    createShieldMaterial(),
  );
  aura.position.y = 0.9;
  dog.add(aura);
  const magnetField = new THREE.Group();
  scene.add(magnetField);
  // The lane strip is meant to survive a quick glance on a bright phone
  // screen. A hair more ring weight gives the current/target lane a crisp edge
  // without turning the three markers into another obstacle row.
  const ringGeometry = new THREE.TorusGeometry(0.94, 0.042, 6, 48);
  // A quiet, scene-locked lane strip gives touch players a destination to
  // aim at without adding another center-screen message. The three pads stay
  // just ahead of the puppy; a warm arrow appears only when a real upcoming
  // hazard or reward recommends a different lane.
  const laneTargetGroup = new THREE.Group();
  laneTargetGroup.name = 'runner-lane-targets';
  laneTargetGroup.renderOrder = .62;
  laneTargetGroup.frustumCulled = false;
  scene.add(laneTargetGroup);
  const lanePadMaterials = {
    idle: new THREE.MeshBasicMaterial({
      color: '#27545a', transparent: true, opacity: .16,
      depthWrite: false, depthTest: true, fog: false, toneMapped: false,
    }),
    current: new THREE.MeshBasicMaterial({
      color: '#9ff4d9', transparent: true, opacity: .40,
      depthWrite: false, depthTest: true, fog: false, toneMapped: false,
    }),
    target: new THREE.MeshBasicMaterial({
      color: '#ffd27a', transparent: true, opacity: .64,
      depthWrite: false, depthTest: true, fog: false, toneMapped: false,
    }),
  };
  const laneRingMaterials = {
    idle: new THREE.MeshBasicMaterial({
      color: '#4b7a7b', transparent: true, opacity: .24,
      depthWrite: false, depthTest: true, fog: false, toneMapped: false,
    }),
    current: new THREE.MeshBasicMaterial({
      color: '#baffea', transparent: true, opacity: .84,
      depthWrite: false, depthTest: true, fog: false, toneMapped: false,
    }),
    target: new THREE.MeshBasicMaterial({
      color: '#ffe5a4', transparent: true, opacity: .95,
      depthWrite: false, depthTest: true, fog: false, toneMapped: false,
    }),
  };
  const laneArrowMaterial = new THREE.MeshBasicMaterial({
    color: '#ffe5a4', transparent: true, opacity: .95,
    depthWrite: false, depthTest: true, fog: false, toneMapped: false,
  });
  const laneArrowGeometry = new THREE.ConeGeometry(.18, .34, 3);
  const laneMarkers = [0, 1, 2].map(lane => {
    const pad = new THREE.Mesh(boxGeometry, lanePadMaterials.idle);
    pad.name = `lane-target-pad-${lane}`;
    pad.position.set(LANES[lane], 0, 0);
    pad.scale.set(.86, .035, .58);
    pad.renderOrder = .62;
    laneTargetGroup.add(pad);
    const ring = new THREE.Mesh(ringGeometry, laneRingMaterials.idle);
    ring.name = `lane-target-ring-${lane}`;
    ring.rotation.x = -Math.PI / 2;
    ring.scale.set(.68, .68, .40);
    ring.position.set(LANES[lane], .024, 0);
    ring.renderOrder = .63;
    laneTargetGroup.add(ring);
    const arrow = new THREE.Mesh(laneArrowGeometry, laneArrowMaterial);
    arrow.name = `lane-target-arrow-${lane}`;
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.set(LANES[lane], .06, -.14);
    arrow.scale.set(.7, .32, .7);
    arrow.visible = false;
    arrow.renderOrder = .64;
    laneTargetGroup.add(arrow);
    return {lane, pad, ring, arrow};
  });
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
  // A single nearest-item badge gives special rewards a plain-language
  // identity in the world. It is intentionally one shared billboard (rather
  // than a label per pickup) so the trail stays calm and the mobile renderer
  // pays no extra geometry cost as object density rises.
  const pickupBadgeCanvas = document.createElement('canvas');
  pickupBadgeCanvas.width = 1024;
  pickupBadgeCanvas.height = 192;
  const pickupBadgeContext = pickupBadgeCanvas.getContext('2d');
  const pickupBadgeTexture = new THREE.CanvasTexture(pickupBadgeCanvas);
  pickupBadgeTexture.colorSpace = THREE.SRGBColorSpace;
  pickupBadgeTexture.magFilter = THREE.LinearFilter;
  pickupBadgeTexture.minFilter = THREE.LinearFilter;
  pickupBadgeTexture.generateMipmaps = false;
  const pickupBadgeMaterial = new THREE.SpriteMaterial({
    map: pickupBadgeTexture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    opacity: 0,
  });
  const pickupBadgeSprite = new THREE.Sprite(pickupBadgeMaterial);
  pickupBadgeSprite.name = 'nearest-pickup-badge';
  pickupBadgeSprite.frustumCulled = false;
  pickupBadgeSprite.renderOrder = 1.82;
  pickupBadgeSprite.visible = false;
  scene.add(pickupBadgeSprite);
  let pickupBadgeKey = '';
  function roundedBadgeRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }
  function fitBadgeText(context, value, x, y, maxWidth, size, color, weight = 700) {
    const text = String(value || '');
    let fontSize = size;
    context.font = `${weight} ${fontSize}px Arial, sans-serif`;
    while (fontSize > 20 && context.measureText(text).width > maxWidth) {
      fontSize -= 1;
      context.font = `${weight} ${fontSize}px Arial, sans-serif`;
    }
    context.fillStyle = color;
    context.fillText(text, x, y);
  }
  function paintPickupBadge(definition, action) {
    if (!pickupBadgeContext || !definition) return;
    const context = pickupBadgeContext;
    context.clearRect(0, 0, pickupBadgeCanvas.width, pickupBadgeCanvas.height);
    const edge = definition.color || '#a2ffde';
    roundedBadgeRect(context, 12, 12, 1000, 168, 54);
    context.fillStyle = '#082633f2';
    context.fill();
    context.lineWidth = 8;
    context.strokeStyle = edge;
    context.stroke();
    // A small pointer keeps the label visually attached to its pickup. This
    // matters on a winding trail where the billboard can otherwise read like
    // another floating HUD panel rather than an actionable object marker.
    context.beginPath();
    context.moveTo(476, 164);
    context.lineTo(548, 164);
    context.lineTo(512, 192);
    context.closePath();
    context.fillStyle = '#082633f2';
    context.fill();
    context.lineWidth = 6;
    context.strokeStyle = `${edge}cc`;
    context.stroke();
    context.beginPath();
    context.arc(106, 96, 55, 0, Math.PI * 2);
    context.fillStyle = '#153f4be8';
    context.fill();
    context.lineWidth = 4;
    context.strokeStyle = `${edge}cc`;
    context.stroke();
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = 'bold 62px Arial, sans-serif';
    context.fillStyle = edge;
    context.fillText(definition.icon || '✦', 106, 98);
    context.textAlign = 'left';
    fitBadgeText(
      context,
      String(definition.label || '').toUpperCase(),
      190,
      67,
      790,
      47,
      '#fff3ca',
      850,
    );
    // Give the effect its own line so the item teaches itself before the
    // player has to parse the lane instruction. The second line is a compact
    // action recipe; it follows the pickup in world space, so the lane arrow
    // remains attached to the reward instead of competing with the HUD.
    fitBadgeText(
      context,
      String(definition.effect || '').toUpperCase(),
      190,
      111,
      790,
      29,
      '#c5e5df',
      700,
    );
    const lane = String(definition.lane || 'your lane').toUpperCase();
    const meters = Number.isFinite(definition.meters) ? ` · ${definition.meters}M` : '';
    fitBadgeText(
      context,
      `${String(action || 'COLLECT').toUpperCase()} · ${lane}${meters}`,
      190,
      143,
      790,
      25,
      '#fff3ca',
      800,
    );
    pickupBadgeTexture.needsUpdate = true;
  }
  const templates = {};
  const boneGeometry=createBoneGeometry();
  templates.bone = new THREE.Mesh(boneGeometry,
    new THREE.MeshStandardMaterial({
      vertexColors:true,
      roughness:.28,
      metalness:.05,
      emissive:'#fff0b8',
      emissiveIntensity:.22,
    }));
  // Bones are the game's primary collectible. A slightly larger authored
  // scale keeps the ivory face and dark rim readable through the perspective
  // falloff on a phone without changing the shared geometry contract.
  templates.bone.scale.setScalar(1.88);
  const boneTransform=templates.bone.clone();
  // A quiet warm silhouette keeps the ivory collectible legible against the
  // cream trail. It is a second shared instanced pass rather than an outline
  // baked into the painting, so every bone keeps the same readable edge while
  // the mobile renderer still uploads one matrix per pickup.
  const boneOutlineMaterial = new THREE.MeshBasicMaterial({
    color: '#654832',
    transparent: true,
    opacity: .34,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const boneOutlineBatch=createInstanceBatch(scene,boneGeometry,boneOutlineMaterial);
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
  // The moving gate reuses the proven low-profile gate silhouette, then adds
  // one amber sweep beacon so its horizontal motion reads as intentional
  // gameplay rather than a mesh that appears to slide by accident.
  templates['moving-gate'] = templates.gate.clone(true);
  const movingGateBeacon = box(templates['moving-gate'], '#ffd27a', 0, 2.78, .28, .28, .12, .06);
  movingGateBeacon.userData.movingGateBeacon = true;
  movingGateBeacon.material = movingGateBeacon.material.clone();
  movingGateBeacon.material.emissive?.set?.('#c9773f');
  movingGateBeacon.material.emissiveIntensity = .45;
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
        color: PICKUP_GLOW_COLORS[type] || "#fff1bb",
        transparent: true,
        opacity: type === 'zoomies' ? 0.66 : 0.58,
        depthWrite: false,
      }),
    );
    templates[type].add(halo);
    // Special rewards are intentionally larger than bones: their silhouettes
    // should be readable before the guide card appears, especially on a
    // portrait phone where perspective compresses the lane width.
    templates[type].scale.multiplyScalar(1.52);
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
  const bridgeCollapseMarker = box(templates.gap, '#ef6f59', 0, .46, 0, 1.2, .07, .12);
  bridgeCollapseMarker.userData.bridgeCollapseMarker = true;
  bridgeCollapseMarker.visible = false;
  // Frostpeak hazards use unmistakable, low-profile silhouettes: a rounded
  // snow mogul to hop, a cool blue ice patch to carve around, and a pair of
  // small colored flags that leave one lane visibly open.
  templates.mogul = new THREE.Group();
  const mogul = ball(templates.mogul, '#f4fbff', 0, .22, 0, 1.18, .34, .72);
  mogul.castShadow = true;
  ball(templates.mogul, '#b8e5f4', -.34, .18, -.28, .36, .09, .24);
  ball(templates.mogul, '#d8f2fb', .38, .20, .18, .28, .08, .22);
  templates.ice = new THREE.Group();
  const icePatch = box(templates.ice, '#75cfe5', 0, .035, 0, 1.38, .07, 1.95);
  icePatch.material = icePatch.material.clone();
  icePatch.material.roughness = .26;
  icePatch.material.metalness = .18;
  icePatch.material.transparent = true;
  icePatch.material.opacity = .86;
  box(templates.ice, '#d7fbff', -.34, .10, -.34, .18, .035, .82).rotation.y = -.24;
  box(templates.ice, '#b7eff7', .37, .11, .28, .16, .035, .7).rotation.y = .22;
  templates['ski-gate'] = new THREE.Group();
  for (const side of [-1, 1]) {
    const pole = box(templates['ski-gate'], '#3f7893', side * .62, .86, 0, .08, 1.72, .08);
    pole.castShadow = true;
    box(templates['ski-gate'], side < 0 ? '#ef7d86' : '#ffd66f', side * .62, 1.72, 0, .38, .42, .08);
  }
  box(templates['ski-gate'], '#f4fbff', 0, 1.02, 0, 1.28, .07, .08);
  templates['ski-start'] = new THREE.Group();
  box(templates['ski-start'], '#3d6c88', -.72, 1.25, 0, .08, 2.5, .08);
  box(templates['ski-start'], '#3d6c88', .72, 1.25, 0, .08, 2.5, .08);
  box(templates['ski-start'], '#d9f6ff', 0, 2.4, 0, 1.55, .12, .08);
  box(templates['ski-start'], '#72cde3', 0, 2.18, .02, .22, .28, .06);
  templates['ski-end'] = templates['ski-start'].clone(true);
  templates['ski-end'].traverse(item => {
    if (item.isMesh && item.material?.color) item.material = item.material.clone();
  });
  templates['ski-end'].children.forEach(item => {
    if (item.material?.color?.getHexString?.() === 'd9f6ff') item.material.color.set('#ffd78e');
  });
  // Frostpeak characters are rounded, high-contrast silhouettes rather than
  // tiny hazard blocks. Each one has a few tagged parts so the render loop can
  // give it a soft, readable motion beat without allocating per-frame meshes.
  templates.yeti = new THREE.Group();
  const yetiBody = ball(templates.yeti, '#dbeaf0', 0, .82, .08, .62, .68, .52);
  yetiBody.castShadow = true;
  ball(templates.yeti, '#f6fbfc', 0, .72, -.38, .42, .47, .18).name = 'yeti-belly';
  const yetiHead = ball(templates.yeti, '#e9f4f6', 0, 1.55, -.16, .56, .5, .46);
  yetiHead.castShadow = true;
  for (const side of [-1, 1]) {
    ball(templates.yeti, '#c4dce6', side * .48, 1.58, -.08, .24, .34, .2).name = 'yeti-ear';
    ball(templates.yeti, '#173b4b', side * .19, 1.66, -.57, .095, .11, .055).name = 'yeti-eye';
  }
  ball(templates.yeti, '#243b49', 0, 1.43, -.61, .14, .1, .09).name = 'yeti-nose';
  const yetiScarf = box(templates.yeti, '#4e9db0', 0, 1.17, -.2, .72, .12, .5);
  yetiScarf.name = 'yeti-scarf';
  const yetiTail = ball(templates.yeti, '#c4dce6', 0, .84, .55, .24, .27, .25);
  yetiTail.name = 'yeti-tail';
  for (const side of [-1, 1]) {
    const arm = box(templates.yeti, '#c4dce6', side * .68, .92, -.08, .18, .22, .56);
    arm.rotation.z = side * .34;
    arm.name = 'yeti-arm';
    ball(templates.yeti, '#b3d3df', side * .38, .2, -.06, .28, .2, .34).name = 'yeti-foot';
  }
  templates.snowball = new THREE.Group();
  const snowball = ball(templates.snowball, '#f7fcff', 0, .55, 0, .58, .58, .58);
  snowball.castShadow = true;
  ball(templates.snowball, '#b7e0ee', -.2, .46, -.39, .18, .12, .08).name = 'snowball-shadow';
  ball(templates.snowball, '#ccecf5', .3, .66, -.38, .14, .1, .07).name = 'snowball-highlight';
  const snowballTrail = [];
  for (let index = 0; index < 3; index++) {
    const puff = ball(templates.snowball, '#e5f6fb', (index - 1) * .34, .17 + index * .06, .64 + index * .18,
      .12 - index * .02, .1 - index * .015, .14 - index * .025);
    puff.name = 'snowball-puff';
    puff.material = puff.material.clone();
    puff.material.transparent = true;
    puff.material.opacity = .62 - index * .14;
    puff.material.depthWrite = false;
    snowballTrail.push(puff);
  }
  templates.snowman = new THREE.Group();
  ball(templates.snowman, '#f7fcff', 0, .38, 0, .42, .38, .38).name = 'snowman-base';
  ball(templates.snowman, '#f7fcff', 0, .92, -.02, .55, .5, .48).name = 'snowman-middle';
  ball(templates.snowman, '#f7fcff', 0, 1.51, -.04, .42, .4, .38).name = 'snowman-head';
  for (const side of [-1, 1]) {
    ball(templates.snowman, '#293b48', side * .16, 1.59, -.39, .065, .075, .04).name = 'snowman-eye';
    ball(templates.snowman, '#304451', side * .14, .96, -.48, .07, .075, .04).name = 'snowman-button';
  }
  const carrot = cone(templates.snowman, '#e58d4c', 0, 1.45, -.48, .11, .34, .11);
  carrot.rotation.x = -Math.PI / 2;
  carrot.name = 'snowman-carrot';
  const snowmanScarf = box(templates.snowman, '#e06f70', 0, 1.2, -.08, .62, .12, .52);
  snowmanScarf.name = 'snowman-scarf';
  box(templates.snowman, '#263d49', 0, 1.91, -.02, .62, .12, .58).name = 'snowman-hat-brim';
  box(templates.snowman, '#314c5a', 0, 2.12, -.02, .42, .34, .4).name = 'snowman-hat';
  // A shelter worker is the first human-scale trail character. The silhouette
  // is intentionally rounded and high-contrast: amber vest, teal trousers,
  // cap, face, waving arm and clipboard all read as one friendly volunteer at
  // phone distance. Tagged parts let the render loop animate a small wave and
  // head turn without rebuilding geometry every frame.
  templates['pound-worker'] = new THREE.Group();
  const workerBody = box(templates['pound-worker'], '#1d5360', 0, .78, 0, .62, .92, .44);
  workerBody.name = 'worker-body';
  workerBody.castShadow = true;
  const workerVest = box(templates['pound-worker'], '#ef8a50', 0, .91, .43, .48, .5, .07);
  workerVest.name = 'worker-vest';
  box(templates['pound-worker'], '#ffe08e', 0, .93, .505, .38, .08, .025).name = 'worker-reflective-band';
  for (const side of [-1, 1]) {
    const leg = box(templates['pound-worker'], '#214554', side * .2, .24, 0, .18, .48, .22);
    leg.name = 'worker-leg';
    ball(templates['pound-worker'], '#e08a5d', side * .2, .055, .08, .22, .12, .3).name = 'worker-shoe';
  }
  const workerHead = ball(templates['pound-worker'], '#dca273', 0, 1.55, .04, .45, .43, .38);
  workerHead.name = 'worker-head';
  workerHead.castShadow = true;
  // Soft hair and cap keep the face from reading like a generic low-poly orb.
  ball(templates['pound-worker'], '#574956', 0, 1.87, .02, .4, .16, .34).name = 'worker-hair';
  const workerCap = box(templates['pound-worker'], '#e36c4d', 0, 1.94, .02, .5, .18, .38);
  workerCap.name = 'worker-cap';
  box(templates['pound-worker'], '#f7b95d', 0, 1.86, .37, .6, .08, .16).name = 'worker-cap-brim';
  for (const side of [-1, 1]) {
    ball(templates['pound-worker'], '#243340', side * .16, 1.61, .385, .075, .085, .045).name = 'worker-eye';
    ball(templates['pound-worker'], '#f6d1aa', side * .17, 1.43, .37, .09, .07, .05).name = 'worker-cheek';
  }
  ball(templates['pound-worker'], '#4b3440', 0, 1.47, .405, .11, .075, .06).name = 'worker-nose';
  const workerSmile = box(templates['pound-worker'], '#6a3542', 0, 1.34, .39, .16, .035, .035);
  workerSmile.name = 'worker-smile';
  for (const side of [-1, 1]) {
    const arm = box(templates['pound-worker'], '#ef8a50', side * .53, .9, .02, .16, .5, .18);
    arm.rotation.z = side * .24;
    arm.name = 'worker-arm';
    ball(templates['pound-worker'], '#dca273', side * .62, .64, .08, .14, .14, .14).name = 'worker-hand';
  }
  const clipboard = box(templates['pound-worker'], '#efd09a', .55, 1.04, .36, .28, .38, .055);
  clipboard.rotation.z = -.15;
  clipboard.name = 'worker-clipboard';
  box(templates['pound-worker'], '#e36c4d', .55, 1.2, .42, .16, .035, .02).name = 'worker-clipboard-mark';
  ball(templates['pound-worker'], '#ffe08e', -.55, .98, .26, .11, .11, .05).name = 'worker-badge';
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
  // The arrow is a single readable silhouette at speed; the surrounding sign
  // stays deliberately small so it does not become a second HUD panel.
  const cornerArrowShape = new THREE.Shape();
  cornerArrowShape.moveTo(-.42, -.2);
  cornerArrowShape.lineTo(.02, -.2);
  cornerArrowShape.lineTo(.02, -.38);
  cornerArrowShape.lineTo(.44, 0);
  cornerArrowShape.lineTo(.02, .38);
  cornerArrowShape.lineTo(.02, .2);
  cornerArrowShape.lineTo(-.42, .2);
  cornerArrowShape.closePath();
  const cornerArrowGeometry = new THREE.ShapeGeometry(cornerArrowShape);
  for (const direction of ['left', 'right']) {
    const marker = new THREE.Group();
    templates[`corner-${direction}`] = marker;
    const sign = direction === 'right' ? 1 : -1;
    for (const x of [-5.1, 5.1]) {
      box(marker, '#65543c', x, 1.05, 0, .14, 2.1, .16);
      box(marker, '#edc36d', x, 1.95, 0, 1.28, .82, .18);
      box(marker, '#173b3e', x, 1.95, .13, 1.14, .65, .07);
      const arrow = new THREE.Mesh(
        cornerArrowGeometry,
        new THREE.MeshBasicMaterial({
          color: '#fff0b7',
          depthWrite: false,
          toneMapped: false,
          side: THREE.DoubleSide,
        }),
      );
      arrow.name = 'corner-arrow';
      arrow.position.set(x, 1.95, .235);
      arrow.rotation.z = direction === 'left' ? Math.PI : 0;
      arrow.scale.setScalar(.72);
      arrow.userData.cornerArrow = true;
      arrow.userData.shadowDetail = true;
      marker.add(arrow);
      for (const offset of [-.38, .38]) for (const side of [-1, 1]) {
        const stripe = box(marker, '#fff0b7', x + offset * .7 + sign * .06, 1.95 + side * .13, .20, .38, .10, .05);
        stripe.rotation.z = -sign * side * Math.PI / 4;
      }
    }
    marker.scale.setScalar(.86);
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
      // The support sits behind the raised paws during the catch approach.
      // Use a sunlit rope colour so it remains a landmark without becoming a
      // black vertical seam through the puppy's silhouette on high-contrast
      // displays.
      const ziplineSpine = box(station, "#d2aa70", 0, 4.75, 0, .08, 3.5, .08);
      ziplineSpine.material = ziplineSpine.material.clone();
      ziplineSpine.material.color?.set?.('#d2aa70');
      if (ziplineSpine.material.emissive?.set) {
        ziplineSpine.material.emissive.set('#6f5536');
        ziplineSpine.material.emissiveIntensity = .18;
      }
      ziplineSpine.material.transparent = true;
      ziplineSpine.material.depthWrite = false;
      ziplineSpine.userData.ziplineSpine = true;
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
  // The hang paintings leave a deliberate opening between the raised paws.
  // Build the handle as a small piece of readable equipment behind that
  // opening instead of a single dark bar: the warm grip gives the eye a clear
  // handhold, the teal rail separates it from the sky, and the mint end caps
  // line up with every puppy's paws.  Explicit render ordering keeps the
  // hardware visible through transparent fur without ever painting over the
  // dog or the upcoming obstacle.
  const ZIP_HANDLE_ORDER = 2.045;
  const ziplinePart = (part, order = ZIP_HANDLE_ORDER) => {
    part.renderOrder = order;
    part.castShadow = false;
    part.receiveShadow = false;
    part.userData.ziplineHandle = true;
    return part;
  };
  const zipHandle = new THREE.Group();
  zipHandle.name = 'zipline-puppy-handle';
  scene.add(zipHandle);
  ziplinePart(box(zipHandle, "#173f4b", 0, 0, -.055, 1.78, .27, .16));
  ziplinePart(box(zipHandle, "#d5a85d", 0, 0, .015, 1.48, .16, .18));
  ziplinePart(box(zipHandle, "#fff0b7", 0, .035, .11, 1.12, .045, .04), ZIP_HANDLE_ORDER + .001);
  for(const side of [-1,1]) {
    ziplinePart(box(zipHandle, "#e2b866", side*.53, 0, .035, .18, .28, .20));
    ziplinePart(ball(zipHandle, "#a2ffde", side*.74, 0, .055, .19, .19, .17));
    ziplinePart(ball(zipHandle, "#f4ffe3", side*.74, .045, .14, .075, .075, .055), ZIP_HANDLE_ORDER + .001);
  }
  // A sand-colored rope keeps the space between the raised arms from reading
  // as a black cutout while still contrasting against the bright sky and
  // matching the gantry's warm wood.
  const zipTether = ziplinePart(box(scene, "#d1ad70", 0, 0, -.08, .065, 1, .065), ZIP_HANDLE_ORDER - .001);
  // Keep the narrow connector bright even when the gantry is in shadow. A
  // basic material prevents the rope from becoming a near-black line in the
  // opening between the paws on high-contrast displays.
  zipTether.material = new THREE.MeshBasicMaterial({
    // Use an unlit rope so it cannot inherit the gantry's deep shadow and
    // become the black stroke players were seeing through the raised paws.
    color: '#ffe0a1',
    depthTest: true,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
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
    cameraRoll = 0,
    animationTime = 0;
  const bendMatrix = new THREE.Matrix4(),
    instanceMatrix = new THREE.Matrix4();
  const boneOutlineMatrix = new THREE.Matrix4();
  const boneOutlineScale = new THREE.Vector3(1.18, 1.18, 1.18);
  const bendScale = new THREE.Vector3();
  const bendEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const routeRotation = new THREE.Quaternion();
  const routePosition = new THREE.Vector3();
  const landmarkMotionMatrix = new THREE.Matrix4();
  const landmarkMotionScale = new THREE.Vector3();
  const landmarkVariationMatrix = new THREE.Matrix4();
  const landmarkVariationEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  const landmarkVariationScale = new THREE.Vector3();
  const bridgeCollapseMatrix = new THREE.Matrix4();
  const bridgeCollapseEuler = new THREE.Euler(0, 0, 0, 'YXZ');
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
        // Pull the guide camera in so the rock/log/arch silhouette fills its
        // thumbnail instead of becoming two tiny marks on a dark rectangle.
        // The same compact canvas keeps the help overlay inexpensive on
        // mobile while giving each essential move a useful visual cue.
        camera.fov=48;camera.aspect=192/112;camera.position.set(0,2.25,3.8);camera.lookAt(0,1.05,0);camera.rotation.z=0;
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
        // Outfit cards are rendered from the same full-body painting as the
        // runner. A slightly tighter portrait lens gives the visible coat
        // enough scale to match the puppy cards; the older wide lens left a
        // large quiet margin around every outfit and made the art feel
        // unrelated even though it was the same illustration.
        camera.fov=48;camera.aspect = 1; camera.position.set(0,2.0,3.1); camera.lookAt(0,1.14,0); camera.rotation.z=0;
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
      const hero = state === "menu";
      const mobileHero = hero && camera.aspect < .85;
      // Very short portrait phones compress the menu into a narrow, scrollable
      // column. Keep Mochi in a separate hero pocket on those screens so the
      // oversized headline never paints over his face and ears. The wider
      // portrait composition keeps the gentler offset used on normal phones.
      const compactHero = mobileHero && canvas.clientHeight <= 600;
      const shortHero = mobileHero && !compactHero && canvas.clientHeight <= 700;
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
        cameraRoll = 0;
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
      const skiSection = !menu && run.skiPrototype
        ? skiIntersecting(distance - 70, distance + 260)
        : null;
      const skiBlend = skiSection ? skiVisualBlend(distance, skiSection) : 0;
      const weight = bodyMotion({vx:run.vx,vy:run.vy,y,time:run.time,landing:run.landing,
        ziplining:Boolean(run.zipline),reducedMotion:reducedMotion||menu});
      const atmosphere = areaBlend(menu ? 0 : distance);
      const mood = worldMoodAt(menu ? 0 : distance);
      const previousMood = moodPalettes[mood.previous];
      const currentMood = moodPalettes[mood.index];
      moodSkyColor.copy(previousMood.sky).lerp(currentMood.sky,mood.blend);
      moodGroundColor.copy(previousMood.ground).lerp(currentMood.ground,mood.blend);
      moodSunColor.copy(previousMood.sun).lerp(currentMood.sun,mood.blend);
      const moodStrength=THREE.MathUtils.lerp(previousMood.strength,currentMood.strength,mood.blend);
      const atmosphereEnabled = !reducedMotion &&
        !skiSection &&
        (menu || state === 'playing' || state === 'paused');
      atmosphereParticles.visible = atmosphereEnabled;
      atmosphereParticles.count = atmosphereEnabled ? ATMOSPHERE_PARTICLE_COUNT : 0;
      if (atmosphereEnabled) {
        const profile = AREAS[atmosphere.index].atmosphere;
        const previousProfile = AREAS[atmosphere.previous].atmosphere;
        atmosphereMaterial.opacity = THREE.MathUtils.lerp(
          previousProfile.opacity,
          profile.opacity,
          atmosphere.blend,
        );
        atmospherePrimary.copy(atmospherePalettes[atmosphere.previous].color)
          .lerp(atmospherePalettes[atmosphere.index].color, atmosphere.blend);
        atmosphereAccent.copy(atmospherePalettes[atmosphere.previous].accent)
          .lerp(atmospherePalettes[atmosphere.index].accent, atmosphere.blend);
        for (let index = 0; index < ATMOSPHERE_PARTICLE_COUNT; index++) {
          sampleAtmosphereParticle(index, distance, time, profile, false, atmospherePoint);
          const frame = frameAt(atmospherePoint.z);
          const across = atmospherePoint.x;
          atmospherePosition.set(
            frame.x + across * Math.cos(frame.yaw),
            frame.y + atmospherePoint.y,
            frame.z - across * Math.sin(frame.yaw),
          );
          atmosphereEuler.set(
            frame.pitch * .18,
            frame.yaw + atmospherePoint.rotation,
            atmospherePoint.rotation * .55,
          );
          atmosphereQuaternion.setFromEuler(atmosphereEuler);
          const flattened = profile.motif === 'leaves'
            ? .42
            : profile.motif === 'dust' ? .78
              : profile.motif === 'crystals' ? .7
                : 1;
          atmosphereScale.set(
            atmospherePoint.scale,
            atmospherePoint.scale * flattened,
            atmospherePoint.scale * (profile.motif === 'leaves' ? 1.35 : .92),
          );
          atmosphereMatrix.compose(
            atmospherePosition,
            atmosphereQuaternion,
            atmosphereScale,
          );
          atmosphereParticles.setMatrixAt(index, atmosphereMatrix);
          atmosphereParticleColor.copy(index % 3 === 0 ? atmosphereAccent : atmospherePrimary);
          const twinkle = profile.motif === 'fireflies' || profile.motif === 'sparkles' || profile.motif === 'spores'
            ? .78 + .22 * (.5 + .5 * Math.sin(time * 2.4 + index * 1.7))
            : 1;
          atmosphereParticles.setColorAt(index, atmosphereParticleColor.multiplyScalar(twinkle));
        }
        atmosphereParticles.instanceMatrix.needsUpdate = true;
        if (atmosphereParticles.instanceColor) atmosphereParticles.instanceColor.needsUpdate = true;
      }
      scene.background.copy(areaColors[atmosphere.previous].sky).lerp(areaColors[atmosphere.index].sky,atmosphere.blend);
      // A light color grade differentiates repeated six-area passes without
      // washing out the stronger area palettes or the high-contrast road.
      scene.background.lerp(moodSkyColor,moodStrength);
      if (skiBlend > 0) scene.background.lerp(skiSkyColor, skiBlend);
      scene.fog.color.copy(scene.background);
      sky.material.color.copy(scene.background);
      ground.material.color.copy(areaColors[atmosphere.previous].ground).lerp(areaColors[atmosphere.index].ground,atmosphere.blend);
      ground.material.color.lerp(moodGroundColor,moodStrength*.62);
      if (skiBlend > 0) ground.material.color.lerp(skiGroundColor, skiBlend);
      // Destination lighting follows the same eased handoff as the sky and
      // ground. The color contrast is authored per area: warm Sunleaf/Oasis,
      // ember Redrock, cool Crystal and moonlit Mooncap. Interpolating the
      // persistent lights keeps the transition cinematic and avoids a visible
      // brightness pop at the 225m boundary.
      const previousLighting=areaLighting[atmosphere.previous];
      const currentLighting=areaLighting[atmosphere.index];
      hemisphereSkyColor.copy(previousLighting.sky).lerp(currentLighting.sky,atmosphere.blend);
      hemisphereGroundColor.copy(previousLighting.ground).lerp(currentLighting.ground,atmosphere.blend);
      sunlightColor.copy(previousLighting.sun).lerp(currentLighting.sun,atmosphere.blend);
      hemisphereSkyColor.lerp(moodSkyColor,moodStrength*.5);
      hemisphereGroundColor.lerp(moodGroundColor,moodStrength*.34);
      sunlightColor.lerp(moodSunColor,moodStrength*.4);
      hemisphere.color.copy(hemisphereSkyColor);
      hemisphere.groundColor.copy(hemisphereGroundColor);
      hemisphere.intensity=THREE.MathUtils.lerp(previousLighting.hemi,currentLighting.hemi,atmosphere.blend);
      sun.color.copy(sunlightColor);
      sun.intensity=THREE.MathUtils.lerp(previousLighting.sunPower,currentLighting.sunPower,atmosphere.blend);
      sun.intensity += (moodStrength-.1)*.6;
      if (skiBlend > 0) {
        hemisphere.color.lerp(skiSkyColor, skiBlend);
        hemisphere.groundColor.lerp(skiGroundColor, skiBlend);
        hemisphere.intensity = THREE.MathUtils.lerp(hemisphere.intensity, 2.15, skiBlend);
        sun.color.lerp(skiSunColor, skiBlend);
        sun.intensity = THREE.MathUtils.lerp(sun.intensity, 3.9, skiBlend);
      }
      horizonProfile(menu ? 0 : distance, horizon);
      for(const mountain of mountains) {
        blendMountainArea(mountain,atmosphere);
        mountain.material.color.copy(ground.material.color).lerp(scene.background,horizon.haze+mountain.userData.depthHaze);
        if (skiBlend > 0) mountain.material.color.lerp(skiSkyColor, skiBlend * .72);
        const base=mountain.userData.baseScale;
        mountain.scale.set(base.x*horizon.width,base.y*horizon.height,base.z);
      }
      gapObjects.length = 0;
      if (!menu)
        for (const object of run.objects)
          if (object.type === "gap" && object.lane === 1) gapObjects.push(object);
      const gaps = gapObjects;
      // Only generated bridge gaps collapse. This keeps skipped/reserved
      // bridges intact and makes the visual set piece honest on restored or
      // legacy trails.
      const bridgeCollapseCenters = !menu
        ? run.objects
          .filter(object => object.bridgeCollapse && !object.used)
          .map(object => object.at)
        : [];
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
          const destination = areaBlend(menu ? 0 : distance-z);
          if(entry.region!==undefined&&(entry.region!==region||entry.variant!==areaAt(menu?0:distance-z)%2)){
            instanced.setMatrixAt(i,instanceMatrix.makeScale(0,0,0));return;
          }
          // Landmark families belong to one destination and stay visible for
          // the first part of a blend so a new area arrives as a handoff,
          // rather than a single-frame pop at the 225m boundary.
          if (entry.area !== undefined && entry.area !== destination.index &&
              !(entry.area === destination.previous && destination.blend < .78)) {
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
          // Let each destination's foliage breathe independently. This local
          // transform is applied after route bending, so it never changes
          // lane placement, collision timing, or the road silhouette.
          if (entry.motion) {
            const motion = landmarkSway(time, entry.offset, entry.area, reducedMotion);
            landmarkMotionMatrix.makeRotationZ(motion.rotation);
            instanceMatrix.multiply(landmarkMotionMatrix);
            instanceMatrix.elements[13] += motion.lift;
            landmarkMotionScale.set(motion.scale, motion.scale, motion.scale);
            instanceMatrix.scale(landmarkMotionScale);
          }
          // Each recycled destination/region landmark gets a tiny pass-aware
          // variation. Keep road, gateway and cable batches untouched: this is
          // only for scenery, so the lane silhouette and all traversal cues
          // remain exactly where the gameplay systems expect them.
          if (!entry.road && !entry.gateway &&
              (entry.area !== undefined || entry.region !== undefined)) {
            const variation = landmarkVariation(
              distance - z,
              entry.offset,
              entry.area ?? entry.region,
              reducedMotion,
            );
            landmarkVariationEuler.set(0, variation.yaw, 0, 'YXZ');
            landmarkVariationMatrix.makeRotationFromEuler(landmarkVariationEuler);
            instanceMatrix.multiply(landmarkVariationMatrix);
            landmarkVariationScale.setScalar(variation.scale);
            instanceMatrix.scale(landmarkVariationScale);
          }
          if(cableClip) instanceMatrix.scale(bendScale.set(cableClip.thicknessScale,cableClip.thicknessScale,cableClip.scale));
          const bridge = !menu && isBridge(distance-z);
          const cableSection = !menu && ziplineAt(distance-z);
          const raftSection=!menu&&run.raftPrototype&&raftAt(distance-z);
          const corner = upcomingCorner(distance-z-70);
          if (entry.cable ? !cableSection : (entry.road && entry.bridge !== bridge) || (!entry.road && (bridge || cableSection))) instanceMatrix.scale(bendScale.set(0,0,0));
          if(raftSection&&(!entry.road||!entry.terrain))instanceMatrix.scale(bendScale.set(0,0,0));
          // Decorative gateways belong to the trail, not the camp hero shot.
          // The old menu exception let a near gateway sweep diagonally across
          // the title and Mochi on portrait and desktop cameras. Keep these
          // pooled meshes available for future route framing, but hide them
          // while the player is choosing a run so the character remains the
          // visual anchor. Gameplay structures are still governed by their
          // normal visibility and collision rules below.
          if (entry.gateway && menu) instanceMatrix.scale(bendScale.set(0,0,0));
          // Portrait phones compress the chase perspective, so the decorative
          // camp gateways can become a single dark bar across the horizon.
          // Keep their landmark shape and route placement, but give the mobile
          // camera a little more breathing room around the playable lanes.
          if (entry.gateway && camera.aspect < .85)
            instanceMatrix.scale(bendScale.set(.78, .78, .78));
          if (entry.bridge) {
            const collapse = bridgeCollapseState(distance - z, bridgeCollapseCenters);
            if (collapse) {
              const plank = Number.isFinite(entry.bridgePlank) ? entry.bridgePlank : 0;
              const wave = .82 + .18 * Math.sin(plank * .95 + collapse.center * .031);
              const deck = entry.bridgePart === 'deck';
              const rail = entry.bridgePart === 'rail' || entry.bridgePart === 'post';
              const fall = deck
                ? collapse.eased * (.18 + .42 * wave)
                : rail ? collapse.railProgress * .16 : collapse.railProgress * .08;
              bridgeCollapseEuler.set(
                deck ? collapse.eased * (.34 + .12 * wave) + collapse.tremor :
                  rail ? collapse.railProgress * .12 : collapse.railProgress * .06,
                0,
                deck ? (plank % 2 ? -1 : 1) * collapse.eased * .045 : 0,
                'YXZ',
              );
              bridgeCollapseMatrix.makeRotationFromEuler(bridgeCollapseEuler);
              instanceMatrix.multiply(bridgeCollapseMatrix);
              instanceMatrix.elements[13] -= fall;
            }
          }
          if (!menu && entry.road && !entry.terrain && !entry.cable &&
              corner && distance-z >= corner.at && distance-z <= corner.end)
            instanceMatrix.scale(bendScale.set(0,0,0));
          if(entry.road && !entry.cable && gaps.some(gap => Math.abs(distance-z-gap.at)<.1)) instanceMatrix.scale(bendScale.set(0,0,0));
          if(entry.terrain){
            instanced.geometry.attributes.terrainStation.setX(i,terrainStation(distance,z));
            const blend=areaBlend(menu?0:distance-z);
            areaGroundColor.copy(areaColors[blend.previous].ground).lerp(areaColors[blend.index].ground,blend.blend);
            // Carry the current pass mood into the side terrain as well as
            // the valley floor so the world reads as one place instead of a
            // flat overlay. The runner's mood is close enough for the visible
            // tiles and avoids another palette allocation in this hot loop.
            areaGroundColor.lerp(moodGroundColor,moodStrength*.42);
            instanced.setColorAt(i,areaGroundColor);
          }else if(entry.road && !entry.bridge && !entry.cable){
            if(entry.areaMark) instanced.setColorAt(i,sampleTrailMarkColor(menu?0:distance-z,areaGroundColor,entry.markSlot));
            else
            instanced.setColorAt(i,sampleTrailColor(entry.trailColors,menu?0:distance-z,areaGroundColor,entry.edge));
          }else if(entry.area !== undefined) instanced.setColorAt(i, entry.color);
          else if(entry.road || entry.region === undefined) instanced.setColorAt(i,entry.bridge || entry.cable ? entry.color : entry.colors[region]);
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
      skiLandscape.visible = Boolean(skiSection) && !menu;
      if (skiSection && !menu) {
        const skiOrigin = skiSection.start - 34;
        for (const pad of skiPads) {
          const worldAt = skiOrigin + pad.userData.offset;
          const relative = -(worldAt - distance);
          const frame = frameAt(relative);
          pad.position.set(frame.x, frame.y + .02, frame.z);
          pad.rotation.set(frame.pitch, frame.yaw, 0, 'YXZ');
          pad.material.opacity = .2 + skiBlend * .72;
          pad.visible = relative < 18 && relative > -255;
        }
        for (const marker of skiLandmarks) {
          const worldAt = skiOrigin + marker.userData.offset;
          const relative = -(worldAt - distance);
          const frame = frameAt(relative);
          const across = marker.userData.side * (6.6 + (marker.userData.offset % 3) * .7);
          marker.position.set(
            frame.x + across * Math.cos(frame.yaw),
            frame.y + .02,
            frame.z - across * Math.sin(frame.yaw),
          );
          marker.rotation.set(frame.pitch, frame.yaw, 0, 'YXZ');
          marker.scale.setScalar(marker.userData.baseScale);
          marker.visible = relative < 20 && relative > -175;
        }
      } else {
        skiPads.forEach(pad => { pad.visible = false; });
        skiLandmarks.forEach(marker => { marker.visible = false; });
      }
      // Portrait camp needs a slightly different stage mark than desktop:
      // the headline occupies the left two thirds, while a centered origin
      // leaves the puppy low and half-hidden behind the route. Give Mochi a
      // small hero-only lift and rightward drift so his full silhouette reads
      // as the character being chosen, not a piece of scenery. Keep sheets
      // and gameplay on their established origin so their interaction and
      // hit-test framing stay unchanged.
      const heroOffsetX = mobileHero ? (compactHero ? .58 : .46) : 0;
      const heroOffsetY = mobileHero ? (compactHero ? .44 : shortHero ? 3.25 : 2.35) : 0;
      // Nudge the featured puppy toward the open trail shoulder on portrait
      // screens. The title owns the left side; lifting Mochi a little keeps
      // his face out of the bottom control shelf and gives the contrast pool
      // a clean, scene-locked backdrop instead of tree foliage.
      const heroVisualX = heroOffsetX + (mobileHero ? (compactHero ? .22 : shortHero ? .55 : .24) : 0);
      const heroVisualY = heroOffsetY + (mobileHero ? (compactHero ? .08 : 0) : 0);
      dog.position.set(
        hero ? heroVisualX : menu ? 0 : x,
        (hero ? heroVisualY : menu ? 0 : y) +
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
      const personality = puppyPose(time,distance,{menu,reducedMotion,airborne:y>.1&&!run.minecart,sliding:run.slide>0,ziplining:!menu && Boolean(run.zipline),rafting:!menu&&Boolean(run.raft),skiing:!menu&&Boolean(run.ski)});
      const menuHeroScale = hero && mobileHero && !compactHero ? .65 : 1;
      const crouch=activeRig===mochi?mochiCrouch((1-pose)/.54):null;
      dog.scale.y = ((crouch?.scaleY ?? pose) + personality.breathe) * (1-weight.compression);
      dog.scale.x = dog.scale.z = 1+weight.compression*.4;
      if(crouch) {
        dog.position.y-=crouch.lowering;
        dog.scale.z*=crouch.scaleZ;
        if(y<=.1&&!run.zipline)personality.legs=personality.legs.map((angle,i)=>THREE.MathUtils.lerp(angle,crouch.legs[i],crouch.amount));
      }
      // The puppy is a featured character, not a gameplay hitbox. A modest
      // presentation boost keeps the painted silhouette legible on portrait
      // phones without changing collision dimensions or run timing. The
      // gameplay lift is deliberately smaller than the menu treatment so the
      // dog never crowds the fixed thumb controls.
      if (hero) dog.scale.multiplyScalar(menuHeroScale * (compactHero ? 1.08 : camera.aspect < .85 ? 1.10 : 1.09));
      // The rear chase frame carries a lot of transparent breathing room so
      // its tail and paw line stay natural. Give the complete puppy a modest
      // presentation lift on phones; this improves action recognition without
      // changing the physics hitbox or crowding the thumb shelf.
      else dog.scale.multiplyScalar(camera.aspect < .85 ? 1.16 : 1.04);
      dog.visible = true;
      const laneStripVisible = !menu && (state === 'playing' || state === 'paused') && !run.ended;
      laneTargetGroup.visible = laneStripVisible;
      if (laneStripVisible) {
        const laneInfo = laneTargetFor(run);
        // Keep the affordance close enough to read as the next footfall, but
        // ahead of Mochi so it never paints over his paws or the contact
        // shadow. The route sampler supplies the same bend and terrain frame
        // used by slabs, pickups and hazards.
        const markerFrame = frameAt(-1.7);
        laneTargetGroup.position.set(markerFrame.x, markerFrame.y + .16, markerFrame.z);
        laneTargetGroup.rotation.set(markerFrame.pitch, markerFrame.yaw, 0, 'YXZ');
        const targetPulse = reducedMotion ? 1 : 1 + Math.sin(time * 4.4) * .06;
        for (const marker of laneMarkers) {
          const isCurrent = marker.lane === laneInfo.current;
          const isTarget = laneInfo.recommended && marker.lane === laneInfo.target;
          marker.pad.material = isTarget ? lanePadMaterials.target
            : isCurrent ? lanePadMaterials.current : lanePadMaterials.idle;
          marker.ring.material = isTarget ? laneRingMaterials.target
            : isCurrent ? laneRingMaterials.current : laneRingMaterials.idle;
          marker.arrow.visible = isTarget;
          if (isTarget) {
            const urgency = .72 + laneInfo.urgency * .28;
            marker.pad.material.opacity = .44 + laneInfo.urgency * .16;
            marker.ring.material.opacity = .76 + laneInfo.urgency * .18;
            marker.arrow.material.opacity = urgency;
            marker.arrow.scale.set(.7 * targetPulse, .32, .7 * targetPulse);
          }
        }
      }
      // Keep the best-run echo just far enough ahead to compare lane and move
      // timing without hiding the live puppy. It follows the same curved road
      // frame as every other object, so corners and detours remain legible.
      const chaseProgress = !menu && !run.practice && run.dogChase
        ? dogChaseProgress(distance, run.dogChase) : null;
      const ghostRecord = !menu && !run.practice ? run.ghostPlayback : null;
      const ghostLookahead = 24;
      const ghostSample = chaseProgress ? null : ghostRecord ? ghostAt(ghostRecord, distance + ghostLookahead) : null;
      if (chaseProgress) {
        // The chase companion reuses the selected puppy's active painting. It
        // is warm, bright and clearly ahead of the player, with the same lane
        // frame as every trail object. Sharing the texture keeps this beat
        // illustrated and avoids the old polygonal guide silhouette.
        const lead = 22 + chaseProgress.eased * 7;
        const chaseFrame = frameAt(-lead);
        const chaseX = chaseFrame.x + chaseProgress.x * Math.cos(chaseFrame.yaw);
        const chaseZ = chaseFrame.z - chaseProgress.x * Math.sin(chaseFrame.yaw);
        ghostGroup.visible = false;
        chaseArtwork.visible = false;
        const source = rasterArtwork.activeSprite?.();
        const map = source?.material?.map;
        if (source && map) {
          chaseArtwork.material.map = map;
          chaseArtwork.material.needsUpdate = true;
          chaseArtwork.material.color.setRGB(1, 1, 1);
          chaseArtwork.material.opacity = reducedMotion ? .82 : .92;
          chaseArtwork.center.copy(source.center);
          chaseArtwork.material.rotation = source.material.rotation + chaseProgress.wag * .10;
          chaseArtwork.position.set(chaseX, chaseFrame.y + .10 + chaseProgress.bob, chaseZ);
          chaseArtwork.scale.set(
            Math.abs(source.scale.x) * (camera.aspect < .85 ? .70 : .64),
            source.scale.y * (camera.aspect < .85 ? .70 : .64),
            1,
          );
          chaseArtwork.visible = true;
        }
      } else if (ghostSample) {
        // The personal replay uses the same painted pose library as the live
        // puppy. A mint rim and low-opacity tint make it unmistakably a ghost
        // without turning it into an unrelated polygon character. The
        // read-only lookup never starts a texture request for the replay.
        chaseArtwork.visible = false;
        const ghostRelativeZ = distance - ghostSample.distance;
        const ghostFrame = frameAt(ghostRelativeZ);
        const ghostX = ghostFrame.x + ghostSample.x * Math.cos(ghostFrame.yaw);
        const ghostZ = ghostFrame.z - ghostSample.x * Math.sin(ghostFrame.yaw);
        ghostGroup.visible = true;
        ghostGroup.position.set(ghostX, ghostFrame.y + ghostSample.y, ghostZ);
        ghostGroup.rotation.set(ghostFrame.pitch, ghostFrame.yaw, 0, 'YXZ');
        const ghostScale = (camera.aspect < .85 ? 1.02 : .92)
          * (ghostSample.posture === 'slide' ? .86 : 1);
        ghostGroup.scale.setScalar(ghostScale);
        const ghostFade = THREE.MathUtils.clamp(1 - Math.abs(ghostRelativeZ) / 90, .28, 1);
        const ghostPulse = reducedMotion ? 1 : .92 + Math.sin(time * 4.2) * .08;
        const source = rasterArtwork.spriteForPose?.(ghostSample.posture)
          || rasterArtwork.activeSprite?.();
        const map = source?.material?.map;
        if (source && map) {
          const sourceScaleX = Math.abs(source.scale.x) || 1;
          const sourceScaleY = Math.abs(source.scale.y) || 1;
          const sourceSign = Math.sign(source.scale.x) || 1;
          const poseScale = ghostSample.posture === 'hang' ? .84
            : ghostSample.posture === 'raft' ? .88 : .78;
          const ghostOpacity = (reducedMotion ? .42 : .50) * ghostFade * ghostPulse;
          const rimOpacity = (reducedMotion ? .16 : .24) * ghostFade * ghostPulse;
          ghostArtwork.material.map = map;
          ghostArtwork.material.needsUpdate = true;
          ghostArtwork.center.copy(source.center);
          ghostArtwork.material.rotation = source.material.rotation
            + (reducedMotion ? 0 : Math.sin(time * 3.2) * .025);
          ghostArtwork.position.copy(source.position);
          ghostArtwork.scale.set(sourceSign * sourceScaleX * poseScale, sourceScaleY * poseScale, 1);
          ghostArtwork.material.opacity = ghostOpacity;
          ghostArtwork.visible = true;
          ghostRim.material.map = map;
          ghostRim.material.needsUpdate = true;
          ghostRim.center.copy(source.center);
          ghostRim.material.rotation = ghostArtwork.material.rotation;
          ghostRim.position.copy(source.position);
          ghostRim.scale.set(sourceSign * sourceScaleX * poseScale * 1.075, sourceScaleY * poseScale * 1.075, 1);
          ghostRim.material.opacity = rimOpacity;
          ghostRim.visible = true;
          ghostWake.visible = true;
          ghostWake.children.forEach((wake, index) => {
            const wakePulse = reducedMotion ? 1 : .88 + Math.sin(time * 4.2 - index * .65) * .12;
            wake.material.opacity = (reducedMotion ? .10 : .16) * ghostFade * wakePulse * (1 - index * .14);
            wake.scale.setScalar((.94 - index * .10) * wakePulse);
          });
        } else {
          ghostArtwork.visible = false;
          ghostRim.visible = false;
          ghostWake.visible = false;
        }
        ghostShadow.material.opacity = (reducedMotion ? .08 : .12) * ghostFade;
        ghostShadow.scale.setScalar((ghostSample.posture === 'slide' ? .78 : .92) * ghostPulse);
      } else {
        ghostGroup.visible = false;
        ghostArtwork.visible = false;
        ghostRim.visible = false;
        ghostWake.visible = false;
        chaseArtwork.visible = false;
      }
      menuGlow.visible = hero;
      menuContrast.visible = hero;
      if (hero) {
        // Follow the same offset as the puppy. A static spotlight was centered
        // on the old origin, so the enlarged portrait dog could drift out of
        // its contrast pool on narrow phones.
        menuGlow.position.set(heroVisualX, 1.08 + heroVisualY, -.08);
        menuContrast.position.set(heroVisualX, 1.08 + heroVisualY, .01);
      }
      const focusVisible = !menu && (state === "playing" || state === "paused");
      puppyFocus.visible = focusVisible;
      if (focusVisible) {
        const actionScale = run.slide > 0 ? .86
          : run.zipline ? .78
            : run.raft ? .88
              : run.minecart ? .84
                : run.ski ? .9
                : y > .1 ? 1.04 : 1;
        const focusPulse = reducedMotion ? 1 : 1 + Math.sin(time * 3.1) * .035;
        const focusScale = Math.abs(dog.scale.x) * actionScale * focusPulse;
        puppyFocus.position.set(dog.position.x, dog.position.y + (run.slide > 0 ? .72 : .94), .07);
        puppyFocus.scale.set(2.35 * focusScale, 2.55 * focusScale, 1);
        puppyFocus.material.opacity = reducedMotion ? .14 : y > .1 ? .24 : .21;
      } else {
        puppyFocus.material.opacity = 0;
      }
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
      skiModel.visible = !menu && !run.raft && !run.minecart && !run.zipline &&
        Boolean(run.ski || (skiSection && distance < skiSection.start));
      if (skiModel.visible) {
        const skiFrame = run.ski ? groundFrame : frameAt(-(skiSection.start - distance));
        const skiAcross = run.ski ? x : 0;
        skiModel.position.set(
          skiFrame.x + skiAcross * Math.cos(skiFrame.yaw),
          skiFrame.y + (run.ski ? y * .08 : 0),
          skiFrame.z - skiAcross * Math.sin(skiFrame.yaw),
        );
        skiModel.rotation.set(
          skiFrame.pitch,
          skiFrame.yaw + (reducedMotion ? 0 : lean * .24),
          reducedMotion ? 0 : lean * .12,
          'YXZ',
        );
        const skiAnimated = state === 'playing' && !reducedMotion && Boolean(run.ski);
        const skis = skiModel.userData.skis || [];
        skis.forEach((ski, index) => {
          ski.rotation.z = skiAnimated ? Math.sin(time * 5.5 + index * Math.PI) * .018 : 0;
        });
        const skiTips = skiModel.userData.skiTips || [];
        skiTips.forEach((tip, index) => {
          const side = tip.userData.side || (index ? 1 : -1);
          tip.rotation.x = tip.userData.baseRotation + (skiAnimated ? Math.sin(time * 5.5 + index * Math.PI) * .06 * side : 0);
        });
        const bindings = skiModel.userData.bindings || [];
        bindings.forEach((binding, index) => {
          binding.position.y = binding.userData.baseY + (skiAnimated ? Math.abs(Math.sin(time * 5.5 + index * Math.PI)) * .018 : 0);
        });
        const poles = skiModel.userData.poles || [];
        poles.forEach((pole, index) => {
          const side = pole.userData.side || (index ? 1 : -1);
          pole.rotation.x = pole.userData.baseRotation + (skiAnimated ? Math.sin(time * 5.5 + index * Math.PI) * .09 * side : 0);
        });
        const spray = skiModel.userData.spray || [];
        spray.forEach((flake, index) => {
          const phase = skiAnimated ? (time * 1.7 + index * .21) % 1 : .32;
          flake.position.z = .92 + index * .18 + phase * .34;
          flake.position.x = (index - 2) * .28 + (skiAnimated ? Math.sin(time * 4 + index) * .05 : 0);
          flake.material.opacity = skiAnimated ? .62 * (1 - phase * .45) : .3;
          flake.visible = Boolean(run.ski);
        });
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
        skiing:!menu && Boolean(run.ski),
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
      // Airborne bones belong to the cable route rather than the ground jump
      // path. Keep a small, local beacon available while the next handle is
      // still ahead so a first-time player can read that relationship at a
      // glance. It uses the existing flash batch, is capped to three bones,
      // and disappears as soon as the cable is caught or the scene enters
      // reduced-motion mode.
      const cableUpcoming = !run.zipline && !run.ended && run.objects.some(object =>
        object.type === 'zipline-start' && !object.caught && object.at > distance &&
        object.at - distance < 108);
      if (!menu && !reducedMotion && !run.ended)
        for (const effect of run.effects) {
          const age = run.time - effect.time;
          if (age < 0 || age >= .45) continue;
          flashColor.set(effectColor(effect.type));
          const impact=effect.type==='hit'||effect.type==='shield-break';
          const landing=effect.type==='land';
          const takeoff=effect.type==='jump';
          const nearMiss=effect.type==='near-miss';
          const pickupEffect = ['magnet','shield','gem','double','heart','gift','zoomies','relic'].includes(effect.type);
          // Collection feedback is a brighter, slightly wider burst than a
          // normal footfall. The color is keyed to the same effect label shown
          // in the pickup card, so a player can connect the animation to the
          // power without reading a center-screen toast.
          const size=(impact?.14:landing?.075:takeoff?.052:nearMiss?.095:pickupEffect?.10:.07)*(1-age/.45);
          const spread=landing?4.5:takeoff?2.2:impact?5:nearMiss?3.6:pickupEffect?3.8:3;
          const lift=landing?1.4:nearMiss?1.6:pickupEffect?2.25:2;
          const sparkLimit = pickupEffect ? 8 : 6;
          for (let i = 0; i < sparkLimit && sparkCount < 192; i++) {
            const angle = (i * Math.PI * 2) / sparkLimit;
            const pickupPhase = pickupEffect ? .72 + .28 * Math.sin(time * 5 + i * .9) : 1;
            flashMatrix.makeScale(
              size * pickupPhase,
              size * pickupPhase,
              size * pickupPhase,
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
      // A few warm, grounded puffs make the painted puppy's footfalls read
      // against the pale paving. Reuse the existing flash batch so a running
      // dog gets motion punctuation without another material, draw call or
      // persistent overlay. Rides, jumps and slides keep their own silhouettes
      // and effects; only a calm ground stride receives this trace.
      if (!menu && !reducedMotion && !run.ended
        && y < .12 && run.slide <= 0 && !run.zipline && !run.raft && !run.minecart && !run.ski) {
        flashColor.set('#b98a5e');
        for (const puff of pawDust(time)) {
          if (sparkCount >= 192) break;
          const puffScale = puff.scale * (0.75 + Math.abs(Math.sin(time * 8.4 + puff.z)) * .25);
          flashMatrix.makeScale(puffScale, puffScale * .42, puffScale * 1.15);
          flashMatrix.setPosition(x + puff.x, puff.y, puff.z);
          flashes.setColorAt(sparkCount, flashColor);
          flashes.setMatrixAt(sparkCount++, flashMatrix);
        }
      }
      visibleIds.clear();
      boneOutlineBatch.begin();
      boneBatch.begin();
      let boneGlintCount = 0;
      let aerialCueCount = 0;
      let pickupGlintCount = 0;
      let hazardCueCount = 0;
      let spectacleBeacon = null;
      const scenePickupBadge = !menu ? pickupBadgeFor(run) : null;
      let scenePickupBadgeItem = null;
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
          for (const child of item.children) {
            if (child.userData.bridgeCollapseMarker)
              child.visible = Boolean(object.bridgeCollapse);
            if (child.userData.ziplineSign)
              child.visible=ziplineSignVisible(object,distance);
            // The gantry's center support sits directly behind the hanging
            // puppy. Once the handle is caught, leave only the actual cable
            // and handle in the silhouette gap; the support otherwise reads
            // as a black pole through the dog's raised arms.
            if (child.userData.ziplineSpine) {
              const spineState = {ziplining:Boolean(run.zipline)};
              child.visible=ziplineSpineVisible(object,distance,spineState);
              child.material.opacity=ziplineSpineOpacity(object,distance,spineState);
            }
          }
          item.position.set(
            object.movingGate
              ? movingGateX(object, distance)
              : object.skiYeti
                ? skiYetiX(object, distance)
                : object.skiSnowball ? skiSnowballX(object, distance) : LANES[object.lane],
            pickup
              ? (object.skiAirborne ? 1.75 : object.airborne ? ZIPLINE_HEIGHT + 1.1 : 1.1) +
                  (reducedMotion ? 0 : Math.sin(time * 3 + object.id) * 0.12) +
                  pickupBob(object.type, time, object.id, reducedMotion)
              : object.raftHazard ? -.55 : object.skiHazard || object.skiObstacle ? .035 : 0,
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
          if (pickup && !bone) {
            // Reuse the clone's authored root scale so the gentle pulse also
            // enlarges its halo and never accumulates scale across pooled
            // objects. This makes powerups feel collectible at a glance
            // while remaining quiet in reduced-motion mode.
            item.userData.pickupBaseScale ??= item.scale.clone();
            item.scale.copy(item.userData.pickupBaseScale).multiplyScalar(
              pickupPulse(object.type, time, object.id, reducedMotion),
            );
          }
          const frame = frameAt(item.position.z), across = item.position.x;
          item.position.set(frame.x + across * Math.cos(frame.yaw), item.position.y + frame.y,
            frame.z - across * Math.sin(frame.yaw));
          item.rotation.x = pickup ? 0 : frame.pitch;
          item.rotation.y += frame.yaw;
          // Character hazards carry their own small animation language. Keep
          // the movement rooted in the transformed trail frame so a turning
          // slope never makes a yeti or snowball slide sideways off the road.
          if (object.skiYeti) {
            const patrol = reducedMotion ? 0 : Math.sin(time * 5.2 + object.id * .31);
            item.position.y += reducedMotion ? 0 : Math.abs(patrol) * .045;
            item.rotation.z = patrol * .045;
            item.rotation.y += reducedMotion ? 0 : patrol * .055;
            item.children.forEach((child, index) => {
              if (child.userData?.type === 'yeti-arm' || child.name === 'yeti-arm') {
                const side = child.position.x < 0 ? -1 : 1;
                child.rotation.z = side * .34 + (reducedMotion ? 0 : patrol * .16 * side);
              }
              if (child.name === 'yeti-tail') child.rotation.x = reducedMotion ? 0 : patrol * .22;
              if (child.name === 'yeti-scarf') child.rotation.z = reducedMotion ? 0 : patrol * .10;
            });
          }
          if (object.skiSnowball) {
            item.rotation.z = reducedMotion ? 0 : animationTime * 7.5 + object.id * .21;
            item.rotation.x = reducedMotion ? frame.pitch : frame.pitch + animationTime * 2.2;
            item.position.y += reducedMotion ? 0 : Math.abs(Math.sin(animationTime * 4 + object.id)) * .025;
            item.children.forEach((child, index) => {
              if (child.name === 'snowball-puff') {
                const puffPulse = reducedMotion ? 1 : .84 + .16 * Math.sin(animationTime * 4.2 + index);
                child.scale.setScalar(puffPulse);
              }
            });
          }
          if (object.type === 'snowman') {
            const sway = reducedMotion ? 0 : Math.sin(animationTime * 2.4 + object.id * .18) * .035;
            item.rotation.z = sway;
            const scarf = item.children.find(child => child.name === 'snowman-scarf');
            if (scarf) scarf.rotation.z = reducedMotion ? 0 : Math.sin(animationTime * 3.8 + object.id) * .08;
          }
          if (object.type === 'pound-worker') {
            // The shelter volunteer gives the otherwise static lane hazard a
            // friendly, readable beat: a small wave, head turn and clipboard
            // bob. Animation stays local to the character and is frozen for
            // reduced-motion users, so it never changes collision timing.
            const wave = reducedMotion ? 0 : Math.sin(animationTime * 4.2 + object.id * .29);
            item.position.y += reducedMotion ? 0 : Math.abs(wave) * .028;
            item.rotation.z = reducedMotion ? 0 : wave * .024;
            item.rotation.y += reducedMotion ? 0 : wave * .045;
            item.children.forEach(child => {
              if (child.name === 'worker-arm' && child.position.x > 0)
                child.rotation.z = .24 + (reducedMotion ? 0 : wave * .18);
              if (child.name === 'worker-clipboard')
                child.rotation.z = -.15 + (reducedMotion ? 0 : wave * .08);
              if (child.name === 'worker-head')
                child.rotation.z = reducedMotion ? 0 : wave * .035;
              if (child.name === 'worker-badge')
                child.scale.setScalar(reducedMotion ? 1 : 1 + Math.abs(wave) * .08);
            });
          }
          // A set-piece should announce itself in the world before the player
          // is close enough to parse its model. Select only authored spectacle
          // objects (never an ordinary row), keep the nearest candidate, and
          // let the existing flash batch carry the cue without another draw
          // call or a persistent overlay.
          if (!run.ended && run.encounter?.phase === 'spectacle' &&
              !object.used && !object.passed && Number.isFinite(object.at)) {
            const spectacleObject = object.bridgeCollapse ||
              (object.type === 'gift' && object.chasePickup) ||
              ['zipline-start', 'raft-start', 'minecart-start', 'moving-gate',
                'choice-left', 'choice-right', 'ski-start', 'ski-end', 'ski-gate',
                'yeti', 'snowball', 'snowman'].includes(object.type);
            const approach = object.at - distance;
            if (spectacleObject && approach >= 0 && approach < 64 &&
                (!spectacleBeacon || approach < spectacleBeacon.approach)) {
              spectacleBeacon = {object, item, approach};
            }
          }
          if (object.movingGate) {
            // A small, eased bank sells the sweep while preserving the road
            // tangent. It is frozen in reduced-motion mode and never feeds
            // back into the collision position.
            item.rotation.z = reducedMotion ? 0 : Math.sin(time * 6 + object.id * .3) * .035;
            const beacon = item.children.find(child => child.userData.movingGateBeacon);
            if (beacon?.material) {
              const pulse = reducedMotion ? .82 : .72 + .28 * (.5 + .5 * Math.sin(time * 7 + object.id));
              beacon.material.emissiveIntensity = .25 + pulse * .5;
            }
          }
          item.rotation.order = 'YXZ';
          if (scenePickupBadge?.object === object) scenePickupBadgeItem = item;
          if (object.type === 'corner-left' || object.type === 'corner-right') {
            // Corner markers are roadside landmarks, not another HUD layer.
            // A small arrow pulse begins on approach and becomes decisive in
            // the one-second input window, then settles as soon as the turn is
            // accepted. Reduced-motion users keep the authored sign still.
            const approach = object.at - distance;
            const cornerReady = !menu && !run.ended &&
              object.turnIndex === run.nextCorner && approach >= 0 &&
              approach <= Math.max(1, Number.isFinite(run.speed) ? run.speed : 1);
            const nearCorner = !menu && approach > 0 && approach < 64;
            const phase = time * 8 + (Number(object.id) || 0) * .43;
            const pulseWave = .5 + .5 * Math.sin(phase);
            const intensity = cornerReady ? .18 : nearCorner ? .06 : 0;
            for (const child of item.children) {
              if (!child.userData.cornerArrow) continue;
              const baseScale = child.userData.cornerArrowBaseScale ??
                (child.userData.cornerArrowBaseScale = child.scale.x);
              child.scale.setScalar(baseScale * (reducedMotion ? 1 : 1 + pulseWave * intensity));
            }
          }
          if (pickup && !bone && !object.used && !object.passed &&
              !reducedMotion && !run.ended && pickupGlintCount < 3 &&
              sparkCount < 192) {
            // A single color-matched sparkle gives the nearest special pickup
            // a readable focal point without outlining every collectible or
            // adding another scene object. The approach cap keeps the cue from
            // turning into a flashing wall on dense rows.
            const approach = object.at - distance;
            if (approach > 4 && approach < 42) {
              const depthFade = 1 - THREE.MathUtils.clamp((approach - 4) / 38, 0, 1);
              const glintPulse = .5 + .5 * Math.sin(time * 3.6 + (Number(object.id) || 0) * .61);
              const glintScale = (.024 + glintPulse * .026) * (.76 + depthFade * .24);
              flashColor.set(PICKUP_GLOW_COLORS[object.type] || '#fff0b7');
              flashMatrix.makeScale(glintScale, glintScale * 1.55, glintScale);
              flashMatrix.setPosition(
                item.position.x,
                item.position.y + .58 + glintPulse * .05,
                item.position.z + .055,
              );
              flashes.setColorAt(sparkCount, flashColor);
              flashes.setMatrixAt(sparkCount++, flashMatrix);
              pickupGlintCount++;
            }
          }
          if(bone) {
            // Give each bone a quiet, phase-shifted shimmer. Bones use one
            // instanced transform, so this is a scale-only beat that costs no
            // extra draw call while making the nearest pickup line easier to
            // read against bright paving. Reduced motion keeps the authored
            // silhouette still and the attraction path remains unchanged.
            const bonePulse = reducedMotion
              ? 1
              : 1 + Math.sin(time * 2.6 + (Number(object.id) || 0) * .61) * .055;
            item.scale.copy(templates.bone.scale).multiplyScalar(bonePulse);
            item.updateMatrix();
            boneOutlineMatrix.copy(item.matrix).scale(boneOutlineScale);
            boneOutlineBatch.add(boneOutlineMatrix);
            boneBatch.add(item.matrix);
            // Keep the next few bones discoverable without outlining every
            // pickup or adding a second overlay. A single warm, phase-shifted
            // glint rides just above the authored silhouette and fades with
            // approach distance; the existing flash batch keeps this at zero
            // extra geometry and leaves reduced-motion trails completely still.
            const approach = object.at - distance;
            if (!reducedMotion && !run.ended && approach > 2 && approach < 42 && boneGlintCount < 6 && sparkCount < 192) {
              const depthFade = 1 - THREE.MathUtils.clamp((approach - 2) / 40, 0, 1);
              const glintPulse = .5 + .5 * Math.sin(time * 3.4 + (Number(object.id) || 0) * .73);
              const glintScale = (.026 + glintPulse * .034) * (.72 + depthFade * .28);
              // Optional branch bones carry a warm/mint accent that matches
              // the route choice card, making the reward line distinguishable
              // from ordinary center-lane bones without changing its hitbox.
              flashColor.set('#fff0b7');
              if (object.routeTrail)
                flashColor.set(object.routeKind === 'challenge' ? '#f0b762' : '#a7e59e');
              flashMatrix.makeScale(glintScale, glintScale * 1.7, glintScale);
              flashMatrix.setPosition(item.position.x, item.position.y + .28 + glintPulse * .04, item.position.z + .015);
              flashes.setColorAt(sparkCount, flashColor);
              flashes.setMatrixAt(sparkCount++, flashMatrix);
              boneGlintCount++;
            }
            if (object.airborne && cableUpcoming && !reducedMotion && !run.ended &&
                approach > 3 && approach < 44 && aerialCueCount < 3 && sparkCount < 192) {
              const cueFade = 1 - THREE.MathUtils.clamp((approach - 3) / 41, 0, 1);
              const cuePulse = .5 + .5 * Math.sin(time * 3.8 + (Number(object.id) || 0) * .47);
              const roadY = frame.y + .18;
              const topY = item.position.y - .34;
              const span = Math.max(.5, topY - roadY);
              // Two tiny beads make the vertical relationship legible without
              // drawing a solid beam through the puppy or stealing attention
              // from the actual turquoise handle at the gantry.
              for (let bead = 1; bead <= 2 && sparkCount < 192; bead++) {
                const beadPulse = .72 + .28 * Math.sin(time * 4.4 + bead * 1.7 + (Number(object.id) || 0));
                const beadScale = (.014 + cuePulse * .01) * beadPulse * (.55 + cueFade * .45);
                flashColor.set('#a2ffde');
                flashMatrix.makeScale(beadScale, beadScale * 1.25, beadScale);
                flashMatrix.setPosition(
                  item.position.x,
                  roadY + span * bead / 3,
                  item.position.z + .035,
                );
                flashes.setColorAt(sparkCount, flashColor);
                flashes.setMatrixAt(sparkCount++, flashMatrix);
              }
              aerialCueCount++;
            }
          } else if (!object.used && !object.passed && hazardCueCount < 3) {
            // A tiny marker above the next solid hazard gives the eye a
            // grounded target before the HUD cue arrives. It is deliberately
            // local to the object, distance-faded and capped so a full-width
            // row never turns into a second overlay. The existing flash batch
            // keeps this at zero extra geometry or texture uploads.
            const approach = object.at - distance;
            const solidHazard = ['rock', 'log', 'arch', 'branch', 'gate'].includes(object.type) || object.type === 'moving-gate' || object.type === 'pound-worker';
            const skiCharacter = object.skiObstacle || object.skiHazard;
            if ((solidHazard || skiCharacter) && approach > 5 && approach < 32 && sparkCount < 192) {
              const urgency = 1 - THREE.MathUtils.clamp((approach - 5) / 27, 0, 1);
              const pulse = .5 + .5 * Math.sin(time * 3.1 + (Number(object.id) || 0) * .67);
              const cueScale = (.018 + urgency * (skiCharacter ? .042 : .036)) * (.78 + pulse * .22);
              const overhead = ['arch', 'branch', 'gate', 'moving-gate'].includes(object.type);
              const skiColor = object.type === 'snowball' ? '#c7f1ff'
                : object.type === 'yeti' ? '#b8edff'
                  : object.type === 'snowman' ? '#fff0b7'
                    : object.type === 'pound-worker' ? '#ffad72' : '#d8f6ff';
              if (skiCharacter) flashColor.set(skiColor);
              else flashColor.set(overhead ? '#8ff2d2' : '#ffd38b');
              flashMatrix.makeScale(cueScale * 1.7, cueScale * .42, cueScale * .56);
              flashMatrix.setPosition(
                item.position.x,
                item.position.y + (overhead ? 2.55 : object.type === 'rock' ? 1.42 :
                  object.type === 'yeti' ? 2.25 : object.type === 'snowman' ? 2.18 :
                    object.type === 'pound-worker' ? 2.25 : 1.12),
                item.position.z + .055,
              );
              flashes.setColorAt(sparkCount, flashColor);
              flashes.setMatrixAt(sparkCount++, flashMatrix);
              hazardCueCount++;
            }
          }
        }
      if (!menu && !reducedMotion && !run.ended && spectacleBeacon && sparkCount < 192) {
        const {object, item, approach} = spectacleBeacon;
        const fade = 1 - THREE.MathUtils.clamp((approach - 4) / 60, 0, 1);
        const pulse = .5 + .5 * Math.sin(time * 3.1 + (Number(object.id) || 0) * .55);
        const color = spectacleBeaconColor(run.encounter?.title);
        const frame = frameAt(-approach);
        // Gaps and forks span the road; centre their beacon so the cue never
        // looks like a recommendation for only the left-hand gate. All other
        // pieces stay anchored to the moving/curved model itself.
        const wide = object.type === 'gap' || object.type === 'choice-left' || object.type === 'choice-right';
        const anchorX = wide ? frame.x : item.position.x;
        const anchorZ = wide ? frame.z : item.position.z;
        const anchorY = object.type === 'zipline-start' ? 6.82
          : object.type === 'moving-gate' ? 3.22
          : object.type === 'gap' ? .78
              : object.type === 'choice-left' || object.type === 'choice-right' ? 3.86
                  : object.type === 'ski-gate' ? 2.82
                  : object.type === 'ski-start' || object.type === 'ski-end' ? 3.18
                    : object.type === 'yeti' ? 2.52
                      : object.type === 'snowman' ? 2.35 : 1.65;
        // Three floating lozenges read as an arrival marker at a glance. They
        // stay tiny and distance-faded so the actual obstacle, bone line and
        // lane target remain the visual priorities when the beat is close.
        const offsets = [[-.62, 0], [0, .16], [.62, 0]];
        for (const [index, [offsetX, offsetY]] of offsets.entries()) {
          if (sparkCount >= 192) break;
          const markerPulse = .82 + .18 * Math.sin(time * 4.2 - index * .72);
          const markerScale = (.024 + pulse * .018) * (.48 + fade * .52) * markerPulse;
          flashColor.set(color);
          flashMatrix.makeScale(markerScale * (index === 1 ? 1.18 : .86), markerScale * 1.5, markerScale);
          flashMatrix.setPosition(anchorX + offsetX, anchorY + offsetY + pulse * .06, anchorZ + .08);
          flashes.setColorAt(sparkCount, flashColor);
          flashes.setMatrixAt(sparkCount++, flashMatrix);
        }
      }
      // Keep one badge attached to the actual transformed pickup so it follows
      // route bends and lane changes like the model. Fade it toward the object
      // instead of snapping it on at full size; the HUD remains the source of
      // exact meter/lane guidance while this cue answers only “what is that?”.
      if (scenePickupBadge && scenePickupBadgeItem) {
        const approach = Math.max(7, scenePickupBadge.object.at - distance);
        // Repaint when the runner changes lanes: the same pickup can move from
        // “← LEFT” to “YOUR LANE” without allocating another canvas or badge.
        const definitionKey = `${scenePickupBadge.type}:${scenePickupBadge.action}:${scenePickupBadge.lane || 'your lane'}`;
        if (pickupBadgeKey !== definitionKey) {
          paintPickupBadge(scenePickupBadge, scenePickupBadge.action);
          pickupBadgeKey = definitionKey;
        }
        pickupBadgeSprite.visible = true;
        pickupBadgeSprite.position.copy(scenePickupBadgeItem.position);
        // Lift the label just above the pickup's glow so the action line does
        // not disappear into a bone row or a paving seam on a portrait phone.
        pickupBadgeSprite.position.y += scenePickupBadge.object.airborne ? 1.06 : .94;
        // Keep the badge on the object, but nudge it toward the camera so a
        // nearby pickup cannot z-fight with its halo or the paving.
        pickupBadgeSprite.position.z += .16;
        const near = THREE.MathUtils.clamp(1 - (approach - 7) / 27, 0, 1);
        // A fixed world-size billboard shrinks to a few pixels at the
        // approach horizon. Compensate for perspective while capping the
        // near size, so the label remains readable without becoming a giant
        // overlay when the reward reaches the puppy.
        const cameraDistance = approach + 9;
        const farDistance = 41;
        const perspective = THREE.MathUtils.clamp(cameraDistance / farDistance, .42, 1);
        // The previous world size was legible only after the player had
        // already committed to a lane. A modest lift in both dimensions
        // keeps the label readable across the full 7–34m decision window,
        // while the perspective compensation still prevents a giant overlay
        // when the reward reaches Mochi.
        const badgeScale = camera.aspect < .85 ? 5.55 : 6.15;
        const badgeHeight = camera.aspect < .85 ? 1.08 : 1.18;
        pickupBadgeSprite.scale.set(
          badgeScale * perspective * (0.96 + near * .04),
          badgeHeight * perspective * (0.96 + near * .04),
          1,
        );
        pickupBadgeSprite.material.opacity = .58 + near * .27;
      } else {
        pickupBadgeSprite.visible = false;
        pickupBadgeSprite.material.opacity = 0;
      }
      boneBatch.end();
      boneOutlineBatch.end();
      flashes.count = sparkCount;
      flashes.instanceMatrix.needsUpdate = true;
      if(flashes.instanceColor)flashes.instanceColor.needsUpdate = true;
      for (const [id, item] of active)
        if (!visibleIds.has(id)) {
          scene.remove(item);
          pools[item.userData.type].push(item);
          active.delete(id);
        }
      if (menu) {
        puppyFrame=null;
        const mobile = camera.aspect < 0.85;
        cameraRoll += (0 - cameraRoll) * (1 - Math.exp(-10 * Math.max(0, dt)));
        camera.position.set(6, mobile ? 4 : 3.3, mobile ? 11 : 7.7);
        const compact = mobile && canvas.clientHeight<=600 && canvas.clientHeight>520;
        camera.lookAt(mobile ? -1.2 : -3.5, mobile ? compact ? .5 : 2.08 : 1.25, 0);
        camera.rotation.z = cameraRoll;
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
        // Let the chase camera breathe with the route. A small bank from the
        // upcoming tangent and the puppy's lane velocity makes corners and
        // steering feel physical without moving the collision frame or
        // rotating the HUD. Clamp the effect tightly, ease it while paused,
        // and fully neutralize it for reduced-motion users and result sheets.
        const cameraActive = state === 'playing' || state === 'paused';
        const routeBank = THREE.MathUtils.clamp(look.yaw * .07, -.075, .075);
        const lateralVelocity = Number.isFinite(run.vx) ? run.vx : 0;
        const laneBank = THREE.MathUtils.clamp(lean * .22 + lateralVelocity * .0015, -.055, .055);
        const actionBank = run.zipline ? lean * .08 : run.raft ? lean * .06 : run.minecart ? lean * .04 : run.ski ? lean * .10 : 0;
        const targetRoll = !reducedMotion && cameraActive
          ? THREE.MathUtils.clamp(routeBank + laneBank + actionBank, -.105, .105)
          : 0;
        cameraRoll += (targetRoll - cameraRoll) * (1 - Math.exp(-(cameraActive ? 7 : 10) * Math.max(0, dt)));
        camera.rotation.z = cameraRoll;
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
      return {shaderPreparation:shaderPreparation.status,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawCalls:renderer.info.render.calls,activeObjects:active.size+boneBatch.count,boneInstances:boneBatch.count,boneCapacity:boneBatch.capacity,pooledObjects:Object.values(pools).reduce((sum,items)=>sum+items.length,0),puppyFrame:puppyFrame?{...puppyFrame}:null,cameraRoll,legAngles:activeRig.legs.map(leg=>leg.rotation.x),bodyTransform:[...dog.position.toArray(),dog.rotation.x,dog.rotation.y,dog.rotation.z,...dog.scale.toArray()]};
    },
  };
}
