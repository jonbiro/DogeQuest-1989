// Run from the browser tool with its existing page and CDP capability handles.
// Uses rendered guidance and trusted browser keyboard input, never world state.
export function assertTrustedRun(result) {
  const distance=Number(String(result.distance).replace(/[^\d.]/g,''));
  if(!result.proof?.trusted||result.proof.untrusted||result.issues?.length||
    result.missedTurns!==0||result.turns<2||!Number.isFinite(result.turns)||
    distance<1000||!Number.isFinite(distance)||!result.ziplineCaught||
    !result.ziplineLanded||new Set(result.regions).size!==3||
    result.hearts!=='3 hearts remaining') {
    throw Error(`Trusted run acceptance failed: ${JSON.stringify(result)}`);
  }
}

export async function trustedRunCheck(page,cdp,{seconds=40,onCheckpoint=async()=>{}}={}) {
  const read=async expression=>{
    const reply=await cdp.send('Runtime.evaluate',{expression,returnByValue:true});
    if(reply.exceptionDetails)throw Error(JSON.stringify(reply.exceptionDetails));
    return reply.result.value;
  };
  const origin=await read('location.origin');
  if(!['http://127.0.0.1:3000','https://jonbiro.github.io'].includes(origin))throw Error('Use the runner test page');
  await read(`window.__runnerInputProof={trusted:0,untrusted:0};window.__runnerInputListener=e=>window.__runnerInputProof[e.isTrusted?'trusted':'untrusted']++;window.addEventListener('keydown',window.__runnerInputListener);true`);
  const regions=new Set(),issues=new Set(),checkpoints=new Set();
  let ziplineCaught=false,ziplineLanded=false,lastAction=0,snapshot;
  const started=performance.now();
  try {
    while(performance.now()-started<seconds*1000) {
      snapshot=await read(`(()=>{
        const scene=document.querySelector('#scene'),issues=[];
        for(const [a,b] of [['#power','.score'],['#power','#mission-hud'],['#power','#controls'],['#mission-hud','#controls']]){
          const x=document.querySelector(a).getBoundingClientRect(),y=document.querySelector(b).getBoundingClientRect();
          if(x.width&&x.height&&y.width&&y.height&&x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top)issues.push(a+' overlaps '+b);
        }
        return {state:document.querySelector('#game').dataset.state,cue:document.querySelector('#cue').textContent,route:document.querySelector('#route-choice').textContent,toast:document.querySelector('#toast').textContent,region:document.querySelector('#region-name').textContent,distance:document.querySelector('#distance').textContent,hearts:document.querySelector('#hearts').getAttribute('aria-label'),posture:scene.dataset.posture,turns:Number(scene.dataset.turns||0),missedTurns:Number(scene.dataset.missedTurns||0),courses:scene.dataset.courses,fetchReady:!document.querySelector('#fetch').disabled,issues,viewport:[innerWidth,innerHeight]};
      })()`);
      if(snapshot.state!=='playing')throw Error(`Trusted run stopped: ${JSON.stringify(snapshot)}`);
      regions.add(snapshot.region);snapshot.issues.forEach(issue=>issues.add(issue));
      ziplineCaught ||= snapshot.posture==='zipline';
      ziplineLanded ||= ziplineCaught&&snapshot.toast.includes('Zipline complete');
      const distance=Number(snapshot.distance.replace(/[^\d.]/g,''));
      for(const threshold of [320,680,1000])if(distance>=threshold&&!checkpoints.has(threshold)){
        checkpoints.add(threshold);await onCheckpoint(threshold,snapshot);
      }
      if(snapshot.fetchReady)await page.playwright.locator('#scene').press('f');
      const cue=snapshot.cue,route=snapshot.route,now=performance.now();
      if(now-lastAction>250){
        const turnLocked=cue.includes('TURN');
        const key=cue.includes('TURN LEFT')||cue.includes('WEAVE LEFT')||/(BONES|GIFT) LEFT/.test(cue)?'ArrowLeft':cue.includes('TURN RIGHT')||cue.includes('WEAVE RIGHT')||/(BONES|GIFT) RIGHT/.test(cue)?'ArrowRight':turnLocked?null:cue.includes('SLIDE')?'ArrowDown':cue.includes('JUMP')?'ArrowUp':route.includes('GATES IN')?'ArrowRight':null;
        if(key){await page.playwright.locator('#scene').press(key);lastAction=now;}
      }
      await new Promise(resolve=>setTimeout(resolve,80));
    }
    const proof=await read('window.__runnerInputProof');
    const result={...snapshot,regions:[...regions],issues:[...issues],ziplineCaught,ziplineLanded,proof};
    assertTrustedRun(result);
    await page.playwright.locator('#scene').press('Escape');
    return result;
  } finally {
    await read(`window.removeEventListener('keydown',window.__runnerInputListener);delete window.__runnerInputListener;delete window.__runnerInputProof;true`);
  }
}
