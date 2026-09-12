export const REGION_LENGTH = 450;
export const REGIONS = [
  {name:"Whispering Jungle",sky:"#b5dcd3",ground:"#286b59",stone:"#c8c194"},
  {name:"Biscuit Canyon",sky:"#f0c5a0",ground:"#a56546",stone:"#dbb188"},
  {name:"Moonpaw Glade",sky:"#879cbd",ground:"#354d70",stone:"#a5becb"},
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
  {width:1.18,height:.78,haze:.32}, // broad jungle ridges
  {width:.94,height:1.08,haze:.22}, // stronger canyon walls
  {width:.72,height:1.32,haze:.42}, // slender glade peaks
];
export function horizonProfile(distance, target = {}) {
  const {previous,index,blend}=regionBlend(distance);
  const a=HORIZONS[previous],b=HORIZONS[index];
  target.width=a.width+(b.width-a.width)*blend;
  target.height=a.height+(b.height-a.height)*blend;
  target.haze=a.haze+(b.haze-a.haze)*blend;
  return target;
}
