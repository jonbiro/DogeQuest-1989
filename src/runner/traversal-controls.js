// Keep the layout stable while making unavailable cable actions honest.
export function updateTraversalControls(buttons, run) {
  const riding=Boolean(run.zipline);
  for (const button of buttons) {
    if (!['jump','slide'].includes(button.dataset.action)) continue;
    if (button.disabled===riding) continue;
    button.disabled=riding;
    if (riding) {
      const action=button.dataset.action==='jump'?'Jump':'Slide';
      button.setAttribute('aria-label',`${action} available after the zipline`);
      button.setAttribute('title','Steer left or right while riding the cable');
    } else {
      button.removeAttribute('aria-label');
      button.removeAttribute('title');
    }
  }
}
