import test from 'node:test';
import assert from 'node:assert/strict';
import {createMountainGeometry,blendMountainArea} from '../src/runner/mountain.js';
import {Mesh,MeshBasicMaterial} from 'three';
import {areaBlend} from '../src/runner/areas.js';

test('six horizon profiles differ, stay grounded and blend without scale pops',()=>{
  const geometry=createMountainGeometry(),targets=geometry.morphAttributes.position;
  assert.equal(targets.length,6);assert.equal(geometry.morphAttributes.normal.length,6);
  assert.equal(new Set(targets.map(p=>Array.from(p.array).join(','))).size,6);
  for(const [area,p] of targets.entries())for(let i=0;i<p.count;i++){
    assert.equal(p.getX(i),geometry.attributes.position.getX(i));
    assert.equal(p.getZ(i),geometry.attributes.position.getZ(i));
    if(Math.abs(p.getX(i))===1||Math.abs(p.getZ(i))===1)assert.equal(p.getY(i),-.5);
    assert.ok(Number.isFinite(p.getY(i)));
    assert.ok(geometry.morphAttributes.normal[area].getY(i)>0);
  }
  const mesh=new Mesh(geometry,new MeshBasicMaterial());
  for(let distance=0;distance<2800;distance++){
    blendMountainArea(mesh,areaBlend(distance));
    assert.ok(Math.abs(mesh.morphTargetInfluences.reduce((a,b)=>a+b,0)-1)<1e-10);
    assert.ok(mesh.morphTargetInfluences.every(weight=>weight>=0&&weight<=1));
  }
  for(let boundary=225;boundary<2700;boundary+=225){
    blendMountainArea(mesh,areaBlend(boundary-1e-5));const before=[...mesh.morphTargetInfluences];
    blendMountainArea(mesh,areaBlend(boundary));
    assert.deepEqual(mesh.morphTargetInfluences,before);
  }
  geometry.dispose();mesh.material.dispose();
});
test('shared mountain ridges are deterministic, finite and small',()=>{
  const a=createMountainGeometry(),b=createMountainGeometry();
  const positions=a.getAttribute('position');
  assert.ok(positions.count<300);
  assert.deepEqual(positions.array,b.getAttribute('position').array);
  for(const value of positions.array)assert.ok(Number.isFinite(value)&&Math.abs(value)<1.5);
  for(const value of a.getAttribute('normal').array)assert.ok(Number.isFinite(value));
  assert.ok(a.boundingSphere.radius<1.6,'bounds include the taller crystal morph');
  a.dispose();b.dispose();
});

test('ridge has multiple summits, upward faces and a grounded perimeter',()=>{
  const geometry=createMountainGeometry(),positions=geometry.attributes.position;
  const columns=21,rows=13,heights=[];
  for(let column=0;column<columns;column++){
    let peak=-Infinity;
    for(let row=0;row<rows;row++){
      const y=positions.getY(row*columns+column);peak=Math.max(peak,y);
      if(row===0||row===rows-1||column===0||column===columns-1)assert.equal(y,-.5);
    }
    heights.push(peak);
  }
  const summits=heights.filter((height,i)=>i>0&&i<columns-1&&height>heights[i-1]&&height>heights[i+1]);
  assert.ok(summits.length>=2);
  for(let i=0;i<geometry.attributes.normal.count;i++)assert.ok(geometry.attributes.normal.getY(i)>0);
  for(const value of geometry.attributes.color.array)assert.ok(value>=.7&&value<=1);
  assert.equal(geometry.index.count,(columns-1)*(rows-1)*6);
  geometry.dispose();
});
