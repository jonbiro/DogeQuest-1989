import {supportsTrailVersion} from './trail-version.js';

// Most recently played trails first. Local records are not ranked results.
export function trailRecordsFrom(value){
  const records=[];
  if(!Array.isArray(value))return records;
  for(const item of value.slice(0,64)){
    if(!item||!Number.isInteger(item.seed)||item.seed<0||item.seed>0xffffffff||
      !supportsTrailVersion(item.version)||!Number.isSafeInteger(item.best)||item.best<0)continue;
    const existing=records.find(r=>r.seed===item.seed&&r.version===item.version);
    if(existing)existing.best=Math.max(existing.best,item.best);
    else if(records.length<32)records.push({seed:item.seed,version:item.version,best:item.best});
  }
  return records;
}
export function trailBest(records,seed,version){
  return trailRecordsFrom(records).find(r=>r.seed===seed&&r.version===version)?.best||0;
}
export function bankTrailRecord(profile,run){
  if(!run.ended||run.practice)return;
  const records=trailRecordsFrom(profile.trailRecords);
  const best=Math.max(trailBest(records,run.seed,run.generatorVersion),Math.floor(run.score));
  profile.trailRecords=trailRecordsFrom([{seed:run.seed,version:run.generatorVersion,best},
    ...records.filter(r=>r.seed!==run.seed||r.version!==run.generatorVersion)]);
}
