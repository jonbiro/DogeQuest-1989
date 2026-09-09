// One earned, player-triggered ability. Charge is run-local, never a currency.
export const FETCH_CHARGE = 100;
export const FETCH_DURATION = 4;

export function fetchReady(run) {
  return !run.ended && run.fetchCharge >= FETCH_CHARGE && run.magnet <= 0;
}

export function chargeFetch(run, amount) {
  // A burst cannot refill itself by vacuuming up its own rewards.
  if (run.fetchTime > 0) return;
  run.fetchCharge = Math.min(FETCH_CHARGE, run.fetchCharge + amount);
}

export function activateFetch(run) {
  if (!fetchReady(run)) return false;
  run.fetchCharge = 0;
  run.fetchTime = FETCH_DURATION;
  run.magnet = FETCH_DURATION;
  run.fetchUses++;
  run.events.push('fetch');
  return true;
}
