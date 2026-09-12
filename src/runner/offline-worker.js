const ASSETS = /* build:assets */ [];
const VERSION = 'build:version';
const worker = globalThis;
const PREFIX = 'biscuit-runner-offline-';
const CACHE = PREFIX + VERSION;
const absolute = path => new worker.URL(path, worker.registration.scope).href;
const known = new Set(ASSETS.map(asset => absolute(asset.url)));

worker.addEventListener('install', event => event.waitUntil((async () => {
  // A deployment can change files between requests. Accept only one verified build.
  const responses = await Promise.all(ASSETS.map(async asset => {
    const response = await worker.fetch(absolute(asset.url), {cache: 'reload'});
    if (!response.ok) throw new Error('Offline download failed');
    const digest = await worker.crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
    const hash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
    if (hash !== asset.sha256) throw new Error('Offline build mismatch');
    // Normalize redirects from static hosts (for example index.html -> /runner/).
    // A redirected Response cannot satisfy a later manual-redirect navigation.
    return new worker.Response(await response.arrayBuffer(), {status: response.status, headers: response.headers});
  }));
  try {
    const cache = await worker.caches.open(CACHE);
    await Promise.all(ASSETS.map((asset, i) => cache.put(absolute(asset.url), responses[i])));
  } catch (error) {
    await worker.caches.delete(CACHE);
    throw error;
  }
  await worker.skipWaiting();
})()));

worker.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await worker.caches.keys()) {
    if (key.startsWith(PREFIX) && key !== CACHE) await worker.caches.delete(key);
  }
  await worker.clients.claim();
})()));

worker.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new worker.URL(request.url);
  const scope = new worker.URL(worker.registration.scope);
  if (url.origin !== scope.origin) return;
  if (request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === scope.pathname + 'index.html')) {
    event.respondWith((async () => {
      try { return await worker.fetch(request); }
      catch (error) {
        const cached = await (await worker.caches.open(CACHE)).match(absolute('index.html'));
        if (cached) return cached;
        throw error;
      }
    })());
  } else if (known.has(url.href)) {
    event.respondWith((async () => (await (await worker.caches.open(CACHE)).match(request)) || worker.fetch(request))());
  }
});
