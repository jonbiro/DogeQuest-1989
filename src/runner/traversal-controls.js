// Keep the layout stable while making unavailable cable actions honest.
import {jumpLandingTime} from './motion.js';
export function traversalDescription(run){
  if(run.raft)return 'River raft. Tap LEFT or RIGHT, or swipe once per lane, to steer between rocks. To keep your finger down, stop your thumb briefly before the next swipe; lifting is always okay. Jump and slide return at the shore. Escape pauses.';
  if(run.zipline)return 'Zipline ride. Tap LEFT or RIGHT, or swipe once per lane, to collect bones. To keep your finger down, stop your thumb briefly before the next swipe; lifting is always okay. Jump and slide return after the cable. Escape pauses.';
  return '3D running trail. The buttons are easiest: tap LEFT or RIGHT for one lane, JUMP for a log or gap, and SLIDE for an overhead gate. One swipe equals one move. To keep your finger down, stop your thumb briefly, then drag again; lifting is always okay. A clear swipe can switch between steering and jump/slide without lifting. On touch screens, tap a left or right edge to steer or the center to jump. Arrow keys also work. Escape pauses.';
}
export function updateTraversalControls(buttons, run) {
  const riding=Boolean(run.zipline||run.raft);
  for (const button of buttons) {
    if (!['jump','slide'].includes(button.dataset.action)) continue;
    const queued=!riding&&(button.dataset.action==='jump'
      ?run.jumpBuffer>0&&jumpLandingTime(run)<=run.jumpBuffer:run.slideNext>0);
    const state=run.raft?'rafting':riding?'riding':queued?'queued':'ready';
    if(button.dataset.controlState===state)continue;
    button.dataset.controlState=state;
    button.disabled=riding;
    const label=button.querySelector?.('small');
    if(label)label.textContent=queued?'QUEUED':button.dataset.action.toUpperCase();
    if (riding) {
      const action=button.dataset.action==='jump'?'Jump':'Slide';
      button.setAttribute('aria-label',`${action} available ${run.raft?'at the shore':'after the zipline'}`);
      button.setAttribute('title',`Steer left or right while riding ${run.raft?'the raft':'the cable'}`);
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
    let label=button?.querySelector?.('small') || null;
    if (!label) {
      const doc=button?.ownerDocument;
      if (doc && typeof doc.createElement === 'function') {
        const repaired=doc.createElement('small');
        if (typeof button?.append === 'function') {
          button.append(repaired);
          label=repaired;
        } else if (typeof button?.appendChild === 'function') {
          button.appendChild(repaired);
          label=repaired;
        }
      }
    }
    if (label) label.textContent=active ? 'TURN' : direction.toUpperCase();
    button?.setAttribute?.('aria-label', turn ? `Turn ${direction}` : `Move ${direction} one lane`);
  }
}
