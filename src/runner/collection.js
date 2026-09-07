export const PUPPIES = {
  biscuit: { name:'Biscuit', breed:'Golden corgi', description:'Big ears. Bigger courage.', cost:0, fur:'#d89043', head:'#f2c67b', muzzle:'#ffe0a1', paws:'#ffe3b1', ears:'pointy' },
  mochi: { name:'Mochi', breed:'Cream retriever', description:'Soft ears. Serious snack skills.', cost:0, fur:'#ded0ac', head:'#f3e3c0', muzzle:'#fff4dc', paws:'#fff9ea', ears:'floppy' },
  pepper: { name:'Pepper', breed:'Spotted puppy', description:'A little chaos. A lot of spots.', cost:1500, fur:'#ecebe3', head:'#fffdf2', muzzle:'#e3dfcf', paws:'#f8f7ed', ears:'floppy', spots:true },
  luna: { name:'Luna', breed:'Moonlight husky', description:'Born to chase the horizon.', cost:2500, fur:'#6b8190', head:'#8fa6b1', muzzle:'#eff1e6', paws:'#f4f2e5', ears:'pointy' },
};
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
export function collectionFrom(value={}) {
  const puppies=['biscuit','mochi',...(Array.isArray(value?.puppies)?value.puppies:[])].filter((id,i,list)=>Object.hasOwn(PUPPIES,id)&&list.indexOf(id)===i);
  const costumes=['scarf',...(Array.isArray(value?.costumes)?value.costumes:[])].filter((id,i,list)=>Object.hasOwn(COSTUMES,id)&&list.indexOf(id)===i);
  const prizes=(Array.isArray(value?.prizes)?value.prizes:[]).filter((id,i,list)=>PRIZES.some(p=>p.id===id)&&list.indexOf(id)===i);
  // Claimed prizes are permanent entitlements. Repair incomplete outfit lists
  // during loading without replaying rewards or modifying the supplied save.
  for(const prize of PRIZES)
    if(prize.costume&&prizes.includes(prize.id)&&!costumes.includes(prize.costume))costumes.push(prize.costume);
  return {puppies,costumes,puppy:puppies.includes(value?.puppy)?value.puppy:'biscuit',costume:costumes.includes(value?.costume)?value.costume:'scarf',prizes,gifts:Math.max(0,Math.floor(Number.isFinite(value?.gifts)?value.gifts:0))};
}
export function equipOrBuy(profile,kind,id) {
  const catalog=kind==='puppy'?PUPPIES:kind==='costume'?COSTUMES:null;
  if(!catalog||!Object.hasOwn(catalog,id))return false;
  const owned=profile.collection[kind==='puppy'?'puppies':'costumes'];
  if(!owned.includes(id)) {
    const cost=catalog[id].cost;
    if(!Number.isFinite(cost)||profile.credits<cost)return false;
    profile.credits-=cost;owned.push(id);
  }
  profile.collection[kind]=id;return true;
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
