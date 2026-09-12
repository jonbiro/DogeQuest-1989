// Portrait-first, opt-in sensor adapter. No sensor data is saved or transmitted.
// One deliberate lean emits one lane change; returning to neutral rearms it.
export function createTiltSteering(host,{onAction,onStatus=()=>{}}){
  let enabled=false,pending=false,origin=null,filtered=0,armed=true,last=null,timer=null,generation=0;
  const status=value=>onStatus(value);
  const clearTimer=()=>{if(timer!==null)host.clearTimeout(timer);timer=null;};
  function calibrate(){origin=null;filtered=0;armed=true;last=null;}
  function stop(){
    generation++;enabled=false;pending=false;clearTimer();calibrate();
    host.removeEventListener('deviceorientation',sample);
    host.removeEventListener('orientationchange',reorient);
    status('off');
  }
  function reorient(){calibrate();if(enabled)status('hold-steady');}
  function sample(event){
    if(!enabled)return;
    const angle=host.screen?.orientation?.angle??host.orientation??0;
    if(angle%180!==0){calibrate();status('portrait-required');return;}
    if(!Number.isFinite(event.gamma)||Math.abs(event.gamma)>75)return;
    const value=event.gamma*(Math.abs(angle)%360===180?-1:1);
    const now=host.performance.now();
    if(origin===null){origin=value;last=now;clearTimer();status('ready');return;}
    const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
    filtered+=(value-origin-filtered)*(1-Math.exp(-dt/0.08));
    if(Math.abs(filtered)<5)armed=true;
    if(armed&&Math.abs(filtered)>14){armed=false;onAction(filtered<0?'left':'right');}
  }
  async function enable(){
    if(enabled||pending)return enabled;
    if(!host.isSecureContext||!host.DeviceOrientationEvent){status('unavailable');return false;}
    pending=true;const request=++generation;
    try{
      // Called immediately from the user's click, before any awaited work.
      const permission=host.DeviceOrientationEvent.requestPermission;
      const result=typeof permission==='function'?await permission.call(host.DeviceOrientationEvent):'granted';
      if(request!==generation)return false;
      pending=false;
      if(result!=='granted'){status('denied');return false;}
      enabled=true;calibrate();status('hold-steady');
      host.addEventListener('deviceorientation',sample);
      host.addEventListener('orientationchange',reorient);
      timer=host.setTimeout(()=>{stop();status('unavailable');},4000);
      return true;
    }catch{
      if(request===generation){pending=false;status('denied');}
      return false;
    }
  }
  return {enable,stop,recalibrate:reorient};
}
