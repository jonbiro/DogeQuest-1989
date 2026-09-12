import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeBackup,decodeBackup,restoreBackup,MAX_BACKUP_BYTES} from '../src/runner/backup.js';
import {levels} from '../src/runner/progression.js';
import {collectionFrom} from '../src/runner/collection.js';
import {masteryFrom} from '../src/runner/mastery.js';
import {preferencesFrom} from '../src/runner/preferences.js';
const profile=()=>({best:2400,bones:120,bestRunBones:55,distance:1100.5,credits:1800,challenges:7,
  upgrades:levels({leap:2}),collection:collectionFrom({puppy:'mochi',costumes:['hero'],costume:'hero',gifts:2}),
  mastery:masteryFrom({dogs:{mochi:24},regions:[2,1,0]}),preferences:preferencesFrom({sound:true,reducedMotion:true})});
test('portable backups round-trip progress, equipment, mastery and preferences without mutation',()=>{
  const before=profile(),json=encodeBackup(before);
  assert.deepEqual(decodeBackup(json),before);
  assert.deepEqual(before,profile());
  assert.ok(json.length<MAX_BACKUP_BYTES);
  const extra=JSON.parse(json);extra.profile.unknown='not imported';
  assert.deepEqual(decodeBackup(JSON.stringify(extra)),before);
});
test('foreign, oversized, future and malformed backups are rejected',()=>{
  for(const text of ['bad','null','[]','{}','x'.repeat(MAX_BACKUP_BYTES+1)])
    assert.throws(()=>decodeBackup(text));
  const valid=JSON.parse(encodeBackup(profile()));
  assert.throws(()=>decodeBackup(JSON.stringify({...valid,version:2})));
  for(const bad of [-1,'100',null,1e100]) {
    const data=JSON.parse(JSON.stringify(valid));data.profile.credits=bad;
    assert.throws(()=>decodeBackup(JSON.stringify(data)));
  }
  const data=JSON.parse(JSON.stringify(valid));data.profile.collection=[];
  assert.throws(()=>decodeBackup(JSON.stringify(data)));
});
test('restore retains the exact previous save, including damaged bytes',()=>{
  const data=new Map([['biscuit-dash-v1','{damaged original']]);
  const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
  assert.equal(restoreBackup(storage,profile()),true);
  assert.equal(data.get('biscuit-dash-before-restore'),'{damaged original');
  assert.deepEqual(JSON.parse(data.get('biscuit-dash-v1')),profile());
});
test('quota and access failures cannot replace the original save',()=>{
  for(const failKey of ['read','biscuit-dash-before-restore','biscuit-dash-v1']){
    let original='original';
    const storage={getItem(){if(failKey==='read')throw Error('blocked');return original;},
      setItem(key,value){if(key===failKey)throw Error('quota');if(key==='biscuit-dash-v1')original=value;}};
    assert.equal(restoreBackup(storage,profile()),false);
    assert.equal(original,'original');
  }
});
