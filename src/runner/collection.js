export const PUPPIES = {
  biscuit: { name:'Biscuit', breed:'Golden doodle pup', description:'Soft curls. Bigger courage.', cost:0, fur:'#d89043', head:'#f2c67b', muzzle:'#ffe0a1', paws:'#ffe3b1', ears:'floppy' },
  mochi: { name:'Mochi', breed:'Silver-curled pup', description:'Soft curls. A familiar little face.', cost:0, fur:'#555853', head:'#8d9187', muzzle:'#d2c09c', paws:'#c9b48d', ears:'floppy' },
  pepper: { name:'Pepper', breed:'Spotted puppy', description:'A little chaos. A coat full of spots.', cost:1500, fur:'#ecebe3', head:'#fffdf2', muzzle:'#e3dfcf', paws:'#f8f7ed', ears:'floppy', spots:true },
  // Luna's shipped paintings are also soft, floppy-eared curls; keep the
  // clubhouse copy aligned with what players actually see in the roster.
  luna: { name:'Luna', breed:'Moonlit doodle', description:'A cool silver curl with a moonlit stride.', cost:2500, fur:'#6b8190', head:'#8fa6b1', muzzle:'#eff1e6', paws:'#f4f2e5', ears:'floppy' },
};
// Roster growth signals skill, not just savings: Pepper asks for a Trail
// friend bond (10 clears with any pup) and Luna for an Adventure partner bond
// (40). Thresholds mirror DOG_TIERS in mastery.js; a test below pins them to
// those tiers so the two files cannot drift apart.
export const PUPPY_BOND_REQ = Object.freeze({pepper: 10, luna: 40});
export function puppyBondBest(profile) {
  const dogs = profile?.mastery?.dogs;
  if (!dogs || typeof dogs !== 'object') return 0;
  let best = 0;
  for (const value of Object.values(dogs)) {
    const count = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    if (count > best) best = count;
  }
  return best;
}
export function puppyBondLocked(profile, id) {
  const req = PUPPY_BOND_REQ[id] || 0;
  return req > 0 && puppyBondBest(profile) < req;
}
// Mochi is the face of the runner and the most familiar starter. Keep both
// starter puppies unlocked, but make a missing/invalid selection land on him
// so a fresh browser and older saves get the same welcoming first run.
export const DEFAULT_PUPPY = 'mochi';
export const COSTUMES = {
  scarf:{name:'Adventure scarf',description:'The classic red scarf.',cost:0},
  explorer:{name:'Trail explorer',description:'A little hat and a ready-for-anything backpack.',cost:700},
  hero:{name:'Superpup',description:'A blue cape for a very good hero.',cost:1200},
  raincoat:{name:'Puddle jumper',description:'A sunny yellow coat, whatever the weather.',cost:1800},
  royal:{name:'Trail royalty',description:'Prize: reach 1,000 meters in one run.',prize:'long-run'},
  party:{name:'Birthday pup',description:'Prize: collect 3 gift boxes across your runs.',prize:'gift-hunter'},
};
export const PRIZES = [
  {id:'first-trail',name:'Happy trails ribbon',description:'Reach 300 meters in one run.',metric:'distance',target:300,points:300},
  {id:'snack-master',name:'Golden biscuit medal',description:'Collect 50 bones in one run.',metric:'bones',target:50,points:500},
  {id:'long-run',name:'Thousand-paw crown',description:'Reach 1,000 meters in one run.',metric:'distance',target:1000,costume:'royal',points:0},
  {id:'gift-hunter',name:'Party paws present',description:'Bank 3 gift boxes across your runs.',metric:'gifts',target:3,costume:'party',points:0},
];
export function prizeProgress(profile, prize) {
  const earned = profile.collection.prizes.includes(prize.id);
  const value = prize.metric === 'gifts' ? profile.collection.gifts
    : prize.metric === 'bones' ? profile.bestRunBones : profile.distance;
  return {earned, current: earned ? prize.target : Math.min(prize.target,
    Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))), target: prize.target};
}
export function collectionFrom(value={}, options={}) {
  const puppies=['biscuit','mochi',...(Array.isArray(value?.puppies)?value.puppies:[])].filter((id,i,list)=>Object.hasOwn(PUPPIES,id)&&list.indexOf(id)===i);
  const costumes=['scarf',...(Array.isArray(value?.costumes)?value.costumes:[])].filter((id,i,list)=>Object.hasOwn(COSTUMES,id)&&list.indexOf(id)===i);
  const prizes=(Array.isArray(value?.prizes)?value.prizes:[]).filter((id,i,list)=>PRIZES.some(p=>p.id===id)&&list.indexOf(id)===i);
  // Claimed prizes are permanent entitlements. Repair incomplete outfit lists
  // during loading without replaying rewards or modifying the supplied save.
  for(const prize of PRIZES)
    if(prize.costume&&prizes.includes(prize.id)&&!costumes.includes(prize.costume))costumes.push(prize.costume);
  const validPuppy=puppies.includes(value?.puppy);
  // The first version of the runner silently saved Biscuit as its default.
  // New saves record an explicit choice, so only an unmarked legacy Biscuit
  // is migrated at the app boundary; backups and direct callers keep their
  // stated puppy unless they opt into this repair.
  const migrateLegacyDefault=options?.migrateLegacyDefault===true &&
    validPuppy && value.puppy==='biscuit' && value.puppySelected!==true;
  const puppy=migrateLegacyDefault?DEFAULT_PUPPY:validPuppy?value.puppy:DEFAULT_PUPPY;
  const hasPuppyMarker=typeof value?.puppySelected==='boolean';
  const puppySelected=!migrateLegacyDefault && validPuppy &&
    (value?.puppySelected===true || !hasPuppyMarker && options?.migrateLegacyDefault!==true && Object.hasOwn(value,'puppy'));
  return {puppies,costumes,puppy,puppySelected,costume:costumes.includes(value?.costume)?value.costume:'scarf',prizes,gifts:Math.max(0,Math.floor(Number.isFinite(value?.gifts)?value.gifts:0))};
}
export function equipOrBuy(profile,kind,id) {
  const catalog=kind==='puppy'?PUPPIES:kind==='costume'?COSTUMES:null;
  if(!catalog||!Object.hasOwn(catalog,id))return false;
  const owned=profile.collection[kind==='puppy'?'puppies':'costumes'];
  if(!owned.includes(id)) {
    if(kind==='puppy'&&puppyBondLocked(profile,id))return false;
    const cost=catalog[id].cost;
    if(!Number.isFinite(cost)||profile.credits<cost)return false;
    profile.credits-=cost;owned.push(id);
  }
  profile.collection[kind]=id;
  if(kind==='puppy')profile.collection.puppySelected=true;
  return true;
}
export function awardPrizes(profile,run) {
  if(!run.ended||run.prizesBanked)return [];
  run.prizesBanked=true;
  profile.collection.gifts+=run.gifts||0;
  const earned=[];
  for(const prize of PRIZES) {
    const amount=prize.metric==='gifts'?profile.collection.gifts:run[prize.metric];
    if(profile.collection.prizes.includes(prize.id)||!(amount>=prize.target))continue;
    profile.collection.prizes.push(prize.id);profile.credits+=prize.points;
    if(prize.costume&&!profile.collection.costumes.includes(prize.costume))profile.collection.costumes.push(prize.costume);
    earned.push(prize);
  }
  return earned;
}
