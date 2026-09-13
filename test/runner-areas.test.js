import test from 'node:test';
import assert from 'node:assert/strict';
import {AREAS,AREA_GAMEPLAY,areaAt,areaBlend,areaGameplayAt} from '../src/runner/areas.js';
import {regionAt} from '../src/runner/regions.js';
import {createBoneGeometry} from '../src/runner/bone-model.js';
import {createCapeGeometry} from '../src/runner/cape-model.js';
import {createRun,fillTrack,HAZARDS} from '../src/runner/world.js';

test('six visual areas cycle without changing mastery region identity',()=>{
  assert.equal(new Set(AREAS.map(area=>area.name)).size,6);
  for(let visit=0;visit<24;visit++){
    const d=visit*225;
    assert.equal(areaAt(d),visit%6);
    assert.equal(Math.floor(areaAt(d)/2),regionAt(d));
    const start=areaBlend(d),end=areaBlend(d+45);
    assert.equal(start.blend,0);assert.equal(end.blend,1);
    if(visit)assert.equal(start.previous,(visit+5)%6);
  }
});

test('version four gives every destination a distinct readable encounter rhythm',()=>{
  assert.equal(AREA_GAMEPLAY.length,AREAS.length);
  assert.equal(new Set(AREA_GAMEPLAY.map(profile=>profile.id)).size,AREAS.length);
  for(const [area,profile] of AREA_GAMEPLAY.entries()){
    assert.equal(areaGameplayAt(area*225+12),profile);
    assert.ok(profile.hazards.length>=3);
    assert.ok(profile.hazards.every(type=>HAZARDS.includes(type)&&type!=='gap'));
    assert.equal(new Set(profile.safeLanes).size,3);
    const run=createRun(4242,{},4);
    const distance=area*225+115;
    Object.assign(run,{distance,nextRow:distance,row:18,objects:[],nextChoice:Infinity,
      nextZipline:Infinity,choicePending:null,lastCourseVisit:Math.floor(distance/450),
      raftPrototype:false});
    fillTrack(run);
    const hazards=run.objects.filter(object=>HAZARDS.includes(object.type));
    assert.ok(hazards.length>0);
    assert.ok(hazards.some(object=>profile.hazards.includes(object.type)),profile.id);
  }
});

test('cape is a curved lightweight cloth surface rather than a solid slab',()=>{
  const geometry=createCapeGeometry();geometry.computeBoundingBox();
  assert.ok(geometry.attributes.position.count<100);
  assert.ok(geometry.boundingBox.max.y-geometry.boundingBox.min.y>.1);
  assert.ok(geometry.attributes.normal.array.every(Number.isFinite));
  assert.ok(geometry.attributes.position.array.every(Number.isFinite));
  geometry.dispose();
});

test('rounded bone geometry has real depth, readable proportions and bounded allocation',()=>{
  const geometry=createBoneGeometry();geometry.computeBoundingBox();
  const box=geometry.boundingBox;
  assert.ok(box.max.z-box.min.z>.3,'not a flat cutout');
  assert.ok(box.max.x-box.min.x>1&&box.max.x-box.min.x<1.2);
  assert.ok(geometry.attributes.position.count<1000);
  assert.equal(geometry.attributes.color.count,geometry.attributes.position.count);
  assert.ok(geometry.attributes.normal.array.every(Number.isFinite));
  assert.ok(geometry.attributes.position.array.every(Number.isFinite));
  geometry.dispose();
});
