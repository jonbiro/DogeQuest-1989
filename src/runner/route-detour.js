const LENGTH=160, START=45, ROUTE_LENGTH=220;
function ease(value) {
  const t=Math.max(0,Math.min(1,value));
  return t*t*t*(t*(t*6-15)+10);
}
function valid(route) {
  return route && ['scenic','challenge'].includes(route.kind) && Number.isFinite(route.until);
}
// C2-continuous lateral excursion: straight at entry and rejoin, with no sudden
// steering demand. Station and obstacle timing remain in the same run coordinates.
export function routeDetour(station,route) {
  if(!valid(route))return {offset:0,slope:0,second:0};
  const t=(station-(route.until-ROUTE_LENGTH+START))/LENGTH;
  if(t<=0||t>=1)return {offset:0,slope:0,second:0};
  const amplitude=route.kind==='scenic'?-8:12;
  const rest=1-t;
  return {
    offset:amplitude*64*t*t*t*rest*rest*rest,
    slope:amplitude*192*t*t*rest*rest*(1-2*t)/LENGTH,
    second:amplitude*384*t*rest*(1-5*t+5*t*t)/(LENGTH*LENGTH),
  };
}
// Reveal distant selected road smoothly after the gate, completing before the
// puppy reaches the first bend. The road directly underfoot never morphs.
export function detourReveal(distance,route) {
  if(!valid(route))return 0;
  return ease((distance-(route.until-ROUTE_LENGTH))/40);
}

// Look farther into a selected bend without shrinking objects with a wider FOV.
// The blend begins/ends at the normal camera weight, avoiding a gate/rejoin snap.
export function detourCameraWeight(distance,route) {
  if(!valid(route))return .3;
  return .3+1.7*detourReveal(distance,route)*ease((route.until-distance)/40);
}
