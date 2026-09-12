// Version the layout contract so future generators can reject incompatible links.
export function readTrailSeed(search) {
  const values=new globalThis.URLSearchParams(search).getAll('trail');
  if(values.length!==1||!/^1-[0-9a-z]{1,7}$/.test(values[0]))return null;
  const code=values[0].slice(2),seed=Number.parseInt(code,36);
  return seed<=0xffffffff&&seed.toString(36)===code?seed:null;
}
export function trailLink(href,seed) {
  const url=new globalThis.URL(href);
  if(!['https:','http:'].includes(url.protocol)||!Number.isSafeInteger(seed))return '';
  url.search='';url.hash='';
  url.searchParams.set('trail',`1-${(seed>>>0).toString(36)}`);
  return url.href;
}
