import {FETCH_DURATION} from './ability.js';
import {RAFT_LENGTH} from './rafts.js';
import {ZIPLINE_LENGTH} from './ziplines.js';
import {MINECART_LENGTH} from './minecart.js';
import {pickupDefinition} from './pickup-guide.js';

function setAttributeIfChanged(node, name, value) {
  if (!node || typeof node.setAttribute !== 'function') return;
  const next = String(value);
  const current = typeof node.getAttribute === 'function'
    ? node.getAttribute(name)
    : node.attributes?.[name];
  if (current !== next) node.setAttribute(name, next);
}

// Portrait mode keeps a compact, one-line effect under the timer so the trail
// stays clear without turning an active power into an unexplained emoji. Keep
// the same plain-language explanation available to VoiceOver, keyboard users,
// and long-press tooltips so every presentation answers what the power does.
function activePowerLabel(type, value) {
  const seconds = Number.isFinite(value)
    ? `${Math.ceil(Math.max(0, value))} seconds remaining.`
    : '';
  if (type === 'zoomies') return `Zoomies active. Speed boost and obstacle smash. ${seconds}`.trim();
  if (type === 'magnet') return `Magnet active. Pulls nearby bones. ${seconds}`.trim();
  if (type === 'double') return `Bone doubler active. Doubles bone points; gems and trail bonuses are unchanged. ${seconds}`.trim();
  if (type === 'calm') return `Safe start active. Opening collisions are forgiven. ${seconds}`.trim();
  if (type === 'shield') return 'Shield active. Blocks one hit.';
  return '';
}

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
    ['calm',null,'Safe opening time remaining','calm'],
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
    description.textContent = type === 'ride'
      ? 'keep steering'
      : type === 'calm'
        ? 'opening collisions are forgiven'
        : pickupDefinition(type)?.effect || '';
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
    const rideChoice=run.minecart&&run.minecartChoice?'gem-line':'';
    const rideState=`${rideLabel}:${rideChoice}`;
    if(chips[0].rideLabel!==rideState){
      chips[0].rideLabel=rideState;
      chips[0].node.setAttribute('aria-label',rideChoice ? `${rideLabel}. Choose the bone lane or gem lane.` : rideLabel);
      chips[0].node.setAttribute('title',rideChoice ? 'Choose the steady bone lane or the glowing gem lane.' : rideLabel);
      chips[0].description.textContent=rideChoice ? 'choose gem or bones' : 'keep steering';
      chips[0].progress.setAttribute('aria-label',run.raft?'Distance to shore':run.minecart?'Distance to cart exit':'Zipline distance remaining');
    }
    const rideName = run.raft
      ? 'RAFT'
      : run.minecart
        ? (rideChoice ? 'CART · GEM / BONE' : 'CART')
        : 'ZIPLINE';
    const values=[
      // The old zipline chip used a paw glyph (`🐾 · 90m`). That looked like
      // another collectible and made the traversal state harder to parse at
      // a glance. Keep the shared chip, but name every ride explicitly so the
      // visible HUD and its accessible label answer the same question.
      [Boolean(ride),`${rideName} · ${Math.ceil(cable)}m`,run.raft?RAFT_LENGTH:run.minecart?MINECART_LENGTH:ZIPLINE_LENGTH,cable],
      // Keep the name in the visible value. Portrait CSS intentionally hides
      // the longer description line to protect the trail, so a timer-only
      // chip such as “🎾 6s” leaves a new player guessing what it does.
      [run.zoomies>0,`🎾 ZOOMIES · ${Math.ceil(run.zoomies)}s`,6,run.zoomies],
      [Boolean(run.shield),'◇ SHIELD · ONE HIT'],
      [run.modifier?.id === 'calm-start' && run.time < (run.modifier.duration || 4) && run.invulnerable > 0,
        '🌿 SAFE START · ' + Math.ceil(run.invulnerable) + 's',run.modifier?.duration || 4,run.invulnerable],
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
      if (i !== 0) {
        const explanation = activePowerLabel(specifications[i][3], value);
        if (explanation) {
          setAttributeIfChanged(node, 'aria-label', explanation);
          setAttributeIfChanged(node, 'title', explanation);
        }
      }
      if(progress){if(progress.max!==max)progress.max=max;if(progress.value!==value)progress.value=value;}
    });
    container.hidden=!active;
    return active;
  };
}
