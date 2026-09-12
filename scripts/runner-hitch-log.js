// Keep the worst bounded set, including startup work and the preceding frame's
// CPU costs. A long interval alone cannot distinguish GPU waiting from scheduling.
export function recordHitch(log,sample) {
  const severity=Math.max(sample.interval,sample.updateCPU,sample.drawCPU);
  if(!(severity>50))return;
  log.count++;
  log.worst.push({...sample,severity});
  log.worst.sort((a,b)=>b.severity-a.severity);
  if(log.worst.length>16)log.worst.length=16;
}
