// Local-only browser-protocol checks for touch and real safe-area environment
// variables. The CLI's device preset alone did not enable coarse-pointer input.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

async function main() {
const [endpoint,session,orientation='portrait']=process.argv.slice(2);
assert.match(endpoint||'',/^ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\//);
assert.ok(['portrait','landscape'].includes(orientation));
const insets=orientation==='portrait'?{top:44,bottom:34,left:0,right:0}:{top:0,bottom:21,left:44,right:44};
const ws=new WebSocket(endpoint),pending=new Map();let serial=0;
ws.addEventListener('message',event=>{
  const message=JSON.parse(event.data),request=pending.get(message.id);
  if(!request)return;
  pending.delete(message.id);clearTimeout(request.timer);
  if(message.error)request.reject(Error(JSON.stringify(message.error)));else request.resolve(message.result);
});
await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
function send(method,params={},sessionId) {
  return new Promise((resolve,reject)=>{
    const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error(`${method} timed out`));},10000);
    pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
  });
}
try {
  const {targetInfos}=await send('Target.getTargets');
  const pages=targetInfos.filter(target=>target.type==='page'&&target.url==='http://127.0.0.1:3000/runner/');
  assert.equal(pages.length,1,'Use one local runner tab in the dedicated test browser');
  const {sessionId}=await send('Target.attachToTarget',{targetId:pages[0].targetId,flatten:true});
  const call=(method,params)=>send(method,params,sessionId);
  const evaluate=async expression=>{
    const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await call('Emulation.setSafeAreaInsetsOverride',{insets});
  const device=await evaluate(`({width:innerWidth,height:innerHeight,coarse:matchMedia('(pointer:coarse)').matches,touch:navigator.maxTouchPoints,safeTop:getComputedStyle(document.documentElement).getPropertyValue('--safe-top')})`);
  assert.equal(device.coarse,true);assert.equal(device.touch,1);
  await evaluate(`(async()=>{window.qa=await import('/runner/qa.js');return qa.menuLayoutCheck()})()`);
  await promisify(execFile)('npx',['--yes','agent-browser','--session',session,'screenshot',`/tmp/biscuit-${orientation}-safe-area.png`]);
  const center=selector=>evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const tap=async selector=>{
    const point=await center(selector);
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
    await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(60);
  };
  await tap('#play');
  const gesture=async(dx,dy)=>{
    const x=device.width*.5,y=device.height*.56;
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy,id:1}]});
    await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(80);
  };
  const posture=()=>evaluate(`document.querySelector('#scene').dataset.posture`);
  await gesture(70,0);assert.equal(await evaluate(`document.querySelector('#scene').dataset.lane`),'3');
  await gesture(-70,0);assert.equal(await evaluate(`document.querySelector('#scene').dataset.lane`),'2');
  await gesture(0,-70);assert.equal(await posture(),'jump');
  await wait(750);
  await gesture(0,70);assert.equal(await posture(),'slide');
  const hud=await evaluate('qa.hudStressCheck()');
  await tap('#pause-button');assert.equal(await evaluate(`document.querySelector('#game').dataset.state`),'paused');
  console.log(JSON.stringify({orientation,insets,device,hud,trustedTouchActions:['right','left','jump','slide','pause']},null,2));
} finally {ws.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
