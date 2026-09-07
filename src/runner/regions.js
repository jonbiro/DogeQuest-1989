export const REGION_LENGTH = 450;
export const REGIONS = [
  {name:"Whispering Jungle",sky:"#8ec5aa",ground:"#397d6e",stone:"#c8c194"},
  {name:"Biscuit Canyon",sky:"#efbb91",ground:"#b87851",stone:"#dbb188"},
  {name:"Moonpaw Glade",sky:"#647997",ground:"#405b76",stone:"#a5becb"},
];
export function regionAt(distance) {
  return Math.floor(Math.max(0,distance)/REGION_LENGTH)%REGIONS.length;
}
export function regionBlend(distance) {
  const d=Math.max(0,distance),index=regionAt(d);
  const progress=Math.min(1,(d%REGION_LENGTH)/65);
  return {index,previous:d<REGION_LENGTH?0:(index+REGIONS.length-1)%REGIONS.length,blend:progress*progress*(3-2*progress)};
}
