import {FETCH_DURATION} from './ability.js';

// Keep progress nodes alive between updates and activations, including their
// accessibility identity. Only labels, values and visibility change at 10Hz.
export function createPowerHud(container) {
  const doc=container.ownerDocument;
  const specifications=[
    ['shield','Zipline ride','Zipline distance remaining'],
    ['double',null,'Zoomies time remaining'],
    ['shield','Shield: one hit protected',null],
    ['magnet',null,'Magnet time remaining'],
    ['double',null,'Double points time remaining'],
  ];
  const chips=specifications.map(([style,label,timer])=>{
    const node=doc.createElement('span'),text=doc.createTextNode('');
    node.className=`power-chip ${style}`;
    if(label)node.setAttribute('aria-label',label);
    node.append(text);node.hidden=true;
    const progress=timer?doc.createElement('progress'):null;
    if(progress){progress.setAttribute('aria-label',timer);node.append(progress);}
    container.append(node);
    return {node,text,progress};
  });
  container.hidden=true;
  return run=>{
    const cable=run.zipline?Math.max(0,run.zipline.end-run.distance):0;
    const values=[
      [Boolean(run.zipline),`🐾 ${Math.ceil(cable)}m`,140,cable],
      [run.zoomies>0,`🎾 ${Math.ceil(run.zoomies)}s`,6,run.zoomies],
      [Boolean(run.shield),'◇ SHIELD'],
      [run.magnet>0,`🧲 ${Math.ceil(run.magnet)}s`,run.fetchTime>0&&run.magnet<=FETCH_DURATION?FETCH_DURATION:10+run.upgrades.magnet*3,run.magnet],
      [run.double>0,`×2 ${Math.ceil(run.double)}s`,10,run.double],
    ];
    let active=false;
    chips.forEach(({node,text,progress},i)=>{
      const [visible,label,max,value]=values[i];
      node.hidden=!visible;active||=visible;
      if(!visible)return;
      if(text.nodeValue!==label)text.nodeValue=label;
      if(progress){if(progress.max!==max)progress.max=max;if(progress.value!==value)progress.value=value;}
    });
    container.hidden=!active;
    return active;
  };
}
