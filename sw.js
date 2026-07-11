/* NeuroTrack service worker.
   HTML/navigations use NETWORK-FIRST so app updates always appear when online
   (falling back to cache offline). Other assets are cache-first. Bump CACHE on
   any change to this file to retire old caches. */
const CACHE = 'neurotrack-v14';
const ASSETS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('ebi.ac.uk')) return; // literature API: always live
  const isDoc = e.request.mode === 'navigate'
    || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isDoc) {
    // network-first: fetch fresh, cache a copy, fall back to cache offline
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match(e.request).then(h => h || caches.match('./index.html')))
    );
    return;
  }
  // other GET assets: cache-first
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (e.request.method === 'GET' && res.ok && url.origin === location.origin) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
