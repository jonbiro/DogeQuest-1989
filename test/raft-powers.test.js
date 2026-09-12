import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,fillTrack,step,act} from '../src/runner/world.js';
import {actionCue} from '../src/runner/guidance.js';

test('all 32 river power combinations preserve pickups, damage and timer contracts',()=>{
  for(let mask=0;mask<32;mask++){
    const run=createRun(1989),shield=mask&1?1:0,magnet=mask&2?10:0,
      double=mask&4?10:0,zoomies=mask&8?10:0,wantsFetch=Boolean(mask&16);
    Object.assign(run,{raftPrototype:true,distance:1090,nextRow:1090,objects:[],nextChoice:1750,nextZipline:2050,
      course:null,route:{kind:'challenge',until:1270},shield,magnet,double,zoomies,fetchCharge:wantsFetch?100:0});
    run.previous.distance=1090;fillTrack(run);
    if(wantsFetch)act(run,'fetch');
    const usedFetch=wantsFetch&&!magnet;
    assert.equal(run.fetchUses,usedFetch?1:0,`Fetch activation mask ${mask}`);
    if(wantsFetch&&magnet)assert.equal(run.fetchCharge,100,'active magnet must not spend Fetch charge');
    const initialMagnet=run.magnet;
    while(run.distance<1300&&!run.ended){
      const cue=actionCue(run);
      const finishingLine=run.objects.some(o=>o.raftPickup&&o.type==='bone'&&!o.used&&o.lane===run.lane&&o.at>run.distance-1.8&&o.at<run.distance+12);
      if(!finishingLine&&cue.startsWith('←'))act(run,'left');
      if(!finishingLine&&cue.startsWith('→'))act(run,'right');
      const before=run.events.length;step(run,1/120);
      assert.ok(!run.events.slice(before).some(e=>['hit','shield-break','smash'].includes(e)),`damage mask ${mask}`);
      if(run.fetchTime>0)assert.equal(run.fetchCharge,0,'Fetch cannot recharge itself');
    }
    assert.equal(run.rafts,1);assert.equal(run.hearts,3);assert.equal(run.shield,shield);
    assert.equal(run.bones,12,`all reachable bones mask ${mask}`);assert.equal(run.gifts,1);
    assert.equal(run.bonePoints,run.bones*25*(double?2:1),'double affects bone points exactly once');
    assert.ok(Math.abs(run.magnet-Math.max(0,initialMagnet-run.time))<1e-8);
    assert.ok(Math.abs(run.double-Math.max(0,double-run.time))<1e-8);
    assert.ok(Number.isSafeInteger(run.score));
    assert.equal(run.events.filter(e=>e==='raft-end').length,1);
    assert.equal(run.events.filter(e=>e==='gift').length,1);
  }
});
