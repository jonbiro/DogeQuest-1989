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
  const start = async () => {
    if (started) return;
    const busy = (() => {
      try { return Boolean(isBusy()); } catch { return true; }
    })();
    if (document.visibilityState === 'hidden' || busy) {
      schedule(retryDelay);
      return;
    }
    started = true;
    try {
      const registration = await navigator.serviceWorker.register('./offline-worker.js', {updateViaCache: 'none'});
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
      // Never reload on controllerchange: updates must not interrupt a run.
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
