// Cosmetic surface contact only; never changes the gap collision window.
export function contactShadow(height, distance, gaps) {
  const scale=Math.max(.45,1-height*.12);
  let surface=1;
  for(const gap of gaps) {
    // A road slab is 5m long. Fade across the shadow's half-length before
    // its center reaches the missing slab, rather than snapping at the lip.
    const edge=Math.max(0,Math.min(1,(Math.abs(distance-gap.at)-2.5)/1.25));
    surface=Math.min(surface,edge*edge*(3-2*edge));
  }
  return {scale,opacity:.46/(1+height*.3)*surface};
}
