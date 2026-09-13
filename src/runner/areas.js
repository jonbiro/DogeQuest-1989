// Two visual destinations within each mastery region. World generation and
// passport keys still use the original three regions.
export const AREA_LENGTH=225;
export const AREAS=[
  {name:'Sunleaf Woods',short:'Sunleaf',sky:'#b3ded4',ground:'#28664d'},
  {name:'Bamboo Sanctuary',short:'Bamboo',sky:'#d0e8c1',ground:'#405e3a'},
  {name:'Redrock Pass',short:'Redrock',sky:'#f1c39f',ground:'#a45e3d'},
  {name:'Palm Oasis',short:'Oasis',sky:'#bce3df',ground:'#ad8c58'},
  {name:'Crystal Reach',short:'Crystal',sky:'#929fc9',ground:'#48556e'},
  {name:'Mooncap Grove',short:'Mooncap',sky:'#b5a9d1',ground:'#575277'},
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
