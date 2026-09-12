export function installOfflineSupport() {
  const status = document.getElementById('offline-status');
  if (!status) return;
  if (!window.isSecureContext || !navigator.serviceWorker) {
    status.textContent = 'Offline reopening is unavailable in this browser. You can still play online.';
    return;
  }
  const start = async () => {
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
  if (document.readyState === 'complete') void start();
  else window.addEventListener('load', start, {once: true});
}
