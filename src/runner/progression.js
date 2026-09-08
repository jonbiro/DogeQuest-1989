export const UPGRADES = {
  leap: {
    name: "Spring paws",
    description: "Jump higher without staying airborne longer. +10% clearance per level.",
  },
  slide: {
    name: "Silky slides",
    description: "Stay low a little longer. +0.07 seconds per level.",
  },
  magnet: {
    name: "Super sniffer",
    description: "Magnets last +3 seconds per level.",
  },
  value: {
    name: "Golden touch",
    description: "Bones earn +5 points per level.",
  },
};
export function levels(value = {}) {
  return Object.fromEntries(
    Object.keys(UPGRADES).map((key) => [
      key,
      Math.min(3, Math.max(0, Math.floor(Number(value?.[key]) || 0))),
    ]),
  );
}
export function price(level) {
  return [500, 1000, 1800][level] ?? null;
}
export function purchase(profile, key) {
  if (!Object.hasOwn(UPGRADES, key)) return false;
  const cost = price(profile.upgrades[key]);
  if (cost === null || profile.credits < cost) return false;
  profile.credits -= cost;
  profile.upgrades[key]++;
  return true;
}
