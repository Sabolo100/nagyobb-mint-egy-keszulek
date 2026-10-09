/* Service worker: offline működés. A __BUILD__ helyére a deploy a commit azonosítóját írja. */
const VERSION = 'nmek-__BUILD__';
const CORE = [
  './', './index.html', './app.css', './app.js', './content.js', './data.gen.js', '../js/data.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-64.png', './icons/apple-touch-icon.png',
  ...['hero', 'handwriting', 'manipulatives', 'reading', 'tablet', 'teacher', 'outdoor', 'classroom', 'homework',
    'city-stockholm', 'city-copenhagen', 'city-oslo', 'city-losangeles',
    'st-star', 'st-chest', 'st-trophy', 'st-avatar', 'st-pencil', 'st-book', 'st-brain', 'st-eye', 'st-moon',
  ].map(n => `../assets/img/${n}.webp`),
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // betűtípusok: gyorsítótár, háttérben frissítve
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.open(VERSION + '-fonts').then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // oldalnavigáció: hálózat előbb, offline esetén a gyorsítótárazott app
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  // minden más: gyorsítótár előbb
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
