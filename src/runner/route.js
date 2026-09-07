// A continuous centerline, viewed in the runner's local tangent frame.
export function centerline(s) {
  return 18 * Math.sin(s / 64) + 28 * Math.sin(s / 143);
}
export function tangent(s) {
  return (18 / 64) * Math.cos(s / 64) + (28 / 143) * Math.cos(s / 143);
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
