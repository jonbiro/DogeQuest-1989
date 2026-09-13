// Portrait-first, opt-in sensor adapter. No sensor data is saved or transmitted.
// One deliberate lean emits one lane change; returning to neutral rearms it.
export function createTiltSteering(host,{onAction,onStatus=()=>{}}){
  const thresholds={gentle:9,balanced:14,steady:20};
  let threshold=thresholds.balanced;
  let blockedUntil=0;
  let landscape=false;
  let enabled=false,pending=false,origin=null,filtered=0,armed=true,last=null,timer=null,generation=0,lastAngle=null;
  const status=value=>onStatus(value);
  const clearTimer=()=>{if(timer!==null)host.clearTimeout(timer);timer=null;};
  function calibrate(){origin=null;filtered=0;armed=true;last=null;lastAngle=null;}
  function expectReading(){clearTimer();timer=host.setTimeout(()=>{stop();status('unavailable');},4000);}
  function stop(){
    generation++;enabled=false;pending=false;landscape=false;clearTimer();calibrate();
    host.removeEventListener('deviceorientation',sample);
    host.removeEventListener('orientationchange',reorient);
    status('off');
  }
  function checkPortrait(){
    const angle=host.screen?.orientation?.angle??host.orientation??0;
    if(angle%180!==0){
      clearTimer();calibrate();
      if(!landscape)status('portrait-required');
      landscape=true;return false;
    }
    if(landscape){landscape=false;calibrate();status('hold-steady');expectReading();}
    return true;
  }
  function reorient(){calibrate();if(enabled&&checkPortrait()){status('hold-steady');expectReading();}}
  function sample(event){
    if(!enabled)return;
    if(!checkPortrait())return;
    const angle=host.screen?.orientation?.angle??host.orientation??0;
    if(!Number.isFinite(event.gamma)||Math.abs(event.gamma)>75)return;
    const value=event.gamma*(Math.abs(angle)%360===180?-1:1);
    const now=host.performance.now();
    // Sensor streams can pause in a background tab or rotate without emitting
    // the legacy orientationchange event. Never interpret that jump as a lean.
    if(last!==null&&(now-last>500||now<last||angle!==lastAngle))calibrate();
    if(origin===null){origin=value;last=now;lastAngle=angle;clearTimer();status('ready');return;}
    const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
    filtered+=(value-origin-filtered)*(1-Math.exp(-dt/0.08));
    if(now<blockedUntil)return;
    if(Math.abs(filtered)<threshold*.36)armed=true;
    if(armed&&Math.abs(filtered)>threshold){armed=false;onAction(filtered<0?'left':'right');}
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
      enabled=true;calibrate();
      host.addEventListener('deviceorientation',sample);
      host.addEventListener('orientationchange',reorient);
      reorient();
      return true;
    }catch{
      if(request===generation){pending=false;status('denied');}
      return false;
    }
  }
  function setSensitivity(value){
    if(!Object.hasOwn(thresholds,value))return false;
    threshold=thresholds[value];reorient();return true;
  }
  function yieldToTouch(){
    // Preserve the calibrated hold when jumping/sliding. Require neutral again
    // after direct input rather than treating the current lean as a new center.
    armed=false;blockedUntil=host.performance.now()+350;
  }
  return {enable,stop,recalibrate:reorient,setSensitivity,yieldToTouch};
}
