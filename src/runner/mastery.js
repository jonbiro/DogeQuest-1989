import {PUPPIES} from './collection.js';
import {REGIONS} from './regions.js';

export const DOG_TIERS = [
  {target:10,name:'Trail friend',points:150},
  {target:40,name:'Adventure partner',points:350},
  {target:100,name:'Trail legend',points:700},
];
export const REGION_TIERS = [
  {target:3,name:'Bronze trail stamp',points:200},
  {target:10,name:'Silver trail stamp',points:500},
  {target:25,name:'Gold trail stamp',points:1000},
];
const count = value => Number.isFinite(value) ? Math.min(1e9,Math.max(0,Math.floor(value))) : 0;

export function masteryFrom(value) {
  return {
    dogs:Object.fromEntries(Object.keys(PUPPIES).map(id=>[id,count(value?.dogs?.[id])])),
    regions:REGIONS.map((_,i)=>count(value?.regions?.[i])),
  };
}

export function masteryCards(value) {
  const mastery=masteryFrom(value);
  return [
    ...Object.entries(PUPPIES).map(([id,dog])=>({id:`dog-${id}`,name:dog.name,
      current:mastery.dogs[id],unit:'clean clears + correct turns',tiers:DOG_TIERS})),
    ...REGIONS.map((region,i)=>({id:`region-${i}`,name:region.name,
      current:mastery.regions[i],unit:'clean regional courses',tiers:REGION_TIERS})),
  ];
}

// Called only by the one-shot completed-run transaction. Counters are the
// entitlement record: crossing a threshold pays once, never again on reload.
export function bankMastery(profile,run) {
  if (!run.ended || run.masteryReceipt) return run.masteryReceipt || {earned:[],points:0};
  const before=masteryCards(profile.mastery);
  const mastery=masteryFrom(profile.mastery);
  if (Object.hasOwn(PUPPIES,run.puppy))
    mastery.dogs[run.puppy]=count(mastery.dogs[run.puppy]+count(run.clears)+count(run.turns));
  mastery.regions=mastery.regions.map((value,i)=>count(value+count(run.regionalCourses?.[i])));
  profile.mastery=mastery;
  const earned=[];
  for (const [i,card] of masteryCards(mastery).entries())
    for(const tier of card.tiers)
      if(before[i].current<tier.target && card.current>=tier.target)
        earned.push({id:`${card.id}-${tier.target}`,name:`${card.name} · ${tier.name}`,points:tier.points});
  const points=earned.reduce((sum,badge)=>sum+badge.points,0);
  profile.credits+=points;
  run.masteryReceipt={earned,points};
  return run.masteryReceipt;
}
