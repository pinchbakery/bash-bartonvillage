const CACHE = 'bash-v1';
const ASSETS = ['./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  if (isDoc) {
    // network-first so day-of content updates always win when online; cache offline
    e.respondWith(
      fetch(req).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put('./index.html', cp));
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
  } else {
    // cache-first for static icons/assets
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(resp => {
        const cp = resp.clone();
        caches.open(CACHE).then(c => c.put(req, cp));
        return resp;
      }))
    );
  }
});
