// Two visual destinations within each mastery region. World generation and
// passport keys still use the original three regions.
export const AREA_LENGTH=225;
export const AREAS=[
  {name:'Sunleaf Woods',sky:'#b3ded4',ground:'#28664d'},
  {name:'Bamboo Sanctuary',sky:'#d0e8c1',ground:'#405e3a'},
  {name:'Redrock Pass',sky:'#f1c39f',ground:'#a45e3d'},
  {name:'Palm Oasis',sky:'#bce3df',ground:'#ad8c58'},
  {name:'Crystal Reach',sky:'#929fc9',ground:'#48556e'},
  {name:'Mooncap Grove',sky:'#b5a9d1',ground:'#575277'},
];
export function areaAt(distance){return Math.floor(Math.max(0,distance)/AREA_LENGTH)%AREAS.length;}
export function areaBlend(distance){
  const d=Math.max(0,distance),index=areaAt(d),t=Math.min(1,d%AREA_LENGTH/45);
  return {index,previous:d<AREA_LENGTH?0:(index+AREAS.length-1)%AREAS.length,blend:t*t*(3-2*t)};
}
