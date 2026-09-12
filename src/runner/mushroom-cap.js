import * as THREE from 'three';

// Closed revolved profile: recessed underside, rolled rim and domed crown.
// Shared by every mushroom; substantially fewer vertices than a sphere cap.
export function createMushroomCapGeometry(){
  const profile=[[0,-.19],[.32,-.22],[.76,-.16],[1,-.04],
    [.98,.07],[.82,.28],[.52,.48],[.2,.57],[0,.59]];
  const geometry=new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),20);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}
