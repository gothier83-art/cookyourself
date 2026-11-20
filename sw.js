/* CookYourself (ex Â« Un Geste Â») : cache hors ligne. Seuls les fichiers de l'appli sont mis en cache ; les appels Open Food Facts passent par le rÃ©seau.
   Les clÃ©s de stockage internes gardent le prÃ©fixe Â« ungeste Â» pour ne pas perdre les donnÃ©es dÃ©jÃ  notÃ©es. */
const CACHE = 'cookyourself-v10';
const FICHIERS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './ciqual.js', './recettes.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
