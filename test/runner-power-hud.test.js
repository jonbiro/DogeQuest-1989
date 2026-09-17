import test from 'node:test';
import assert from 'node:assert/strict';
import {createPowerHud} from '../src/runner/power-hud.js';
import {createRun} from '../src/runner/world.js';
import {readFileSync} from 'node:fs';
import {URL} from 'node:url';
import {runInNewContext} from 'node:vm';

function fixture() {
  let allocations=0,appends=0;
  const doc={createElement:tag=>{allocations++;return {tag,children:[],attributes:{},
    append(child){appends++;this.children.push(child);},
    setAttribute(key,value){this.attributes[key]=value;}};},
  createTextNode:value=>{allocations++;return {nodeValue:value};}};
  const container=doc.createElement('div');container.ownerDocument=doc;
  return {container,counts:()=>[allocations,appends]};
}
test('a stale shell without the optional power container stays playable',()=>{
  const update=createPowerHud(null);
  assert.equal(update(createRun(1)),false);
});
test('raft distance reuses the traversal chip and restores cable semantics',()=>{
  const f=fixture(),update=createPowerHud(f.container),run=createRun(1);
  const nodes=[...f.container.children],counts=f.counts();
  Object.assign(run,{raft:{start:1150,end:1290},distance:1200});update(run);
  assert.equal(nodes[0].children[0].nodeValue,'RAFT · 90m');
  assert.equal(nodes[0].attributes['aria-label'],'Raft ride');
  assert.equal(nodes[0].children[1].attributes['aria-label'],'Distance to shore');
  assert.equal(nodes[0].children[1].value,90);
  Object.assign(run,{raft:null,zipline:{end:2190},distance:2100});update(run);
  assert.equal(nodes[0].attributes['aria-label'],'Zipline ride');
  assert.equal(nodes[0].children[0].nodeValue,'ZIPLINE · 90m');
  run.zipline=null;update(run);assert.equal(nodes[0].hidden,true);
  assert.deepEqual(f.counts(),counts);assert.deepEqual(f.container.children,nodes);
});

test('scenic mine-cart chip names the optional gem-versus-bone choice', () => {
  const f = fixture(), update = createPowerHud(f.container), run = createRun(1);
  const nodes = [...f.container.children];
  Object.assign(run, {
    minecart: {start: 7200, end: 7295},
    minecartChoice: {kind: 'gem-line'},
    distance: 7210,
  });
  update(run);
  assert.equal(nodes[0].children[0].nodeValue, 'CART · GEM / BONE · 85m');
  assert.match(nodes[0].attributes['aria-label'], /Choose the bone lane or gem lane/);
  assert.equal(nodes[0].children[2].textContent, 'choose gem or bones');
});
test('the actual start reset hides powers without detaching reusable elements',()=>{
  const f=fixture(),update=createPowerHud(f.container),run=createRun(1);
  run.magnet=10;update(run);
  const children=[...f.container.children];
  const source=readFileSync(new URL('../src/runner/app.js',import.meta.url),'utf8');
  const start=source.indexOf("for (const id of ['cue','route-choice','toast'",source.indexOf('function start()')),end=source.indexOf('setState("playing")',start);
  assert.ok(start>=0&&end>start);
  let hasPowers=true;
  runInNewContext(source.slice(start,end),{run:createRun(2),updatePowerHud:update,
    setText:id=>assert.notEqual(id,'power','start must not erase owned chip nodes'),
    $:id=>{assert.equal(id,'hud');return {classList:{toggle:(name,value)=>{assert.equal(name,'has-powers');hasPowers=value;}}};}});
  assert.equal(hasPowers,false);assert.equal(f.container.hidden,true);
  assert.deepEqual(f.container.children,children);
  run.magnet=5;update(run);assert.equal(children[4].hidden,false);
});
test('power HUD reuses all elements through updates, expiration and reactivation',()=>{
  const f=fixture(),update=createPowerHud(f.container),run=createRun(1,{magnet:3});
  const nodes=[...f.container.children],counts=f.counts();
  assert.equal(update(run),false);assert.equal(f.container.hidden,true);
  Object.assign(run,{zipline:{end:140},zoomies:6,shield:1,magnet:19,double:10});
  assert.equal(update(run),true);
  assert.deepEqual(nodes.map(n=>n.hidden),[false,false,false,true,false,false]);
  assert.deepEqual(nodes.map(n=>n.children[0].nodeValue),['ZIPLINE · 140m','🎾 ZOOMIES · 6s','◇ SHIELD · ONE HIT','','🧲 MAGNET · 19s','×2 BONE BONUS · 10s']);
  assert.match(nodes[5].attributes['aria-label'],/^Bone doubler active\. Doubles bone points/);
  assert.match(nodes[5].attributes['aria-label'],/10 seconds remaining/);
  assert.equal(nodes[5].attributes.title,nodes[5].attributes['aria-label']);
  assert.equal(nodes[5].children[1].attributes['aria-label'],'Double bone points time remaining');
  assert.match(nodes[1].attributes['aria-label'],/^Zoomies active\. Speed boost and obstacle smash\./);
  assert.match(nodes[4].attributes['aria-label'],/^Magnet active\. Pulls nearby bones\./);
  Object.assign(run,{zoomies:2,magnet:1.5,double:1});update(run);
  assert.deepEqual(nodes.map(n=>n.attributes['data-expiring']),['false','true','false','false','true','true']);
  Object.assign(run,{zoomies:6,magnet:19,double:10});update(run);
  assert.ok(nodes.every(n=>n.attributes['data-expiring']==='false'),'refresh clears the warning');
  for(let i=0;i<500;i++){run.magnet=19-i/100;run.distance=i/10;update(run);}
  assert.deepEqual(f.counts(),counts,'no nodes allocated or reinserted during updates');
  assert.equal(nodes[4].children[1].max,19);
  assert.equal(nodes[4].children[1].value,run.magnet);
  Object.assign(run,{zipline:null,zoomies:0,shield:0,magnet:0,double:0});
  assert.equal(update(run),false);assert.ok(nodes.every(n=>n.hidden));
  Object.assign(run,{fetchTime:4,magnet:4});update(run);
  assert.equal(nodes[4].children[1].max,4);
  assert.equal(nodes[4].children[1].attributes['aria-label'],'Magnet time remaining');
  run.magnet=10;update(run);assert.equal(nodes[4].children[1].max,19);
  assert.deepEqual(f.counts(),counts);assert.deepEqual(f.container.children,nodes);
});
