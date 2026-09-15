// Two visual destinations within each mastery region. World generation and
// passport keys still use the original three regions.
export const AREA_LENGTH=225;
export const AREAS=[
  // Clearer value separation keeps the warm road, dark hazards and pale
  // pickups readable as each destination fades into the next one.
  // Each destination also gets a restrained atmospheric motif. The renderer
  // keeps these outside the playable corridor, so they add place identity
  // without turning the lane into visual noise on a small screen.
  {name:'Sunleaf Woods',short:'Sunleaf',sky:'#c5eee3',ground:'#1f5642',atmosphere:{motif:'fireflies',color:'#fff0a6',accent:'#a9e8bd',speed:.62,lift:.34,size:.085,opacity:.56}},
  {name:'Bamboo Sanctuary',short:'Bamboo',sky:'#e3f2ce',ground:'#34502f',atmosphere:{motif:'leaves',color:'#c9e98b',accent:'#78b870',speed:.86,lift:.26,size:.12,opacity:.42}},
  {name:'Redrock Pass',short:'Redrock',sky:'#f7c18f',ground:'#8f4c32',atmosphere:{motif:'dust',color:'#ffd18e',accent:'#f29b70',speed:1.08,lift:.18,size:.095,opacity:.34}},
  {name:'Palm Oasis',short:'Oasis',sky:'#d8f1e8',ground:'#8d6b39',atmosphere:{motif:'sparkles',color:'#fff3bd',accent:'#b8ead3',speed:.46,lift:.3,size:.09,opacity:.5}},
  {name:'Crystal Reach',short:'Crystal',sky:'#899bd0',ground:'#354460',atmosphere:{motif:'crystals',color:'#c7efff',accent:'#b9a9ff',speed:.38,lift:.4,size:.1,opacity:.5}},
  {name:'Mooncap Grove',short:'Mooncap',sky:'#aaa1d4',ground:'#403a5d',atmosphere:{motif:'spores',color:'#e6cfff',accent:'#8be5d1',speed:.58,lift:.32,size:.105,opacity:.46}},
];

// Version 4 gives each visual destination a small mechanical accent. These
// are deliberately built from the existing obstacle vocabulary so the game
// teaches one familiar move at a time while the scenery changes around it.
// Legacy trail versions never consult this table and retain their exact rows.
export const AREA_GAMEPLAY=[
  {id:'roots-and-canopy',label:'Roots + canopy',hazards:['branch','log','branch','log'],safeLanes:[1,0,2],pickupOffset:0},
  {id:'bamboo-zigzag',label:'Bamboo zigzag',hazards:['gate','branch','gate','log'],safeLanes:[0,2,1],pickupOffset:1},
  {id:'broken-ridge',label:'Broken ridge',hazards:['rock','log','rock','arch'],safeLanes:[2,1,0],pickupOffset:2},
  {id:'oasis-stepping-stones',label:'Oasis stepping stones',hazards:['rock','branch','log','rock'],safeLanes:[1,2,0],pickupOffset:3},
  {id:'crystal-slalom',label:'Crystal slalom',hazards:['rock','gate','rock','branch'],safeLanes:[0,1,2],pickupOffset:4},
  {id:'moonlit-canopy',label:'Moonlit canopy',hazards:['arch','branch','gate','rock'],safeLanes:[2,0,1],pickupOffset:5},
];
export function areaAt(distance){return Math.floor(Math.max(0,distance)/AREA_LENGTH)%AREAS.length;}
export function areaGameplayAt(distance){return AREA_GAMEPLAY[areaAt(distance)];}
export function areaBlend(distance){
  const d=Math.max(0,distance),index=areaAt(d),t=Math.min(1,d%AREA_LENGTH/45);
  return {index,previous:d<AREA_LENGTH?0:(index+AREAS.length-1)%AREAS.length,blend:t*t*(3-2*t)};
}
