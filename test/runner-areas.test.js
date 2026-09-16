import test from 'node:test';
import assert from 'node:assert/strict';
import {AREAS,AREA_GAMEPLAY,areaAt,areaBlend,areaGameplayAt,landmarkSway,landmarkVariation,LANDMARK_SHOULDER_MIN,LANDMARK_SHOULDER_SPREAD} from '../src/runner/areas.js';
import {regionAt} from '../src/runner/regions.js';
import {createBoneGeometry} from '../src/runner/bone-model.js';
import {createCapeGeometry} from '../src/runner/cape-model.js';
import {createRun,fillTrack,HAZARDS} from '../src/runner/world.js';
import {ATMOSPHERE_PARTICLE_COUNT,sampleAtmosphereParticle} from '../src/runner/atmosphere.js';

test('six visual areas cycle without changing mastery region identity',()=>{
  assert.equal(new Set(AREAS.map(area=>area.name)).size,6);
  assert.deepEqual(AREAS.map(area=>area.landmark),[
    'firefly-tree','bamboo-lantern','redrock-stack',
    'oasis-palms','crystal-spires','mooncap-ring',
  ]);
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

test('each authored pattern changes the hazard rhythm without inventing new moves',()=>{
  for(const profile of AREA_GAMEPLAY){
    const patterns=profile.patterns||[];
    assert.equal(new Set(patterns.map(pattern=>pattern.hazardOrder.join(','))).size,patterns.length,profile.id);
    for(const pattern of patterns){
      assert.equal(pattern.hazardOrder.length,4,`${profile.id}:${pattern.id}`);
      assert.ok(pattern.hazardOrder.every(type=>profile.hazards.includes(type)),`${profile.id}:${pattern.id}`);
    }
  }
});

test('every destination has a restrained atmosphere outside the playable corridor',()=>{
  assert.equal(ATMOSPHERE_PARTICLE_COUNT,24);
  for(const area of AREAS){
    assert.match(area.atmosphere.motif,/^(fireflies|leaves|dust|sparkles|crystals|spores)$/);
    assert.match(area.atmosphere.color,/^#[0-9a-f]{6}$/i);
    assert.match(area.atmosphere.accent,/^#[0-9a-f]{6}$/i);
    assert.ok(area.atmosphere.speed>0&&area.atmosphere.speed<2);
    assert.ok(area.atmosphere.opacity>0&&area.atmosphere.opacity<1);
  }
  const profile=AREAS[0].atmosphere;
  const sample=sampleAtmosphereParticle(7,120,3,profile,false);
  const still=sampleAtmosphereParticle(7,120,3,profile,true);
  assert.ok(Number.isFinite(sample.x)&&Number.isFinite(sample.y)&&Number.isFinite(sample.z));
  assert.ok(Math.abs(sample.x)>=5.4,'particles stay clear of the three playable lanes');
  assert.ok(sample.z<=-8,'particles remain ahead of the puppy');
  assert.equal(still.x, sampleAtmosphereParticle(7,120,0,profile,true).x);
  assert.equal(still.y, sampleAtmosphereParticle(7,120,0,profile,true).y);
});

test('destination landmarks sway within a calm bounded range and respect reduced motion',()=>{
  for(const [time,offset,area] of [[0,0,0],[1.25,8.4,1],[-4,27,4],[90,112,5]]){
    const sample=landmarkSway(time,offset,area,false);
    assert.ok(Number.isFinite(sample.rotation)&&Number.isFinite(sample.lift)&&Number.isFinite(sample.scale));
    assert.ok(Math.abs(sample.rotation)<.025,'landmark tilt stays subtle');
    assert.ok(Math.abs(sample.lift)<=.035,'landmark lift stays bounded');
    assert.ok(sample.scale>=.986&&sample.scale<=1.014,'landmark scale stays bounded');
  }
  assert.deepEqual(landmarkSway(3,2,4,true),{rotation:0,lift:0,scale:1});
  assert.deepEqual(landmarkSway(9,80,1,true),landmarkSway(0,0,0,true));
});

test('destination batches vary between passes without drifting or animating in reduced motion',()=>{
  const first=landmarkVariation(14,8,2,false);
  const repeat=landmarkVariation(204,8,2,false);
  assert.ok(Number.isFinite(first.yaw)&&Number.isFinite(first.scale));
  assert.ok(Math.abs(first.yaw)<=.032,'landmark yaw stays nearly upright');
  assert.ok(first.scale>=.982&&first.scale<=1.018,'landmark scale stays bounded');
  assert.notDeepEqual(first,repeat,'recycled batches receive a new subtle variation');
  assert.deepEqual(landmarkVariation(204,8,2,true),{yaw:0,scale:1});
  assert.deepEqual(landmarkVariation(Number.NaN,Number.NaN,Number.NaN,false),landmarkVariation(0,0,0,false));
});

test('destination landmark placement stays visible but outside the playable road',()=>{
  assert.ok(LANDMARK_SHOULDER_MIN>4.25,'landmarks clear the road edge');
  assert.ok(LANDMARK_SHOULDER_MIN+LANDMARK_SHOULDER_SPREAD<20,'landmarks remain in the chase-camera corridor');
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
