import {createTiltSteering} from './tilt.js';
export function installTiltControls(host,{toggle,recenter,message,sensitivity,onAction,canSteer}){
  let active=false;
  const labels={off:'Tilt is off. Swipes and buttons always work.',
    'hold-steady':'Hold your phone comfortably upright to calibrate.',
    ready:'Tilt ready. Lean to change one lane; return upright before leaning again. Swipe for corners, jumps and slides.',
    denied:'Motion access was not granted. Use swipes or buttons.',
    unavailable:'Motion sensors are unavailable. Use swipes or buttons.',
    'portrait-required':'Hold the phone vertically for tilt steering.'};
  const sensor=createTiltSteering(host,{onAction:action=>{if(canSteer())onAction(action);},onStatus:status=>{
    active=['ready','hold-steady','portrait-required'].includes(status);
    toggle.textContent=active?'Turn tilt off':'Enable tilt';
    toggle.setAttribute('aria-pressed',String(active));
    recenter.disabled=!active;message.textContent=labels[status];
  }});
  toggle.onclick=async()=>{
    if(active){sensor.stop();return;}
    toggle.disabled=true;
    try{await sensor.enable();}finally{toggle.disabled=false;}
  };
  recenter.onclick=()=>sensor.recalibrate();
  if(sensitivity)sensitivity.onchange=()=>sensor.setSensitivity(sensitivity.value);
  sensor.stop();
  return sensor;
}
