import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createCornerRoad } from "../src/runner/corner-road.js";
import { routeFrame } from "../src/runner/route.js";

test("corner ribbon reuses one finite dynamic geometry across updates", () => {
  const scene = new THREE.Scene();
  const road = createCornerRoad(scene);
  const position = road.geometry.getAttribute("position");
  const normal = road.geometry.getAttribute("normal");
  const color = road.geometry.getAttribute("color");
  const frames = new Map();
  const distance = 100;
  const frameAt = (z) => {
    if (!frames.has(z)) frames.set(z, routeFrame(distance, z));
    return frames.get(z);
  };

  assert.equal(road.update(distance, frameAt).at, 150);
  assert.equal(road.mesh.visible, true);
  assert.equal(scene.children.filter((child) => child.isMesh).length, 1);
  assert.equal(position.count, 1440);
  assert.equal(normal.count, position.count);
  assert.equal(color.count, position.count);
  assert.ok(position.array.every(Number.isFinite));
  assert.ok(normal.array.every(Number.isFinite));
  assert.ok(color.array.every(Number.isFinite));
  assert.ok(normal.array.every((value) => value >= -1 && value <= 1));

  const positionArray = position.array;
  road.update(900, (z) => routeFrame(900, z));
  assert.equal(road.geometry.getAttribute("position").array, positionArray);
  assert.equal(road.update(400, (z) => routeFrame(400, z)), null);
  assert.equal(road.mesh.visible, false);
  road.update(100, frameAt, true);
  assert.equal(road.mesh.visible, false);

  road.dispose();
  assert.equal(scene.children.includes(road.mesh), false);
});

test("curb strips remain outside the paved ribbon through a ninety-degree arc", () => {
  const scene = new THREE.Scene();
  const road = createCornerRoad(scene);
  const distance = 140;
  road.update(distance, (z) => routeFrame(distance, z));
  const positions = road.geometry.getAttribute("position").array;
  const verticesPerStrip = 60 * 6;

  // Every corresponding curb point stays farther from its route center than
  // the 3.9m paved edge, including at the tight midpoint of the corner.
  for (const stripIndex of [2, 3]) {
    const stripStart = stripIndex * verticesPerStrip * 3;
    for (let segment = 0; segment < 60; segment += 5) {
      const station = 147.5 + segment * 0.5;
      const frame = routeFrame(distance, distance - station);
      const vertexOffset = stripStart + segment * 18;
      const dx = positions[vertexOffset] - frame.x;
      const dz = positions[vertexOffset + 2] - frame.z;
      assert.ok(Math.hypot(dx, dz) >= 4.02);
    }
  }
  road.dispose();
});

test('later corners preserve a wooden river deck instead of overlapping bridge rails', () => {
  const road = createCornerRoad(new THREE.Scene());
  const distance = 2962.5;
  assert.equal(road.update(distance,z=>routeFrame(distance,z)).at,2950);
  const colors = road.geometry.getAttribute('color').array;
  const pavingOffset = 60 * 6 * 3;
  const woods = [new THREE.Color('#c9915e'),new THREE.Color('#b77c4c')];
  const seen=new Set();
  for(let segment=0;segment<60;segment++) {
    const station=2947.5+segment*.5+.25;
    const shade=Math.floor(station)%2;
    const wood=woods[shade],offset=pavingOffset+segment*18;
    assert.ok(Math.abs(colors[offset]-wood.r)<1e-6);
    assert.ok(Math.abs(colors[offset+1]-wood.g)<1e-6);
    assert.ok(Math.abs(colors[offset+2]-wood.b)<1e-6);
    seen.add(shade);
  }
  assert.equal(seen.size,2,'Wood planks retain alternating depth cues');
  assert.ok(road.geometry.getAttribute('position').array.every(Number.isFinite));
  road.dispose();
});

test('land corner curbs retain luminance separation across region palettes',()=>{
  const road=createCornerRoad(new THREE.Scene());
  for(const distance of [140,940,8540]) {
    road.update(distance,z=>routeFrame(distance,z));
    const colors=road.geometry.getAttribute('color').array;
    const stride=60*6*3;
    // Sample inside the corner, not its extension before a region boundary.
    const luminance=stripOffset=>{
      const offset=stripOffset+20*18;
      return colors[offset]*.2126+colors[offset+1]*.7152+colors[offset+2]*.0722;
    };
    assert.ok((luminance(stride)+.05)/(luminance(stride*2)+.05)>2.5,`Faint curb at ${distance}`);
  }
  road.dispose();
});
