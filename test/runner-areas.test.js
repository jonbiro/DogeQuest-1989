import test from 'node:test';
import assert from 'node:assert/strict';
import {AREAS,AREA_LENGTH,AREA_GAMEPLAY,areaAt,areaBlend,areaGameplayAt,areaSignatureAt,landmarkSway,landmarkVariation,worldMoodAt,WORLD_MOODS,WORLD_PASS_LENGTH,LANDMARK_SHOULDER_MIN,LANDMARK_SHOULDER_SPREAD} from '../src/runner/areas.js';
import {regionAt} from '../src/runner/regions.js';
import {createBoneGeometry} from '../src/runner/bone-model.js';
import {createCapeGeometry} from '../src/runner/cape-model.js';
import {createRun,fillTrack,HAZARDS,OPENING_RUNWAY_ROWS} from '../src/runner/world.js';
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

test('full destination passes rotate restrained world moods for long-run variety',()=>{
  assert.equal(WORLD_PASS_LENGTH,AREA_LENGTH*AREAS.length);
  assert.equal(new Set(WORLD_MOODS.map(mood=>mood.id)).size,WORLD_MOODS.length);
  assert.ok(WORLD_MOODS.every(mood=>mood.strength>=.06&&mood.strength<=.14));
  const first=worldMoodAt(0);
  assert.equal(first.index,0);
  assert.equal(first.previous,0);
  assert.equal(first.blend,1);
  const boundary=worldMoodAt(WORLD_PASS_LENGTH);
  assert.equal(boundary.index,1);
  assert.equal(boundary.previous,0);
  assert.equal(boundary.blend,0);
  assert.equal(worldMoodAt(WORLD_PASS_LENGTH+64).blend,1);
  assert.equal(worldMoodAt(WORLD_PASS_LENGTH*WORLD_MOODS.length).index,0);
  assert.deepEqual(worldMoodAt(Number.NaN),first);
});

test('each destination owns a distinct, bounded lighting profile',()=>{
  const profiles=AREAS.map(area=>area.lighting);
  assert.ok(profiles.every(profile=>profile&&/^#[0-9a-f]{6}$/i.test(profile.sky)),'every area has a hemisphere sky color');
  assert.ok(profiles.every(profile=>/^#[0-9a-f]{6}$/i.test(profile.ground)),'every area has a hemisphere ground color');
  assert.ok(profiles.every(profile=>/^#[0-9a-f]{6}$/i.test(profile.sun)),'every area has a sun color');
  assert.ok(profiles.every(profile=>profile.hemi>=1.4&&profile.hemi<=2.2),'hemisphere energy stays readable');
  assert.ok(profiles.every(profile=>profile.sunPower>=2.4&&profile.sunPower<=3.7),'sun energy stays readable');
  assert.equal(new Set(profiles.map(profile=>`${profile.sky}/${profile.ground}/${profile.sun}`)).size,AREAS.length,
    'destination lights do not collapse into one global look');
  for(const distance of [0,224.99,225,449.99,675,1125]){
    const blend=areaBlend(distance);
    const from=profiles[blend.previous],to=profiles[blend.index];
    const intensity=from.hemi+(to.hemi-from.hemi)*blend.blend;
    const sunlight=from.sunPower+(to.sunPower-from.sunPower)*blend.blend;
    assert.ok(Number.isFinite(intensity)&&Number.isFinite(sunlight));
    assert.ok(intensity>=1.4&&intensity<=2.2);
    assert.ok(sunlight>=2.4&&sunlight<=3.7);
  }
});

test('version four gives every destination a distinct readable encounter rhythm',()=>{
  assert.equal(AREA_GAMEPLAY.length,AREAS.length);
  assert.equal(new Set(AREA_GAMEPLAY.map(profile=>profile.id)).size,AREAS.length);
  for(const [area,profile] of AREA_GAMEPLAY.entries()){
    assert.equal(areaGameplayAt(area*225+12),profile);
    assert.equal(profile.mechanic,AREAS[area].mechanic.id);
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

test('every destination owns a distinct mechanic, prop family and traversal cue',()=>{
  const mechanicIds=AREAS.map(area=>area.mechanic?.id);
  const mechanicLabels=AREAS.map(area=>area.mechanic?.label);
  assert.equal(new Set(mechanicIds).size,AREAS.length);
  assert.equal(new Set(mechanicLabels).size,AREAS.length);
  for(const [index,area] of AREAS.entries()){
    assert.match(area.mechanic.id,/^[a-z-]+$/);
    assert.ok(area.mechanic.cue.length>8);
    assert.ok(area.mechanic.detail.endsWith('.'));
    assert.ok(Array.isArray(area.props)&&area.props.length>=3);
    assert.ok(area.props.every(prop=>typeof prop==='string'&&prop.length>2));
    assert.ok(area.traversal.endsWith('.'));
    const signature=areaSignatureAt(index*225+30);
    assert.equal(signature.index,index);
    assert.equal(signature.landmark,area.landmark);
    assert.equal(signature.mechanic.label,area.mechanic.label);
    assert.deepEqual(signature.props,area.props);
  }
});

test('current trails turn the director into quiet warm-up and recovery beats',()=>{
  const fixture = distance => {
    const run = createRun(4242,{},5,null,{encounterPacing:true});
    Object.assign(run,{distance,nextRow:distance,row:18,objects:[],nextChoice:Infinity,
      nextZipline:Infinity,choicePending:null,lastCourseVisit:Math.floor(distance/450),
      nextCorner:Infinity,nextMinecart:Infinity,nextMovingGate:Infinity,
      nextDogChase:Infinity,nextBridgeCollapse:Infinity,
      raftPrototype:false,minecartPrototype:false,movingGatePrototype:false,
      dogChasePrototype:false,course:null});
    fillTrack(run);
    return run;
  };
  const warmup=fixture(12);
  const warmupObjects=warmup.objects.filter(object=>object.at>=0&&object.at<42);
  assert.ok(warmupObjects.some(object=>object.type==='bone'),'warm-up still offers a readable reward line');
  assert.equal(warmupObjects.some(object=>HAZARDS.includes(object.type)),false,
    'warm-up does not hide a hazard in the first lesson line');
  assert.ok(warmupObjects.filter(object=>object.type==='bone').every(object=>object.lane===1),
    'warm-up bones stay in the runner lane');

  const escalation=fixture(55);
  assert.ok(escalation.objects.some(object=>object.at>=42&&object.at<105&&HAZARDS.includes(object.type)),
    'the middle of the area still raises pressure');

  const recovery=fixture(430);
  const recoveryObjects=recovery.objects.filter(object=>object.at>=414&&object.at<450);
  assert.ok(recoveryObjects.some(object=>object.type==='bone'&&object.recovery),
    'recovery gives the player an explicitly tagged bonus line');
  assert.equal(recoveryObjects.some(object=>HAZARDS.includes(object.type)),false,
    'recovery keeps the ordinary lane clear');
});

test('the live opening runway teaches movement before the first hazard row',()=>{
  const run=createRun(4242,{},5,null,{encounterPacing:true});
  const runway=run.objects.filter(object => object.at < 120);
  assert.ok(runway.some(object => object.type==='bone'),'the runway still offers a reward line');
  assert.ok(runway.some(object => object.type==='magnet' && object.tutorial),'the first special item is still introduced');
  assert.equal(runway.some(object => HAZARDS.includes(object.type)),false,
    'the first three authored rows stay clear of surprise hazards');
  assert.equal(OPENING_RUNWAY_ROWS,3);

  const historical=createRun(4242,{},5);
  assert.ok(historical.objects.some(object => HAZARDS.includes(object.type) && object.at < 120),
    'replay streams without live pacing keep their established rows');
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
