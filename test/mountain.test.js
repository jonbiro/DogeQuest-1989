import test from 'node:test';
import assert from 'node:assert/strict';
import {createMountainGeometry} from '../src/runner/mountain.js';
test('shared mountain ridges are deterministic, finite and small',()=>{
  const a=createMountainGeometry(),b=createMountainGeometry();
  const positions=a.getAttribute('position');
  assert.ok(positions.count<300);
  assert.deepEqual(positions.array,b.getAttribute('position').array);
  for(const value of positions.array)assert.ok(Number.isFinite(value)&&Math.abs(value)<1.5);
  for(const value of a.getAttribute('normal').array)assert.ok(Number.isFinite(value));
  assert.ok(a.boundingSphere.radius<1.5);
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
