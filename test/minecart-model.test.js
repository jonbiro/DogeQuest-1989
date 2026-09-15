import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createMinecartModel} from '../src/runner/minecart-model.js';

test('mine-cart model uses shared geometry with readable wheels, rails and lantern', () => {
  const box = new THREE.BoxGeometry();
  const trunk = new THREE.CylinderGeometry(.7, 1, 1, 10);
  const material = new THREE.MeshStandardMaterial();
  const cart = createMinecartModel((parent, geometry, color, x, y, z, sx, sy, sz) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.material = material.clone();
    mesh.material.color.set(color);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  }, box, trunk);
  const meshes = [];
  cart.traverse(part => { if (part.isMesh) meshes.push(part); });
  assert.equal(cart.name, 'mine-cart');
  assert.equal(cart.visible, false);
  assert.equal(cart.userData.wheels.length, 4);
  assert.ok(cart.userData.wheels.every(wheel => wheel.userData.baseRotation === Math.PI / 2));
  assert.ok(cart.userData.lantern);
  assert.ok(meshes.some(mesh => mesh.userData.lantern));
  assert.ok(meshes.some(mesh => mesh.material.color.getHexString() === 'f2c56d'));
  assert.ok(meshes.every(mesh => mesh.geometry === box || mesh.geometry === trunk));
  assert.ok(meshes.every(mesh => mesh.castShadow && mesh.receiveShadow));
  for (const wheel of cart.userData.wheels) assert.equal(wheel.rotation.z, Math.PI / 2);
  cart.traverse(part => { if (part.isMesh && part.material !== material) part.material.dispose(); });
  box.dispose();
  trunk.dispose();
  material.dispose();
});
