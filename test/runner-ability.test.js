import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun, act, step} from '../src/runner/world.js';
import {chargeFetch, activateFetch} from '../src/runner/ability.js';

test('Fetch requires earned charge, caps it, and spends it exactly once', () => {
  const run = createRun(1);
  assert.equal(activateFetch(run), false);
  chargeFetch(run, 120);
  assert.equal(run.fetchCharge, 100);
  act(run, 'fetch');
  assert.equal(run.fetchCharge, 0);
  assert.equal(run.magnet, 4);
  assert.equal(run.fetchUses, 1);
  act(run, 'fetch');
  assert.equal(run.fetchUses, 1);
  chargeFetch(run, 100);
  assert.equal(run.fetchCharge, 0, 'burst cannot recharge itself');
  assert.equal(createRun(2).fetchCharge, 0, 'retry starts fresh without changing saved currency');
});

test('Fetch preserves an existing magnet and is available on the zipline', () => {
  const run = createRun(2);
  chargeFetch(run, 100);
  run.magnet = 7;
  assert.equal(activateFetch(run), false);
  assert.equal(run.fetchCharge, 100);
  assert.equal(run.magnet, 7);
  run.magnet = 0;
  run.zipline = {start:0, end:140};
  act(run, 'fetch');
  assert.equal(run.fetchUses, 1);
  assert.equal(run.magnet, 4);
});

test('clean clears and deliberate turns charge Fetch, but assisted smashes do not', () => {
  const run = createRun(4);
  run.objects = [{id:1,type:'branch',lane:1,at:.1,used:false}];
  act(run,'slide');
  for(let i=0;i<6;i++) step(run,1/120);
  assert.equal(run.fetchCharge,12);
  step(run,1/120);
  assert.equal(run.fetchCharge,12,'one reward per obstacle');
  run.distance=149.9;run.previous.distance=149.9;
  run.objects=[];
  act(run,'left');step(run,1/120);
  assert.equal(run.fetchCharge,32,'correct corner adds twenty');
  run.zoomies=3;
  run.objects=[{id:2,type:'rock',lane:1,at:run.distance+.1,used:false}];
  step(run,1/120);
  assert.equal(run.fetchCharge,32,'automatic smash is not a skilled clear');
});

test('earned Fetch collects real bones, expires, and never changes jump or slide physics', () => {
  const run = createRun(3);
  run.objects = [{id:1,type:'bone',lane:1,at:1,used:false}];
  step(run, 1/120);
  assert.equal(run.fetchCharge, 2, 'manual bone earns charge');
  chargeFetch(run, 98);
  act(run, 'fetch');
  act(run, 'jump');
  assert.ok(run.vy > 0);
  run.objects = [{id:2,type:'bone',lane:0,at:8,used:false},
    {id:3,type:'bone',lane:2,at:8,used:false,airborne:true}];
  run.nextRow = run.nextChoice = run.nextZipline = Infinity;
  for (let i=0;i<500;i++) step(run, 1/120);
  assert.equal(run.bones, 2, 'fetches side-lane ground bone, not unreachable aerial bone');
  assert.equal(run.fetchTime, 0);
  assert.equal(run.magnet, 0);
  assert.equal(run.fetchCharge, 0);
  act(run, 'slide');
  assert.equal(run.slide, .58);
  chargeFetch(run,100);
  run.ended = true;
  assert.equal(activateFetch(run), false);
});
