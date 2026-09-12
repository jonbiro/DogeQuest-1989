// Version the layout contract so future generators can reject incompatible links.
import {CURRENT_TRAIL_VERSION} from './trail-version.js';
export function readTrailSeed(search) {
  const values=new globalThis.URLSearchParams(search).getAll('trail');
  if(values.length!==1||!/^[12]-[0-9a-z]{1,7}$/.test(values[0]))return null;
  const code=values[0].slice(2),seed=Number.parseInt(code,36);
  return seed<=0xffffffff&&seed.toString(36)===code?seed:null;
}
export function readTrailVersion(search) {
  return readTrailSeed(search)===null?null:Number(new globalThis.URLSearchParams(search).get('trail')[0]);
}
export function trailLink(href,seed,version=CURRENT_TRAIL_VERSION) {
  const url=new globalThis.URL(href);
  if(!['https:','http:'].includes(url.protocol)||!Number.isSafeInteger(seed)||![1,CURRENT_TRAIL_VERSION].includes(version))return '';
  url.search='';url.hash='';
  url.searchParams.set('trail',`${version}-${(seed>>>0).toString(36)}`);
  return url.href;
}
