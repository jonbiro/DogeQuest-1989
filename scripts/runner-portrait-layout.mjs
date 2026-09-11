// Shared acceptance rule for the primary phone orientation.
export function portraitControlIssues(rects,{width,height,safeBottom=0}) {
  if(width>700||width>height)return [];
  const issues=[];
  if(rects.length!==5)return ['Portrait requires five fallback controls'];
  const first=rects[0];
  for(const [index,r] of rects.entries()) {
    if(r.width<44||r.height<60)issues.push(`Portrait control ${index} is too small`);
    if(Math.abs(r.width-first.width)>1||Math.abs(r.top-first.top)>1)
      issues.push(`Portrait control ${index} is not in the equal thumb row`);
    if(r.bottom>height-safeBottom-12||r.left<0||r.right>width)
      issues.push(`Portrait control ${index} lacks safe-area clearance`);
    if(index&&r.left<rects[index-1].right+6)
      issues.push(`Portrait control ${index} lacks separation`);
  }
  return issues;
}
