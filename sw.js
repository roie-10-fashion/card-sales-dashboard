// Rocea Cards Dashboard - service worker.
// Network-first: whenever the phone is online it always loads the freshest
// page (so the app updates the moment you run the website update on your
// computer). The cached copy is only used when there is no connection.
const CACHE = 'rocea-cards-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // fonts etc: let the browser handle
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-store' });
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const home = await caches.match('./') || await caches.match('index.html');
        if (home) return home;
      }
      throw err;
    }
  })());
});
