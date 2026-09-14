import {createTiltSteering} from './tilt.js';
export function installTiltControls(host,{toggle,recenter,message,sensitivity,initialSensitivity='balanced',onSensitivity=()=>{},onAction,canSteer}){
  let active=false,attempted=false,requesting=false;
  async function enable(){
    requesting=true;toggle.disabled=true;
    try{return await sensor.enable();}finally{requesting=false;toggle.disabled=false;}
  }
  const labels={off:'Tilt is off. Drag and buttons always work.',
    'hold-steady':'Hold your phone comfortably upright to calibrate.',
    ready:'Tilt ready. Lean to change one lane; return upright before leaning again. Swipe for corners, jumps and slides.',
    denied:'Motion access was not granted. Use drag or buttons.',
    unavailable:'Motion sensors are unavailable. Use drag or buttons.',
    'portrait-required':'Hold the phone vertically for tilt steering.'};
  const sensor=createTiltSteering(host,{canSteer,onAction:action=>{if(canSteer())onAction(action);},onStatus:status=>{
    active=['ready','hold-steady','portrait-required'].includes(status);
    toggle.textContent=active?'Turn tilt off':'Enable tilt';
    toggle.setAttribute('aria-pressed',String(active));
    recenter.disabled=!active;
    message.textContent=status==='off'&&!attempted&&host.matchMedia?.('(pointer: coarse)').matches
      ? 'Drag and buttons are ready by default. Enable tilt here any time for optional motion steering.'
      : labels[status];
  }});
  toggle.onclick=async()=>{
    attempted=true;
    if(active){sensor.stop();return;}
    await enable();
  };
  recenter.onclick=()=>sensor.recalibrate();
  if(sensitivity){
    sensitivity.value=sensor.setSensitivity(initialSensitivity)?initialSensitivity:'balanced';
    sensitivity.onchange=()=>{
      if(sensor.setSensitivity(sensitivity.value))onSensitivity(sensitivity.value);
    };
  }
  sensor.stop();
  return {...sensor,isRequesting:()=>requesting,
    enableDefault(){
      if(attempted||!host.matchMedia?.('(pointer: coarse)').matches)return;
      attempted=true;
      // Called directly from Play, retaining the browser's user activation.
      void enable();
    }};
}
