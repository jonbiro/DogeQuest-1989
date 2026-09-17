export const REGION_LENGTH = 450;
export const REGIONS = [
  {name:"Whispering Jungle",sky:"#c4ebe0",ground:"#205a4a",stone:"#d7cc95"},
  {name:"Biscuit Canyon",sky:"#f6bf96",ground:"#8f4e35",stone:"#e3b885"},
  {name:"Moonpaw Glade",sky:"#879bd0",ground:"#354666",stone:"#b4d3dc"},
];
export function regionAt(distance) {
  return Math.floor(Math.max(0,distance)/REGION_LENGTH)%REGIONS.length;
}
export function regionBlend(distance) {
  const d=Math.max(0,distance),index=regionAt(d);
  const progress=Math.min(1,(d%REGION_LENGTH)/65);
  return {index,previous:d<REGION_LENGTH?0:(index+REGIONS.length-1)%REGIONS.length,blend:progress*progress*(3-2*progress)};
}

const HORIZONS = [
  {width:1.18,height:.78,haze:.24}, // broad jungle ridges
  {width:.94,height:1.08,haze:.20}, // stronger canyon walls
  {width:.72,height:1.32,haze:.30}, // slender glade peaks
];
export function horizonProfile(distance, target = {}) {
  const {previous,index,blend}=regionBlend(distance);
  const a=HORIZONS[previous],b=HORIZONS[index];
  target.width=a.width+(b.width-a.width)*blend;
  target.height=a.height+(b.height-a.height)*blend;
  target.haze=a.haze+(b.haze-a.haze)*blend;
  return target;
}
