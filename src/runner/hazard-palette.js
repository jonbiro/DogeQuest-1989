import {areaAt} from './areas.js';
import {themeOrganicHazard} from './organic-hazards.js';

// Architectural stone follows its world location, never the moving camera.
// Clearance marks and shadow bands deliberately retain their universal colors.
const SOURCE=['154052','175c70','78a89a','8fa98f','293e49','77996b'];
export const HAZARD_PALETTES=[
  ['#154052','#175c70','#78a89a','#8fa98f','#293e49','#77996b'],
  ['#284536','#355b43','#9aa879','#9eac88','#344a38','#8b9d65'],
  ['#5a362c','#794633','#c49369','#c09a78','#613e34','#ba8864'],
  ['#483d2c','#65563b','#b9ab79','#b6aa87','#514936','#aaa16f'],
  ['#313f5d','#42547b','#94adca','#96a9c1','#3b4665','#8c9cba'],
  ['#483956','#604976','#b49ac0','#b2a0bd','#4e405b','#a28aae'],
];

// Relics use a brighter, collectible-specific triad so they read against the
// authored course while still inheriting each area's mood.
const RELIC_SOURCE=['efbf67','fff0b7','173b3e'];
export const RELIC_PALETTES=[
  ['#d8ef9a','#fff3bf','#214d43'],
  ['#9fe3b1','#efffd0','#1d4c47'],
  ['#efad70','#fff0c6','#5a302b'],
  ['#75d8d0','#fff1bd','#23494a'],
  ['#b7a8f0','#f4e8ff','#2f315c'],
  ['#e29ad0','#f8e5ff','#443154'],
];

function themeRelic(item,distance,materialFor){
  const area=areaAt(distance);
  if(item.userData.relicArea===area)return;
  item.traverse(part=>{
    if(!part.isMesh)return;
    const source=part.userData.relicSource??part.material.color.getHexString();
    part.userData.relicSource=source;
    const index=RELIC_SOURCE.indexOf(source);
    if(index!==-1)part.material=materialFor(RELIC_PALETTES[area][index]);
  });
  item.userData.relicArea=area;
}

export function themeHazard(item,type,distance,materialFor){
  if(type==='relic'){themeRelic(item,distance,materialFor);return;}
  if(type==='log'||type==='branch')return themeOrganicHazard(item,type,distance,materialFor);
  // Moving gates share the architectural palette with regular gates; their
  // sweep beacon remains a distinct warm accent supplied by the template.
  const paletteType = type === 'moving-gate' ? 'gate' : type;
  if(!['rock','arch','gate'].includes(paletteType))return;
  const area=areaAt(distance);
  if(item.userData.hazardArea===area)return;
  item.traverse(part=>{
    if(!part.isMesh)return;
    const source=part.userData.hazardSource??part.material.color.getHexString();
    part.userData.hazardSource=source;
    const index=SOURCE.indexOf(source);
    if(index!==-1)part.material=materialFor(HAZARD_PALETTES[area][index]);
  });
  item.userData.hazardArea=area;
}
