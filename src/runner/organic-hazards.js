import {areaAt} from './areas.js';

const SOURCE=['683a20','e4ba7a','9b6636','ad7b43','3f291b','493526','6c4b2e','4e744f'];
// Bark, cut ends, rings, ridge, groove, supports, limbs, foliage.
export const ORGANIC_PALETTES=[
  ['#683a20','#e4ba7a','#9b6636','#ad7b43','#3f291b','#493526','#6c4b2e','#4e744f'],
  ['#5b4822','#eee2b0','#75894e','#d6c38d','#273921','#30462a','#8b7943','#73945b'],
  ['#743e29','#edbd88','#a7623d','#c08858','#402a22','#55372a','#875137','#938058'],
  ['#71583b','#ead3a0','#9d8156','#bca36f','#403527','#56462f','#89704b','#78936a'],
  ['#435366','#dce8eb','#627988','#cedee0','#293541','#384654','#a6bbc3','#91adb5'],
  ['#59435f','#e9d7df','#79587d','#d5bacc','#352a3e','#45334b','#b399b0','#8d90a7'],
];
const LIMBS=[
  [[1.74,-.1],[1.78,.08],[1.73,-.08]],
  [[1.72,0],[1.72,0],[1.72,0]],
  [[1.75,-.12],[1.86,-.04],[1.82,.08]],
  [[1.83,-.08],[1.72,0],[1.83,.08]],
  [[1.8,-.04],[1.92,0],[1.8,.04]],
  [[1.76,-.12],[1.88,.06],[1.78,.1]],
];

export function themeOrganicHazard(item,type,distance,materialFor){
  if(type!=='log'&&type!=='branch')return;
  const area=areaAt(distance);
  if(item.userData.organicArea===area)return;
  let limb=0;
  item.traverse(part=>{
    if(!part.isMesh)return;
    const source=part.userData.organicSource??part.material.color.getHexString();
    part.userData.organicSource=source;
    const index=SOURCE.indexOf(source);
    if(index!==-1)part.material=materialFor(ORGANIC_PALETTES[area][index]);
    if(type==='branch'&&part.name==='branch-limb'){
      const profile=LIMBS[area][limb++];
      part.position.y=profile[0];part.rotation.z=profile[1];
    }
  });
  item.userData.organicArea=area;
}
