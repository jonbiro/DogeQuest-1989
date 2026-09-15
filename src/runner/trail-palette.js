import {Color} from 'three';
import {areaBlend} from './areas.js';

// Muted, light paving keeps dark hazards legible; cool dark edges separate
// the playable trail from each landscape. Reuse the output color per frame.
export const TRAIL_STONES=['#d6c993','#bfd5b9','#d9aa8d','#e2cb9b','#b5c8e2','#c8bddb'];
const stones=TRAIL_STONES.map(color=>new Color(color));
export function trailColors(base,edge=false){
  return stones.map((stone,index)=>index===0?base.clone():base.clone().lerp(stone,edge?.08:.72));
}
export function sampleTrailColor(colors,distance,target){
  const {previous,index,blend}=areaBlend(distance);
  return target.copy(colors[previous]).lerp(colors[index],blend);
}
