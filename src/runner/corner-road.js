import * as THREE from "three";
import { CORNER_ARC_LENGTH, cornersBetween } from "./turns.js";
import { REGIONS, regionAt } from "./regions.js";
import { isBridge } from "./bridges.js";

const STEP = 0.5;
const EDGE_EXTENSION = 2.5;
const ROAD_LENGTH = CORNER_ARC_LENGTH + EDGE_EXTENSION * 2;
const SEGMENTS = ROAD_LENGTH / STEP;
const STRIPS = [
  { center: 0, width: 9.2, height: -0.05, color: "base" },
  { center: 0, width: 7.8, height: 0.1, color: "paving" },
  { center: -4.25, width: 0.45, height: 0.23, color: "curb" },
  { center: 4.25, width: 0.45, height: 0.23, color: "curb" },
];
const VERTICES_PER_QUAD = 6;
const VERTEX_COUNT = SEGMENTS * STRIPS.length * VERTICES_PER_QUAD;

const baseColors = {
  base: new THREE.Color("#526d49"),
  paving: new THREE.Color("#c1ba88"),
  curb: new THREE.Color("#526453"),
};
const regionColors = REGIONS.map((region, index) => {
  const stone = new THREE.Color(region.stone);
  return {
    base: index === 0 ? baseColors.base : baseColors.base.clone().lerp(stone, 0.72),
    paving:
      index === 0 ? baseColors.paving : baseColors.paving.clone().lerp(stone, 0.72),
    curb: index === 0 ? baseColors.curb : baseColors.curb.clone().lerp(stone, 0.08),
  };
});
const bridgeColors = {
  base: new THREE.Color('#64472e'),
  paving: new THREE.Color('#c9915e'),
  pavingAlternate: new THREE.Color('#b77c4c'),
  curb: new THREE.Color('#765036'),
};

function writeVertex(positions, normals, colors, offset, frame, across, height, color) {
  positions[offset] = frame.x + across * frame.cosYaw;
  positions[offset + 1] = frame.y + height;
  positions[offset + 2] = frame.z - across * frame.sinYaw;
  normals[offset] = frame.normalX;
  normals[offset + 1] = frame.normalY;
  normals[offset + 2] = frame.normalZ;
  colors[offset] = color.r;
  colors[offset + 1] = color.g;
  colors[offset + 2] = color.b;
  return offset + 3;
}

export function createCornerRoad(scene) {
  const positions = new Float32Array(VERTEX_COUNT * 3);
  const normals = new Float32Array(VERTEX_COUNT * 3);
  const colors = new Float32Array(VERTEX_COUNT * 3);
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  const normalAttribute = new THREE.BufferAttribute(normals, 3);
  const colorAttribute = new THREE.BufferAttribute(colors, 3);
  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  normalAttribute.setUsage(THREE.DynamicDrawUsage);
  colorAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("normal", normalAttribute);
  geometry.setAttribute("color", colorAttribute);
  geometry.setDrawRange(0, VERTEX_COUNT);

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "smooth-corner-road";
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);
  const frames = Array.from({ length: SEGMENTS + 1 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    cosYaw: 1,
    sinYaw: 0,
    normalX: 0,
    normalY: 1,
    normalZ: 0,
  }));

  function update(distance, frameAt, menu = false) {
    if (menu || !Number.isFinite(distance) || typeof frameAt !== "function") {
      mesh.visible = false;
      return null;
    }
    const corner = cornersBetween(distance - 50, distance + 170)[0];
    if (!corner) {
      mesh.visible = false;
      return null;
    }

    const start = corner.at - EDGE_EXTENSION;
    for (let sample = 0; sample <= SEGMENTS; sample++) {
      const source = frameAt(distance - (start + sample * STEP));
      const frame = frames[sample];
      frame.x = source.x;
      frame.y = source.y;
      frame.z = source.z;
      frame.cosYaw = Math.cos(source.yaw);
      frame.sinYaw = Math.sin(source.yaw);
      const pitchSine = Math.sin(source.pitch);
      frame.normalX = frame.sinYaw * pitchSine;
      frame.normalY = Math.cos(source.pitch);
      frame.normalZ = frame.cosYaw * pitchSine;
    }
    let offset = 0;
    for (const strip of STRIPS) {
      const halfWidth = strip.width / 2;
      for (let segment = 0; segment < SEGMENTS; segment++) {
        const stationA = start + segment * STEP;
        const stationB = stationA + STEP;
        const frameA = frames[segment];
        const frameB = frames[segment + 1];
        const left = strip.center - halfWidth;
        const right = strip.center + halfWidth;
        const station = (stationA + stationB) / 2;
        const palette = isBridge(station) ? bridgeColors : regionColors[regionAt(station)];
        const color = palette===bridgeColors && strip.color==='paving' && Math.floor(station)%2
          ? bridgeColors.pavingAlternate : palette[strip.color];

        offset = writeVertex(positions, normals, colors, offset, frameA, left, strip.height, color);
        offset = writeVertex(positions, normals, colors, offset, frameA, right, strip.height, color);
        offset = writeVertex(positions, normals, colors, offset, frameB, right, strip.height, color);
        offset = writeVertex(positions, normals, colors, offset, frameA, left, strip.height, color);
        offset = writeVertex(positions, normals, colors, offset, frameB, right, strip.height, color);
        offset = writeVertex(positions, normals, colors, offset, frameB, left, strip.height, color);
      }
    }

    positionAttribute.needsUpdate = true;
    normalAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    mesh.visible = true;
    return corner;
  }

  function dispose() {
    scene.remove(mesh);
    geometry.dispose();
    material.dispose();
  }

  return { mesh, geometry, material, update, dispose };
}
