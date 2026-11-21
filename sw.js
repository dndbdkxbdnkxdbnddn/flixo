/* FLIXO service worker: network first, so a new release always wins; cache only as an offline fallback. */
var CACHE = 'flixo-shell';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'logo.gif'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (/version\.json|\.mp4/.test(req.url)) return;            /* always straight to the network */
  var net = fetch(req, { cache: 'no-cache' }).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  });
  var fallback = function () { return caches.match(req).then(function (m) { return m || caches.match('./'); }); };
  var slow = new Promise(function (res) { setTimeout(function () { fallback().then(function (m) { if (m) res(m); }); }, 4000); });
  e.respondWith(Promise.race([net.catch(function () { return fallback().then(function (m) { return m || Promise.reject(); }); }), slow]));
});
