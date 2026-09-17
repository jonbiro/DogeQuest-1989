// Keep the layout stable while making unavailable cable actions honest.
import {jumpLandingTime} from './motion.js';
import {areaGameplayAt,areaSignatureAt} from './areas.js';
export function traversalDescription(run){
  if(run.ski)return 'Frostpeak ski descent. Tap LEFT or RIGHT, or swipe once per lane, to carve between hazards. Tap HOP when a mogul crests; steer around blue ice and follow the open ski gate. Bones and the bright finish gift follow the safe line. Sliding is paused during the descent; jump and slide return after the finish. Escape pauses.';
  if(run.raft)return 'River raft. Tap LEFT or RIGHT, or swipe once per lane, to steer between rocks. To keep your finger down, stop your thumb briefly before the next swipe; lifting is always okay. Jump and slide return at the shore. Escape pauses.';
  if(run.zipline)return 'Zipline ride. Tap LEFT or RIGHT, or swipe once per lane, to collect bones. To keep your finger down, stop your thumb briefly before the next swipe; lifting is always okay. Jump and slide return after the cable. Escape pauses.';
  if(run.minecart)return run.minecartChoice
    ? 'Mine-cart ride. Scenic carts offer a choice: stay on the glowing bone lane, or chase the gem lane for +250 points each. Tap LEFT or RIGHT, or swipe once per lane, to steer. Jump and slide return after the cart. Escape pauses.'
    : 'Mine-cart ride. The cart boards automatically; tap LEFT or RIGHT, or swipe once per lane, to steer around rocks and collect bones. Jump and slide return after the cart. Escape pauses.';
  if(run.dogChase)return 'Puppy chase. Follow the wagging companion and tap LEFT or RIGHT to stay with the moving bone line. The chase is a safe reward beat; collect the gift at the finish. Escape pauses.';
  const signature=areaSignatureAt(run?.distance||0);
  const rhythm=areaGameplayAt(run?.distance||0).label;
  return `3D running trail in ${signature.name}. The current ${rhythm} mechanic is ${signature.mechanic.label}: ${signature.mechanic.cue}. The buttons are easiest: tap LEFT or RIGHT for one lane, JUMP for a log or gap, and SLIDE for an overhead gate. One swipe equals one move. To keep your finger down, stop your thumb briefly, then drag again; lifting is always okay. A clear swipe can switch between steering and jump/slide without lifting. On touch screens, tap a left or right edge to steer or the center to jump. Arrow keys also work. Escape pauses.`;
}

function ensureLabel(button) {
  let label=button?.querySelector?.('small') || null;
  if (label) return label;
  const doc=button?.ownerDocument;
  if (!doc || typeof doc.createElement !== 'function') return null;
  const repaired=doc.createElement('small');
  if (typeof button?.append === 'function') {
    button.append(repaired);
    return repaired;
  }
  if (typeof button?.appendChild === 'function') {
    button.appendChild(repaired);
    return repaired;
  }
  return null;
}

export function updateTraversalControls(buttons, run) {
  const ride=run.zipline||run.raft||run.minecart;
  const riding=Boolean(ride);
  const skiing=Boolean(run.ski);
  for (const button of buttons) {
    if (!['jump','slide'].includes(button.dataset.action)) continue;
    // Repair the nested label before checking the cached state. A stale shell
    // can otherwise keep the same state string while still missing the node
    // that gives the player readable feedback.
    const label=ensureLabel(button);
    const queued=!riding&&!skiing&&(button.dataset.action==='jump'
      ?run.jumpBuffer>0&&jumpLandingTime(run)<=run.jumpBuffer:run.slideNext>0);
    const state=skiing?'skiing':run.raft?'rafting':run.minecart?'minecart':riding?'riding':queued?'queued':'ready';
    const nextLabel=queued?'QUEUED':skiing&&button.dataset.action==='jump'?'HOP':button.dataset.action.toUpperCase();
    if (label && label.textContent !== nextLabel) label.textContent=nextLabel;
    if(button.dataset.controlState===state)continue;
    button.dataset.controlState=state;
    button.disabled=riding || (skiing && button.dataset.action==='slide');
    if (skiing) {
      if (button.dataset.action === 'jump') {
        button.setAttribute('aria-label', 'Hop over a mogul');
        button.setAttribute('title', 'Tap HOP as the mogul reaches your puppy');
      } else {
        button.setAttribute('aria-label', 'Slide unavailable during the ski descent');
        button.setAttribute('title', 'Carve around hazards during Frostpeak');
      }
    } else if (riding) {
      const action=button.dataset.action==='jump'?'Jump':'Slide';
      const exit=run.raft?'at the shore':run.minecart?'after the cart':'after the zipline';
      const vehicle=run.raft?'the raft':run.minecart?'the mine-cart':'the cable';
      button.setAttribute('aria-label',`${action} available ${exit}`);
      button.setAttribute('title',`Steer left or right while riding ${vehicle}`);
    } else if(queued) {
      const next=button.dataset.action==='jump'?'landing':'this slide';
      button.setAttribute('aria-label',`${button.dataset.action==='jump'?'Jump':'Slide'} queued after ${next}`);
      button.setAttribute('title','Next move accepted');
    } else {
      button.setAttribute('aria-label', button.dataset.action === 'jump' ? 'Jump' : 'Slide');
      button.removeAttribute('title');
    }
  }
}

// Resolve the quiet action cue onto the matching movement button. This is a
// visual affordance only: the simulation still decides whether an input is
// accepted, buffered, or unavailable. Keeping the state on the button means a
// player can glance at the lower thumb shelf instead of translating a short
// message in the play corridor into a control.
export function updateActionCueControls(buttons, cue = '') {
  const text = String(cue || '').toUpperCase();
  const action = /SLIDE|DIVE|OVERHEAD/.test(text)
    ? 'slide'
    : /JUMP|HOP|GAP|MOGUL/.test(text) ? 'jump' : '';
  for (const button of buttons || []) {
    const type = button?.dataset?.action;
    if (!['jump', 'slide'].includes(type)) continue;
    const active = type === action;
    button?.classList?.toggle?.('action-cue', active);
    if (!button?.dataset) continue;
    if (active) button.dataset.actionCue = 'active';
    else delete button.dataset.actionCue;
  }
}

// Route cues use the same short message slot as jump/slide warnings, but the
// answer belongs on a horizontal thumb button. Highlight only authored lane
// decisions; a corner prompt already owns the turn-ready treatment and a
// generic "steer left / right" status does not name a lane to choose.
export function updateLaneCueControls(buttons, cue = '') {
  const text = String(cue || '').toUpperCase().trim();
  const direction = text.startsWith('←') ? 'left' : text.startsWith('→') ? 'right' : '';
  const specificLaneCue = Boolean(direction && !/\bTURN\b/.test(text) &&
    /\b(?:WEAVE|RAFT|CART|SKI|BONES|GIFT|RELIC|CHASE|GATE)\b/.test(text));
  for (const button of buttons || []) {
    const type = button?.dataset?.action;
    if (!['left', 'right'].includes(type)) continue;
    const active = specificLaneCue && type === direction;
    button?.classList?.toggle?.('lane-cue', active);
    if (!button?.dataset) continue;
    if (active) button.dataset.laneCue = 'active';
    else delete button.dataset.laneCue;
  }
}

// The runner can briefly pair a newer game bundle with an older cached shell.
// Early shells rendered LEFT/RIGHT as a bare arrow without the nested <small>
// label that the turn prompt later updates. Repair that small bit of markup in
// place instead of allowing a stale service-worker response to crash the frame
// loop after an otherwise valid swipe.
export function updateTurnControls(buttons, turn) {
  for (const button of buttons || []) {
    const direction=button?.dataset?.action;
    if (!['left','right'].includes(direction)) continue;
    const active=Boolean(turn && turn.status !== 'accepted' && turn.direction === direction);
    button?.classList?.toggle?.('turn-ready', active);
    const label=ensureLabel(button);
    if (label) label.textContent=active ? 'TURN' : direction.toUpperCase();
    button?.setAttribute?.('aria-label', turn ? `Turn ${direction}` : `Move ${direction} one lane`);
  }
}
