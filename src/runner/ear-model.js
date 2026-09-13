import * as THREE from "three";

// The classic rigs need an ear with a soft silhouette, not a five-sided cone.
// Lathe profiles keep the mesh compact for mobile while giving the edge enough
// radial samples to catch a gentle highlight all the way around the ear.
function lathed(points, segments = 20) {
  const geometry = new THREE.LatheGeometry(
    points.map(([radius, height]) => new THREE.Vector2(radius, height)),
    segments,
  );
  geometry.computeVertexNormals();
  return geometry;
}

// Both profiles are rooted at y=0 so a caller can place the ear group directly
// on the skull. Floppy ears hang toward negative y; upright ears taper toward
// a rounded point at positive y.
export function createClassicEarGeometries() {
  const floppy = lathed([
    [.025, -1.00],
    [.080, -.96],
    [.145, -.88],
    [.205, -.73],
    [.245, -.54],
    [.260, -.32],
    [.252, -.12],
    [.225, 0],
  ]);
  const upright = lathed([
    [.225, 0],
    [.250, .10],
    [.240, .27],
    [.210, .45],
    [.170, .63],
    [.115, .80],
    [.055, .94],
    [.012, 1.00],
  ]);
  return {floppy, upright};
}

