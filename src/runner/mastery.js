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
export const RIDE_TIERS = [
  {target:1,name:'First crossing',points:200},
  {target:10,name:'Seasoned explorer',points:600},
  {target:30,name:'Adventure expert',points:1200},
];
const RIDES={rafts:'River explorer',ziplines:'Sky explorer'};
const count = value => Number.isFinite(value) ? Math.min(1e9,Math.max(0,Math.floor(value))) : 0;

export function masteryFrom(value) {
  return {
    dogs:Object.fromEntries(Object.keys(PUPPIES).map(id=>[id,count(value?.dogs?.[id])])),
    regions:REGIONS.map((_,i)=>count(value?.regions?.[i])),
    rides:Object.fromEntries(Object.keys(RIDES).map(id=>[id,count(value?.rides?.[id])])),
  };
}

export function masteryCards(value) {
  const mastery=masteryFrom(value);
  return [
    ...Object.entries(PUPPIES).map(([id,dog])=>({id:`dog-${id}`,name:dog.name,
      current:mastery.dogs[id],unit:'clears + course weaves + correct turns',tiers:DOG_TIERS})),
    ...REGIONS.map((region,i)=>({id:`region-${i}`,name:region.name,
      current:mastery.regions[i],unit:'clean regional courses',tiers:REGION_TIERS,
      tip:'Choose Challenge for more regional courses. Clear all three beats; optional Scenic encounters do not earn stamps.'})),
    ...Object.entries(RIDES).map(([id,name])=>({id:`ride-${id}`,name,
      current:mastery.rides[id],unit:id==='rafts'?'completed river crossings':'completed cable rides',tiers:RIDE_TIERS,
      tip:id==='rafts'?'Reach the far shore. Steer around rocks; boarding is automatic. Practice never counts.'
        :'Jump to catch the handle and ride to the landing. Practice never counts.'})),
  ];
}

export function orderedMasteryCards(value,puppy) {
  const cards=masteryCards(value);
  const progress=card=>{
    const next=card.tiers.find(tier=>card.current<tier.target);
    return next?card.current/next.target:-1;
  };
  return cards.sort((a,b)=>progress(b)-progress(a)||
    Number(b.id===`dog-${puppy}`)-Number(a.id===`dog-${puppy}`));
}

export function nextMasteryHint(value,puppy) {
  const card=orderedMasteryCards(value,puppy)[0];
  const next=card.tiers.find(tier=>card.current<tier.target);
  if(!next)return 'Passport complete · every stamp collected';
  const remaining=next.target-card.current;
  const unit=card.id==='ride-rafts'?'river crossing':card.id==='ride-ziplines'?'cable ride'
    :card.id.startsWith('region-')?'clean course':'clear, weave or turn';
  const plural=unit==='clear, weave or turn'?'clears, weaves or turns':`${unit}s`;
  return `Next: ${card.name} · ${remaining} more ${remaining===1?unit:plural} for +${next.points} pts`;
}

// Called only by the one-shot completed-run transaction. Counters are the
// entitlement record: crossing a threshold pays once, never again on reload.
export function bankMastery(profile,run) {
  if (!run.ended || run.practice || run.masteryReceipt) return run.masteryReceipt || {earned:[],points:0};
  const before=masteryCards(profile.mastery);
  const mastery=masteryFrom(profile.mastery);
  if (Object.hasOwn(PUPPIES,run.puppy))
    mastery.dogs[run.puppy]=count(mastery.dogs[run.puppy]+count(run.clears)+count(run.weaves)+count(run.turns));
  mastery.regions=mastery.regions.map((value,i)=>count(value+count(run.regionalCourses?.[i])));
  for(const id of Object.keys(RIDES))mastery.rides[id]=count(mastery.rides[id]+count(run[id]));
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
