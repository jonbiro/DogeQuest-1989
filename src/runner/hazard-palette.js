import {areaAt} from './areas.js';

// Architectural stone follows its world location, never the moving camera.
// Clearance marks and shadow bands deliberately retain their universal colors.
const SOURCE=['154052','175c70','78a89a','8fa98f','293e49','77996b'];
export const HAZARD_PALETTES=[
  ['#154052','#175c70','#78a89a','#8fa98f','#293e49','#77996b'],
  ['#294737','#355b43','#9aa879','#9eac88','#344a38','#8b9d65'],
  ['#623a30','#794633','#c49369','#c09a78','#613e34','#ba8864'],
  ['#514531','#65563b','#b9ab79','#b6aa87','#514936','#aaa16f'],
  ['#344363','#42547b','#94adca','#96a9c1','#3b4665','#8c9cba'],
  ['#493957','#604976','#b49ac0','#b2a0bd','#4e405b','#a28aae'],
];

export function themeHazard(item,type,distance,materialFor){
  if(!['rock','arch','gate'].includes(type))return;
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
