import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
const {URL,Response}=globalThis;

const template=await readFile(new URL('../src/runner/offline-worker.js',import.meta.url),'utf8');
function fixture({mismatch=false,quota=false}={}) {
  const scope='https://example.test/game/runner/';
  const files=new Map([['index.html','<html>game</html>'],['game.js?v=abc','game()']]);
  const assets=[...files].map(([url,body])=>({url,sha256:createHash('sha256').update(body).digest('hex')}));
  const handlers={},stores=new Map([['another-app',new Map()],['biscuit-runner-offline-old',new Map()]]);
  const state={online:true,skipped:false,claimed:false,fetches:0};
  const worker={URL,Response,Uint8Array,crypto:webcrypto,registration:{scope},
    addEventListener:(name,fn)=>{handlers[name]=fn;},
    skipWaiting:async()=>{state.skipped=true;},clients:{claim:async()=>{state.claimed=true;}},
    fetch:async input=>{state.fetches++;if(!state.online)throw Error('offline');const url=typeof input==='string'?input:input.url;return new Response(mismatch?'wrong':files.get(url.replace(scope,''))??'network');},
    caches:{keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async key=>{
      if(!stores.has(key))stores.set(key,new Map());const data=stores.get(key);
      return {put:async(key,response)=>{if(quota)throw Error('quota');data.set(key,response.clone());},match:async key=>data.get(typeof key==='string'?key:key.url)?.clone()};
    }}};
  vm.runInNewContext(template.replace('/* build:assets */ []',JSON.stringify(assets)).replace('build:version','test'),worker);
  return {state,stores,async lifecycle(name){let promise;handlers[name]({waitUntil:p=>{promise=p;}});return promise;},
    request(path,mode='navigate',method='GET'){let promise;handlers.fetch({request:{url:new URL(path,scope).href,mode,method},respondWith:p=>{promise=p;}});return promise;}};
}
test('offline install verifies a full build; activation preserves other applications',async()=>{
  const f=fixture();await f.lifecycle('install');assert.equal(f.state.skipped,true);
  await f.lifecycle('activate');assert.equal(f.state.claimed,true);
  assert.deepEqual([...f.stores.keys()],['another-app','biscuit-runner-offline-test']);
  f.state.online=false;
  assert.equal(await (await f.request('./?launch=home')).text(),'<html>game</html>');
  assert.equal(await (await f.request('game.js?v=abc','cors')).text(),'game()');
});
test('mismatched deployments and full storage never activate an incomplete cache',async()=>{
  for(const options of [{mismatch:true},{quota:true}]) {
    const f=fixture(options);await assert.rejects(f.lifecycle('install'));
    assert.equal(f.state.skipped,false);assert.equal(f.stores.has('biscuit-runner-offline-test'),false);
    assert.equal(f.stores.has('biscuit-runner-offline-old'),true);
  }
});
test('online navigation stays fresh and unknown requests are not intercepted',async()=>{
  const f=fixture();await f.lifecycle('install');
  assert.equal(await (await f.request('./')).text(),'network');
  for(const path of ['../','qa.js','game.js?v=new','https://other.test/']) assert.equal(f.request(path,'cors'),undefined);
  assert.equal(f.request('index.html','navigate','POST'),undefined);
});
test('published offline manifest hashes match the exact release files',async()=>{
  const source=await readFile(new URL('../dist/runner/offline-worker.js',import.meta.url),'utf8');
  const assets=JSON.parse(source.match(/const ASSETS = (\[.*\]);/)[1]);
  assert.equal(assets.length,4);assert.ok(!source.includes('build:version'));
  for(const asset of assets) {
    const body=await readFile(new URL('../dist/runner/'+asset.url.split('?')[0],import.meta.url));
    assert.equal(createHash('sha256').update(body).digest('hex'),asset.sha256);
  }
});
