// Two visual destinations within each mastery region. World generation and
// passport keys still use the original three regions.
export const AREA_LENGTH=225;
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
  {name:'Sunleaf Woods',short:'Sunleaf',landmark:'firefly-tree',sky:'#c5eee3',ground:'#1f5642',atmosphere:{motif:'fireflies',color:'#fff0a6',accent:'#a9e8bd',speed:.62,lift:.34,size:.085,opacity:.56}},
  {name:'Bamboo Sanctuary',short:'Bamboo',landmark:'bamboo-lantern',sky:'#e3f2ce',ground:'#34502f',atmosphere:{motif:'leaves',color:'#c9e98b',accent:'#78b870',speed:.86,lift:.26,size:.12,opacity:.42}},
  {name:'Redrock Pass',short:'Redrock',landmark:'redrock-stack',sky:'#f7c18f',ground:'#8f4c32',atmosphere:{motif:'dust',color:'#ffd18e',accent:'#f29b70',speed:1.08,lift:.18,size:.095,opacity:.34}},
  {name:'Palm Oasis',short:'Oasis',landmark:'oasis-palms',sky:'#d8f1e8',ground:'#8d6b39',atmosphere:{motif:'sparkles',color:'#fff3bd',accent:'#b8ead3',speed:.46,lift:.3,size:.09,opacity:.5}},
  {name:'Crystal Reach',short:'Crystal',landmark:'crystal-spires',sky:'#899bd0',ground:'#354460',atmosphere:{motif:'crystals',color:'#c7efff',accent:'#b9a9ff',speed:.38,lift:.4,size:.1,opacity:.5}},
  {name:'Mooncap Grove',short:'Mooncap',landmark:'mooncap-ring',sky:'#aaa1d4',ground:'#403a5d',atmosphere:{motif:'spores',color:'#e6cfff',accent:'#8be5d1',speed:.58,lift:.32,size:.105,opacity:.46}},
];

// Version 4 gives each visual destination a small mechanical accent. These
// are deliberately built from the existing obstacle vocabulary so the game
// teaches one familiar move at a time while the scenery changes around it.
// Legacy trail versions never consult this table and retain their exact rows.
export const AREA_GAMEPLAY=[
  {id:'roots-and-canopy',label:'Roots + canopy',landmark:'firefly-tree',hazards:['branch','log','gate','branch'],safeLanes:[1,0,2],pickupOffset:0,
    patterns:[
      {id:'fern-weave',label:'Fern weave',boneOffsets:[0,1,2,1],safeShift:0,hazardOrder:['branch','log','branch','log'],cluster:true},
      {id:'canopy-breath',label:'Canopy breath',boneOffsets:[0,0,1,1],safeShift:1,hazardOrder:['log','branch','gate','log']},
      {id:'root-run',label:'Root run',boneOffsets:[0,2,2,1],safeShift:2,hazardOrder:['branch','gate','log','branch']},
    ]},
  {id:'bamboo-zigzag',label:'Bamboo zigzag',landmark:'bamboo-lantern',hazards:['gate','branch','gate','log'],safeLanes:[0,2,1],pickupOffset:1,
    patterns:[
      {id:'bamboo-slalom',label:'Bamboo slalom',boneOffsets:[0,2,1,2],safeShift:1,hazardOrder:['gate','branch','gate','log'],cluster:true},
      {id:'lantern-line',label:'Lantern line',boneOffsets:[0,0,2,2],safeShift:2,hazardOrder:['branch','log','gate','branch']},
      {id:'reed-rhythm',label:'Reed rhythm',boneOffsets:[0,1,1,0],safeShift:0,hazardOrder:['log','gate','branch','gate']},
    ]},
  {id:'broken-ridge',label:'Broken ridge',landmark:'redrock-stack',hazards:['rock','log','rock','arch'],safeLanes:[2,1,0],pickupOffset:2,
    patterns:[
      {id:'ridge-hop',label:'Ridge hop',boneOffsets:[0,1,2,1],safeShift:2,hazardOrder:['rock','log','rock','arch'],cluster:true},
      {id:'dust-stagger',label:'Dust stagger',boneOffsets:[0,2,2,0],safeShift:0,hazardOrder:['log','rock','arch','rock']},
      {id:'canyon-rest',label:'Canyon rest',boneOffsets:[0,0,1,1],safeShift:1,hazardOrder:['arch','rock','log','rock']},
    ]},
  {id:'oasis-stepping-stones',label:'Oasis stepping stones',landmark:'oasis-palms',hazards:['rock','branch','log','rock'],safeLanes:[1,2,0],pickupOffset:3,
    patterns:[
      {id:'stone-hop',label:'Stone hop',boneOffsets:[0,2,1,2],safeShift:0,hazardOrder:['rock','branch','log','rock'],cluster:true},
      {id:'palm-sway',label:'Palm sway',boneOffsets:[0,1,2,1],safeShift:2,hazardOrder:['branch','log','rock','branch']},
      {id:'water-break',label:'Water break',boneOffsets:[0,0,0,1],safeShift:1,hazardOrder:['log','rock','branch','log']},
    ]},
  {id:'crystal-slalom',label:'Crystal slalom',landmark:'crystal-spires',hazards:['rock','gate','rock','branch'],safeLanes:[0,1,2],pickupOffset:4,
    patterns:[
      {id:'prism-weave',label:'Prism weave',boneOffsets:[0,1,2,1],safeShift:1,hazardOrder:['rock','gate','rock','branch'],cluster:true},
      {id:'shard-stagger',label:'Shard stagger',boneOffsets:[0,2,2,1],safeShift:2,hazardOrder:['gate','rock','branch','rock']},
      {id:'glimmer-line',label:'Glimmer line',boneOffsets:[0,0,1,0],safeShift:0,hazardOrder:['branch','rock','gate','rock']},
    ]},
  {id:'moonlit-canopy',label:'Moonlit canopy',landmark:'mooncap-ring',hazards:['arch','branch','gate','rock'],safeLanes:[2,0,1],pickupOffset:5,
    patterns:[
      {id:'moon-weave',label:'Moon weave',boneOffsets:[0,2,1,2],safeShift:2,hazardOrder:['arch','branch','gate','rock'],cluster:true},
      {id:'mushroom-stagger',label:'Mushroom stagger',boneOffsets:[0,1,1,0],safeShift:0,hazardOrder:['branch','gate','rock','arch']},
      {id:'night-breath',label:'Night breath',boneOffsets:[0,0,2,2],safeShift:1,hazardOrder:['gate','rock','arch','branch']},
    ]},
];
export function areaAt(distance){return Math.floor(Math.max(0,distance)/AREA_LENGTH)%AREAS.length;}
export function areaGameplayAt(distance){return AREA_GAMEPLAY[areaAt(distance)];}
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
