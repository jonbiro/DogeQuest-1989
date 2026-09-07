// A continuous centerline, viewed in the runner's local tangent frame.
export function centerline(s) {
  return 26 * Math.sin(s / 52 + 0.8) + 34 * Math.sin(s / 117);
}
export function tangent(s) {
  return (26 / 52) * Math.cos(s / 52 + 0.8) + (34 / 117) * Math.cos(s / 117);
}
export function routeOffset(distance, z) {
  const ahead = -z;
  return (
    centerline(distance + ahead) -
    centerline(distance) -
    ahead * tangent(distance)
  );
}
export function routeHeading(distance, z) {
  return -Math.atan(tangent(distance - z) - tangent(distance));
}
