// Keep the layout stable while making unavailable cable actions honest.
import {jumpLandingTime} from './motion.js';
export function updateTraversalControls(buttons, run) {
  const riding=Boolean(run.zipline);
  for (const button of buttons) {
    if (!['jump','slide'].includes(button.dataset.action)) continue;
    const queued=!riding&&(button.dataset.action==='jump'
      ?run.jumpBuffer>0&&jumpLandingTime(run)<=run.jumpBuffer:run.slideNext>0);
    const state=riding?'riding':queued?'queued':'ready';
    if(button.dataset.controlState===state)continue;
    button.dataset.controlState=state;
    button.disabled=riding;
    const label=button.querySelector?.('small');
    if(label)label.textContent=queued?'QUEUED':button.dataset.action.toUpperCase();
    if (riding) {
      const action=button.dataset.action==='jump'?'Jump':'Slide';
      button.setAttribute('aria-label',`${action} available after the zipline`);
      button.setAttribute('title','Steer left or right while riding the cable');
    } else if(queued) {
      const next=button.dataset.action==='jump'?'landing':'this slide';
      button.setAttribute('aria-label',`${button.dataset.action==='jump'?'Jump':'Slide'} queued after ${next}`);
      button.setAttribute('title','Next move accepted');
    } else {
      button.removeAttribute('aria-label');
      button.removeAttribute('title');
    }
  }
}
