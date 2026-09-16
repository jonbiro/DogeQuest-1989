import {FETCH_DURATION} from './ability.js';
import {RAFT_LENGTH} from './rafts.js';
import {ZIPLINE_LENGTH} from './ziplines.js';
import {MINECART_LENGTH} from './minecart.js';
import {pickupDefinition} from './pickup-guide.js';

// Keep progress nodes alive between updates and activations, including their
// accessibility identity. Only labels, values and visibility change at 10Hz.
export function createPowerHud(container) {
  // A cached shell can briefly predate the power-chip container. Keep the
  // renderer's optional HUD feature as a no-op in that case instead of
  // crashing module evaluation before the recovery screen can explain it.
  const doc=container?.ownerDocument;
  if (!container || typeof container.append !== 'function' ||
      typeof doc?.createElement !== 'function' ||
      typeof doc?.createTextNode !== 'function') return () => false;
  const specifications=[
    ['ride','Zipline ride','Zipline distance remaining','ride'],
    ['zoomies',null,'Zoomies time remaining','zoomies'],
    ['shield','Shield: one hit protected',null,'shield'],
    ['magnet',null,'Magnet time remaining','magnet'],
    ['double','Double bone points: gems and trail bonuses are unchanged','Double bone points time remaining','double'],
  ];
  const chips=specifications.map(([style,label,timer,type])=>{
    const node=doc.createElement('span'),text=doc.createTextNode('');
    node.className=`power-chip ${style}`;
    node.setAttribute('data-power',type);
    if(label){node.setAttribute('aria-label',label);node.setAttribute('title',label);}
    node.append(text);node.hidden=true;
    const progress=timer?doc.createElement('progress'):null;
    if(progress){progress.setAttribute('aria-label',timer);node.append(progress);}
    const description=doc.createElement('small');
    description.textContent = type === 'ride' ? 'keep steering' : pickupDefinition(type)?.effect || '';
    description.setAttribute('aria-hidden','true');
    node.append(description);
    container.append(node);
    return {node,text,progress,description};
  });
  container.hidden=true;
  return run=>{
    const ride=run.raft||run.zipline||run.minecart;
    const cable=ride?Math.max(0,ride.end-run.distance):0;
    const rideLabel=run.raft?'Raft ride':run.minecart?'Mine-cart ride':'Zipline ride';
    if(chips[0].rideLabel!==rideLabel){
      chips[0].rideLabel=rideLabel;
      chips[0].node.setAttribute('aria-label',rideLabel);
      chips[0].node.setAttribute('title',rideLabel);
      chips[0].progress.setAttribute('aria-label',run.raft?'Distance to shore':run.minecart?'Distance to cart exit':'Zipline distance remaining');
    }
    const values=[
      [Boolean(ride),`${run.raft?'RAFT':run.minecart?'CART':'🐾'} · ${Math.ceil(cable)}m`,run.raft?RAFT_LENGTH:run.minecart?MINECART_LENGTH:ZIPLINE_LENGTH,cable],
      // Keep the name in the visible value. Portrait CSS intentionally hides
      // the longer description line to protect the trail, so a timer-only
      // chip such as “🎾 6s” leaves a new player guessing what it does.
      [run.zoomies>0,`🎾 ZOOMIES · ${Math.ceil(run.zoomies)}s`,6,run.zoomies],
      [Boolean(run.shield),'◇ SHIELD · ONE HIT'],
      [run.magnet>0,`🧲 MAGNET · ${Math.ceil(run.magnet)}s`,run.fetchTime>0&&run.magnet<=FETCH_DURATION?FETCH_DURATION:10+run.upgrades.magnet*3,run.magnet],
      [run.double>0,`×2 BONE BONUS · ${Math.ceil(run.double)}s`,10,run.double],
    ];
    let active=false;
    chips.forEach(({node,text,progress},i)=>{
      const [visible,label,max,value]=values[i];
      node.hidden=!visible;active||=visible;
      node.setAttribute('data-expiring',String(visible&&i!==0&&Boolean(progress)&&value<=2));
      if(!visible)return;
      if(text.nodeValue!==label)text.nodeValue=label;
      if(progress){if(progress.max!==max)progress.max=max;if(progress.value!==value)progress.value=value;}
    });
    container.hidden=!active;
    return active;
  };
}
