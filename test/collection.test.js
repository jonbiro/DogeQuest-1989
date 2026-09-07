import test from "node:test";
import assert from "node:assert/strict";
import {collectionFrom, equipOrBuy, awardPrizes} from "../src/runner/collection.js";
import {createRun, step} from "../src/runner/world.js";
test("old and malformed saves receive safe collection defaults", () => {
  for (const value of [undefined,null,5,"bad",{}]) {
    const c = collectionFrom(value);
    assert.deepEqual(c.puppies,["biscuit","mochi"]);
    assert.equal(c.puppy,"biscuit");
  }
  const c = collectionFrom({puppies:["pepper","pepper","__proto__"], puppy:"luna", costumes:["hero"], costume:"hero",gifts:-1,prizes:["long-run","long-run","bad"]});
  assert.deepEqual(c.puppies,["biscuit","mochi","pepper"]);
  assert.equal(c.puppy,"biscuit"); assert.equal(c.costume,"hero");
  assert.equal(c.gifts,0); assert.deepEqual(c.prizes,["long-run"]);
});
test("puppies and outfits buy once, persist and reject locked prizes", () => {
  const p = {credits:2200,collection:collectionFrom()};
  assert.ok(equipOrBuy(p,"puppy","pepper"));
  assert.ok(equipOrBuy(p,"costume","explorer"));
  assert.equal(p.credits,0);
  assert.ok(equipOrBuy(p,"puppy","mochi"));
  assert.ok(equipOrBuy(p,"puppy","pepper"));
  assert.equal(p.credits,0);
  assert.equal(equipOrBuy(p,"costume","royal"),false);
  assert.equal(equipOrBuy(p,"puppy","luna"),false);
  assert.equal(equipOrBuy(p,"puppy","__proto__"),false);
  assert.deepEqual(collectionFrom(JSON.parse(JSON.stringify(p.collection))),p.collection);
});
test("prizes and gifts bank only once at the end and unlock wearable outfits", () => {
  const p = {credits:0,collection:collectionFrom()};
  const r = {ended:false,distance:1200,bones:50,gifts:2};
  assert.deepEqual(awardPrizes(p,r),[]);
  r.ended = true;
  assert.equal(awardPrizes(p,r).length,3);
  assert.equal(p.credits,800); assert.equal(p.collection.gifts,2);
  assert.ok(equipOrBuy(p,"costume","royal"));
  assert.deepEqual(awardPrizes(p,r),[]);
  assert.equal(p.collection.gifts,2);
  assert.equal(awardPrizes(p,{ended:true,distance:0,bones:0,gifts:1})[0].id,"gift-hunter");
  assert.ok(equipOrBuy(p,"costume","party"));
  assert.equal(p.credits,800);
});
test("gift pickups award points once without activating a magnet or shield", () => {
  const r = createRun(1);
  r.nextRow=9999; r.objects=[{id:999,lane:1,type:"gift",at:2}];
  for(let i=0;i<120;i++)step(r,1/120);
  assert.equal(r.gifts,1); assert.equal(r.bonusPoints,100);
  assert.equal(r.shield,0); assert.equal(r.magnet,0);
});
