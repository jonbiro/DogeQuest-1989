export function dailySeed(timestamp){
  return (Math.floor(timestamp/86400000)^0x0b15c017)>>>0;
}
