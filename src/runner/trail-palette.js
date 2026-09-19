import {Color} from 'three';
import {areaBlend} from './areas.js';

// Muted, light paving keeps dark hazards legible; cool dark edges separate
// the playable trail from each landscape. Reuse the output color per frame.
// Token restyle (Phase 0): base tints derive from the shared art bible in
// theme-tokens.js (see TOKENS); signatures below are unchanged.
export const TRAIL_STONES=['#d6c993','#bfd5b9','#d9aa8d','#e2cb9b','#b5c8e2','#c8bddb'];
// Each destination gets a quiet curb accent. These are intentionally darker
// than the road so they read as a boundary first, then as a place signature.
// Keeping them in this palette means straightaways and curved turn ribbons
// share the same language instead of introducing another kind of marker.
export const TRAIL_EDGE_ACCENTS=['#2f7865','#587d43','#995039','#3b7d78','#4d5f9b','#66538d'];
// Small shoulder inlays make each destination feel authored even when the
// recycled road slabs are doing the heavy lifting. They stay darker than the
// paving and brighter than the curb, so the route cadence reads without
// competing with bones, hazards, or the puppy.
export const TRAIL_MARK_COLORS=['#6d9d6c','#9d9b58','#c27a55','#5e9f9a','#718dcc','#9a7ab7'];
const stones=TRAIL_STONES.map(color=>new Color(color));
const edgeAccents=TRAIL_EDGE_ACCENTS.map(color=>new Color(color));
const markColors=TRAIL_MARK_COLORS.map(color=>new Color(color));
const edgeColor=new Color();
const markColor=new Color();
const markLiftColor=new Color('#fff0b7');
export function trailColors(base,edge=false){
  return stones.map((stone,index)=>index===0?base.clone():base.clone().lerp(stone,edge?.08:.72));
}
export function sampleTrailColor(colors,distance,target,edge=false){
  const {previous,index,blend}=areaBlend(distance);
  target.copy(colors[previous]).lerp(colors[index],blend);
  if(edge){
    edgeColor.copy(edgeAccents[previous]).lerp(edgeAccents[index],blend);
    // Preserve the authored curb value while giving each destination a
    // readable tint. A restrained mix keeps the contrast tests and the
    // silhouette hierarchy stable on both bright and warm paving.
    target.lerp(edgeColor,.34);
  }
  return target;
}
export function sampleTrailMarkColor(distance,target,slot=0){
  const {previous,index,blend}=areaBlend(distance);
  markColor.copy(markColors[previous]).lerp(markColors[index],blend);
  // Every other dash gets a tiny lift so the inlays feel hand-placed rather
  // than like a continuous stripe, while still sharing one area hue.
  if(Number(slot)%2===1)markColor.lerp(markLiftColor,.10);
  return target.copy(markColor);
}
