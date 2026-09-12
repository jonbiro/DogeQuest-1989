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
  run.magnet=5;update(run);assert.equal(children[3].hidden,false);
});
test('power HUD reuses all elements through updates, expiration and reactivation',()=>{
  const f=fixture(),update=createPowerHud(f.container),run=createRun(1,{magnet:3});
  const nodes=[...f.container.children],counts=f.counts();
  assert.equal(update(run),false);assert.equal(f.container.hidden,true);
  Object.assign(run,{zipline:{end:140},zoomies:6,shield:1,magnet:19,double:10});
  assert.equal(update(run),true);
  assert.deepEqual(nodes.map(n=>n.hidden),[false,false,false,false,false]);
  assert.deepEqual(nodes.map(n=>n.children[0].nodeValue),['🐾 140m','🎾 6s','◇ SHIELD','🧲 19s','×2 10s']);
  for(let i=0;i<500;i++){run.magnet=19-i/100;run.distance=i/10;update(run);}
  assert.deepEqual(f.counts(),counts,'no nodes allocated or reinserted during updates');
  assert.equal(nodes[3].children[1].max,19);
  assert.equal(nodes[3].children[1].value,run.magnet);
  Object.assign(run,{zipline:null,zoomies:0,shield:0,magnet:0,double:0});
  assert.equal(update(run),false);assert.ok(nodes.every(n=>n.hidden));
  Object.assign(run,{fetchTime:4,magnet:4});update(run);
  assert.equal(nodes[3].children[1].max,4);
  assert.equal(nodes[3].children[1].attributes['aria-label'],'Magnet time remaining');
  run.magnet=10;update(run);assert.equal(nodes[3].children[1].max,19);
  assert.deepEqual(f.counts(),counts);assert.deepEqual(f.container.children,nodes);
});
