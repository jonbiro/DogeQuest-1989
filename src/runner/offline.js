export function installOfflineSupport({isBusy = () => false} = {}) {
  const status = document.getElementById('offline-status');
  if (!status) return;
  if (!window.isSecureContext || !navigator.serviceWorker) {
    status.textContent = 'Offline reopening is unavailable in this browser. You can still play online.';
    return;
  }
  const mobile = window.matchMedia?.('(pointer: coarse)')?.matches === true
    || /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(window.navigator?.userAgent || '');
  // On iPhone the service-worker pack is intentionally prepared after the
  // first trail is quiet. Fetching sixteen megabytes of illustrated poses at
  // the same time as WebGL startup can push Safari/Brave over its graphics
  // budget and produce the misleading “clean 3D start” screen.
  const initialDelay = mobile ? 12000 : 0;
  const retryDelay = mobile ? 4000 : 1500;
  let started = false;
  let timer = null;
  let updateTimer = null;
  let updateReady = false;
  // A first controller claim is expected on a new install and should not
  // reload the page. A later claim means a newer worker has finished its
  // verified install; refresh an idle page so it cannot keep an old bundle
  // (and its stale DOM assumptions) indefinitely.
  let hadController = Boolean(navigator.serviceWorker.controller);
  const busyNow = () => {
    try { return Boolean(isBusy()); } catch { return true; }
  };
  const reloadWhenIdle = () => {
    updateTimer = null;
    if (!updateReady) return;
    if (document.visibilityState === 'hidden' || busyNow()) {
      updateTimer = window.setTimeout(reloadWhenIdle, retryDelay);
      return;
    }
    updateReady = false;
    if (typeof window.location?.reload === 'function') {
      window.location.reload();
    } else if (typeof window.location?.assign === 'function' && typeof window.location.href === 'string') {
      window.location.assign(window.location.href);
    }
  };
  const controllerChanged = () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    updateReady = true;
    if (status.dataset) status.dataset.updateReady = 'true';
    status.textContent = 'A new Puppy Run update is ready. Finish this run, then the trail will refresh.';
    if (updateTimer === null) reloadWhenIdle();
  };
  if (typeof navigator.serviceWorker.addEventListener === 'function')
    navigator.serviceWorker.addEventListener('controllerchange', controllerChanged);
  const start = async () => {
    if (started) return;
    const busy = busyNow();
    if (document.visibilityState === 'hidden' || busy) {
      schedule(retryDelay);
      return;
    }
    started = true;
    try {
      const registration = await navigator.serviceWorker.register('./offline-worker.js', {updateViaCache: 'none'});
      if (navigator.serviceWorker.controller) hadController = true;
      const ready = () => { status.textContent = 'Offline play is ready in this browser. Reopen this runner address without internet. Visit online for updates. Your browser may clear offline files when storage is low.'; };
      if (registration.active) ready();
      const watch = () => {
        const installing = registration.installing;
        if (installing) installing.addEventListener('statechange', () => {
          if (installing.state === 'activated') ready();
          if (installing.state === 'redundant' && !registration.active) status.textContent = 'Offline download did not finish. Play online and try again on your next visit.';
        });
      };
      watch();
      registration.addEventListener('updatefound', watch);
      // A controllerchange listener above refreshes only when the page is idle;
      // an active run remains uninterrupted and reloads after it returns to camp.
    } catch {
      status.textContent = 'Offline storage is unavailable. You can still play online.';
    }
  };
  const schedule = (delay = initialDelay) => {
    if (started || timer !== null) return;
    if (delay <= 0) {
      void start();
      return;
    }
    timer = window.setTimeout(() => {
      timer = null;
      void start();
    }, delay);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', () => schedule(), {once: true});
}
