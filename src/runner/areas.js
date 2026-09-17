// Two visual destinations within each mastery region. World generation and
// passport keys still use the original three regions.
export const AREA_LENGTH=225;
// A complete pass visits all six visual destinations. Subtle lighting moods
// change between passes so a long run feels like a journey through a day,
// while the authored area palettes and gameplay identity remain intact.
export const WORLD_PASS_LENGTH = AREA_LENGTH * 6;
// Foreground landmark families sit just beyond the road shoulders. Keeping the
// minimum explicit gives the renderer a readable destination cue on portrait
// cameras without ever placing decorative geometry in a playable lane.
export const LANDMARK_SHOULDER_MIN=5.8;
export const LANDMARK_SHOULDER_SPREAD=7.5;
export const AREAS=[
  // Clearer value separation keeps the warm road, dark hazards and pale
  // pickups readable as each destination fades into the next one.
  // Each destination also gets a restrained atmospheric motif. The renderer
  // keeps these outside the playable corridor, so they add place identity
  // without turning the lane into visual noise on a small screen.
  {name:'Sunleaf Woods',short:'Sunleaf',landmark:'firefly-tree',setPiece:{id:'shelter-outpost',label:'Paw shelter outpost',cue:'A shelter helper is crossing ahead.'},mechanic:{id:'fern-weave',label:'Fern weave',cue:'Follow the fern ribbon',detail:'Bone lines bend around roots.'},props:['firefly trees','root arches','fern fans'],traversal:'Root arches frame the safe lane.',sky:'#c5eee3',ground:'#1f5642',lighting:{sky:'#ddfff5',ground:'#173d35',hemi:1.95,sun:'#fff1c9',sunPower:3.15},atmosphere:{motif:'fireflies',color:'#fff0a6',accent:'#a9e8bd',speed:.62,lift:.34,size:.085,opacity:.56}},
  {name:'Bamboo Sanctuary',short:'Bamboo',landmark:'bamboo-lantern',setPiece:{id:'lantern-shrine',label:'Bamboo lantern shrine',cue:'Lanterns mark the next lane.'},mechanic:{id:'lantern-slalom',label:'Lantern slalom',cue:'Read the lantern gap',detail:'Gates trade lanes beneath the bamboo.'},props:['bamboo stands','lantern gates','reed shoots'],traversal:'Lantern gates mark the next opening.',sky:'#e3f2ce',ground:'#34502f',lighting:{sky:'#efffe6',ground:'#1c3c31',hemi:1.82,sun:'#fff3bf',sunPower:2.85},atmosphere:{motif:'leaves',color:'#c9e98b',accent:'#78b870',speed:.86,lift:.26,size:.12,opacity:.42}},
  {name:'Redrock Pass',short:'Redrock',landmark:'redrock-stack',setPiece:{id:'ranger-cairn',label:'Ranger trail cairn',cue:'The ridge flags point to the safe lane.'},mechanic:{id:'ridge-hop',label:'Ridge hops',cue:'Jump the rock rhythm',detail:'Split buttes turn each lane into a quick hop.'},props:['split buttes','dust stones','ridge caps'],traversal:'Bright ridge caps preview the jump line.',sky:'#f7c18f',ground:'#8f4c32',lighting:{sky:'#ffe4c6',ground:'#44222a',hemi:1.7,sun:'#ffd19f',sunPower:3.35},atmosphere:{motif:'dust',color:'#ffd18e',accent:'#f29b70',speed:1.08,lift:.18,size:.095,opacity:.34}},
  {name:'Palm Oasis',short:'Oasis',landmark:'oasis-palms',setPiece:{id:'waterwheel-market',label:'Oasis waterwheel',cue:'The waterwheel glints beside the trail.'},mechanic:{id:'stone-hop',label:'Stepping stones',cue:'Choose the next stone',detail:'Safe bone lines skip across the water break.'},props:['fan palms','shallow pools','stepping stones'],traversal:'Warm stones point through the oasis water.',sky:'#d8f1e8',ground:'#8d6b39',lighting:{sky:'#e7fff8',ground:'#304735',hemi:1.88,sun:'#fff6d5',sunPower:3.05},atmosphere:{motif:'sparkles',color:'#fff3bd',accent:'#b8ead3',speed:.46,lift:.3,size:.09,opacity:.5}},
  {name:'Crystal Reach',short:'Crystal',landmark:'crystal-spires',setPiece:{id:'prism-observatory',label:'Prism observatory',cue:'Follow the bright observatory shard.'},mechanic:{id:'prism-timing',label:'Prism timing',cue:'Follow the bright shard',detail:'Crystal flashes mark a deliberate slalom.'},props:['prism spires','shard clusters','glimmer stones'],traversal:'Prism clusters pulse beside the active lane.',sky:'#899bd0',ground:'#354460',lighting:{sky:'#d9e9ff',ground:'#202b4c',hemi:1.68,sun:'#d9e9ff',sunPower:3.2},atmosphere:{motif:'crystals',color:'#c7efff',accent:'#b9a9ff',speed:.38,lift:.4,size:.1,opacity:.5}},
  {name:'Mooncap Grove',short:'Mooncap',landmark:'mooncap-ring',setPiece:{id:'firefly-camp',label:'Mooncap firefly camp',cue:'Fireflies gather around the quiet lane.'},mechanic:{id:'moonlit-weave',label:'Moonlit weave',cue:'Use the quiet gap',detail:'Mushroom shadows hide a calm lane, then a quick turn.'},props:['mooncap rings','spore lights','night stones'],traversal:'Spore lights lead the quiet lane before the turn.',sky:'#aaa1d4',ground:'#403a5d',lighting:{sky:'#d0d0ff',ground:'#191a36',hemi:1.56,sun:'#d8d0ff',sunPower:2.72},atmosphere:{motif:'spores',color:'#e6cfff',accent:'#8be5d1',speed:.58,lift:.32,size:.105,opacity:.46}},
];

// These are deliberately restrained color grades, not replacement area
// palettes. The renderer blends them at the start of each full destination
// pass, giving repeated landscapes a fresh morning/golden/sunset/starlit feel
// without reducing the contrast needed to read bones, hazards or the puppy.
export const WORLD_MOODS = Object.freeze([
  Object.freeze({id:'fresh',label:'Fresh morning',sky:'#fff2d3',ground:'#dbe8c7',sun:'#fff4d8',strength:.08}),
  Object.freeze({id:'golden',label:'Golden hour',sky:'#ffd5a8',ground:'#d8bd91',sun:'#ffe0ae',strength:.11}),
  Object.freeze({id:'sunset',label:'Peach sunset',sky:'#f1b0a8',ground:'#a27771',sun:'#ffd0b3',strength:.1}),
  Object.freeze({id:'starlit',label:'Starlit trail',sky:'#7d8fd0',ground:'#596488',sun:'#c8d6ff',strength:.12}),
]);

// Current prototype trails give each visual destination a small mechanical
// accent. These are deliberately built from the existing obstacle vocabulary
// so the game teaches one familiar move at a time while the scenery changes
// around it. Legacy trail versions never consult this table and retain their
// exact rows.
export const AREA_GAMEPLAY=[
  {id:'roots-and-canopy',label:'Roots + canopy',mechanic:'fern-weave',landmark:'firefly-tree',hazards:['branch','log','gate','branch'],safeLanes:[1,0,2],pickupOffset:0,
    patterns:[
      {id:'fern-weave',label:'Fern weave',boneOffsets:[0,1,2,1],safeShift:0,hazardOrder:['branch','log','branch','log'],cluster:true},
      {id:'canopy-breath',label:'Canopy breath',boneOffsets:[0,0,1,1],safeShift:1,hazardOrder:['log','branch','gate','log']},
      {id:'root-run',label:'Root run',boneOffsets:[0,2,2,1],safeShift:2,hazardOrder:['branch','gate','log','branch']},
    ]},
  {id:'bamboo-zigzag',label:'Bamboo zigzag',mechanic:'lantern-slalom',landmark:'bamboo-lantern',hazards:['gate','branch','gate','log'],safeLanes:[0,2,1],pickupOffset:1,
    patterns:[
      {id:'bamboo-slalom',label:'Bamboo slalom',boneOffsets:[0,2,1,2],safeShift:1,hazardOrder:['gate','branch','gate','log'],cluster:true},
      {id:'lantern-line',label:'Lantern line',boneOffsets:[0,0,2,2],safeShift:2,hazardOrder:['branch','log','gate','branch']},
      {id:'reed-rhythm',label:'Reed rhythm',boneOffsets:[0,1,1,0],safeShift:0,hazardOrder:['log','gate','branch','gate']},
    ]},
  {id:'broken-ridge',label:'Broken ridge',mechanic:'ridge-hop',landmark:'redrock-stack',hazards:['rock','log','rock','arch'],safeLanes:[2,1,0],pickupOffset:2,
    patterns:[
      {id:'ridge-hop',label:'Ridge hop',boneOffsets:[0,1,2,1],safeShift:2,hazardOrder:['rock','log','rock','arch'],cluster:true},
      {id:'dust-stagger',label:'Dust stagger',boneOffsets:[0,2,2,0],safeShift:0,hazardOrder:['log','rock','arch','rock']},
      {id:'canyon-rest',label:'Canyon rest',boneOffsets:[0,0,1,1],safeShift:1,hazardOrder:['arch','rock','log','rock']},
    ]},
  {id:'oasis-stepping-stones',label:'Oasis stepping stones',mechanic:'stone-hop',landmark:'oasis-palms',hazards:['rock','branch','log','rock'],safeLanes:[1,2,0],pickupOffset:3,
    patterns:[
      {id:'stone-hop',label:'Stone hop',boneOffsets:[0,2,1,2],safeShift:0,hazardOrder:['rock','branch','log','rock'],cluster:true},
      {id:'palm-sway',label:'Palm sway',boneOffsets:[0,1,2,1],safeShift:2,hazardOrder:['branch','log','rock','branch']},
      {id:'water-break',label:'Water break',boneOffsets:[0,0,0,1],safeShift:1,hazardOrder:['log','rock','branch','log']},
    ]},
  {id:'crystal-slalom',label:'Crystal slalom',mechanic:'prism-timing',landmark:'crystal-spires',hazards:['rock','gate','rock','branch'],safeLanes:[0,1,2],pickupOffset:4,
    patterns:[
      {id:'prism-weave',label:'Prism weave',boneOffsets:[0,1,2,1],safeShift:1,hazardOrder:['rock','gate','rock','branch'],cluster:true},
      {id:'shard-stagger',label:'Shard stagger',boneOffsets:[0,2,2,1],safeShift:2,hazardOrder:['gate','rock','branch','rock']},
      {id:'glimmer-line',label:'Glimmer line',boneOffsets:[0,0,1,0],safeShift:0,hazardOrder:['branch','rock','gate','rock']},
    ]},
  {id:'moonlit-canopy',label:'Moonlit canopy',mechanic:'moonlit-weave',landmark:'mooncap-ring',hazards:['arch','branch','gate','rock'],safeLanes:[2,0,1],pickupOffset:5,
    patterns:[
      {id:'moon-weave',label:'Moon weave',boneOffsets:[0,2,1,2],safeShift:2,hazardOrder:['arch','branch','gate','rock'],cluster:true},
      {id:'mushroom-stagger',label:'Mushroom stagger',boneOffsets:[0,1,1,0],safeShift:0,hazardOrder:['branch','gate','rock','arch']},
      {id:'night-breath',label:'Night breath',boneOffsets:[0,0,2,2],safeShift:1,hazardOrder:['gate','rock','arch','branch']},
    ]},
];
export function areaAt(distance){return Math.floor(Math.max(0,distance)/AREA_LENGTH)%AREAS.length;}
export function areaGameplayAt(distance){return AREA_GAMEPLAY[areaAt(distance)];}

export function worldMoodAt(distance=0){
  const d=Number.isFinite(distance)?Math.max(0,distance):0;
  const cycle=Math.floor(d/WORLD_PASS_LENGTH);
  const index=cycle%WORLD_MOODS.length;
  const previous=cycle>0?(index+WORLD_MOODS.length-1)%WORLD_MOODS.length:index;
  const progress=cycle===0?1:Math.min(1,(d%WORLD_PASS_LENGTH)/64);
  const blend=progress*progress*(3-2*progress);
  return {index,previous,blend,cycle};
}
// Keep the destination identity in one small, read-only sampler so the HUD,
// director and future accessibility surfaces describe the same mechanic as
// the scenery. This is metadata only: object timing and collision streams do
// not consult it, so replay links remain deterministic.
export function areaSignatureAt(distance=0){
  const index=areaAt(distance);
  const area=AREAS[index];
  const profile=AREA_GAMEPLAY[index];
  return {
    index,
    name:area.name,
    short:area.short,
    landmark:area.landmark,
    setPiece:area.setPiece,
    mechanic:area.mechanic,
    props:area.props,
    traversal:area.traversal,
    rhythm:profile.label,
  };
}
export function areaBlend(distance){
  const d=Math.max(0,distance),index=areaAt(d),t=Math.min(1,d%AREA_LENGTH/45);
  return {index,previous:d<AREA_LENGTH?0:(index+AREAS.length-1)%AREAS.length,blend:t*t*(3-2*t)};
}

// Small, deterministic motion for destination landmarks.  The renderer uses
// this only on decorative leaves, fronds and mushroom caps; gameplay geometry
// never consults it.  Keeping the range deliberately tight preserves the
// silhouette and avoids making the scene feel noisy on a phone.
export function landmarkSway(time=0,offset=0,area=0,reducedMotion=false){
  if(reducedMotion)return {rotation:0,lift:0,scale:1};
  const t=Number.isFinite(time)?time:0;
  const phase=Number.isFinite(offset)?offset:0;
  const destination=Number.isFinite(area)?Math.abs(area):0;
  const speed=.62+(destination%3)*.09;
  return {
    rotation:Math.sin(t*speed+phase*.13)*(.018+(destination%2)*.006),
    lift:Math.sin(t*speed*.73+phase*.19)*.035,
    scale:1+Math.sin(t*speed*.61+phase*.11)*.014,
  };
}

// Break up long runs of repeated landmark batches without touching the
// playable corridor.  Decoration is recycled every 190m, so use the current
// pass through that batch plus its authored offset to choose a tiny, stable
// yaw and scale.  The values are intentionally smaller than landmarkSway:
// players should feel a richer place, not watch the world wobble.  This is a
// pure sampler and therefore safe to use in the renderer's hot path.
export function landmarkVariation(distance=0,offset=0,area=0,reducedMotion=false){
  if(reducedMotion)return {yaw:0,scale:1};
  const d=Number.isFinite(distance)?Math.max(0,distance):0;
  const phase=Number.isFinite(offset)?offset:0;
  const destination=Number.isFinite(area)?Math.abs(area):0;
  const cycle=Math.floor(d/190);
  const wobble=Math.sin(cycle*1.73+phase*.17+destination*.43);
  const counter=Math.cos(cycle*1.19+phase*.11+destination*.29);
  return {
    yaw:wobble*.026+counter*.006,
    scale:1+wobble*.018,
  };
}
