/* CookYourself : cache hors ligne. Seuls les fichiers de l'appli sont mis en cache ; les appels extérieurs passent par le réseau.
   Les clés de stockage internes gardent le préfixe « ungeste » pour ne pas perdre les données déjà notées.
   À chaque mise à jour : changer CACHE. Les fichiers sont relus sur le serveur (cache: 'reload'),
   jamais dans le cache du navigateur, sinon une ancienne version pourrait rester. */
const CACHE = 'cookyourself-v45';
const FICHIERS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './ciqual.js', './recettes.js', './recettes-proteines.js', './config.js', './droits.js', './compte.js', './entrainement.js', './bilan.js', './atelier.js', './atelier.css', './fonts/inter-tight.woff2', './fonts/space-grotesk.woff2', './confidentialite', './fonts/fredoka.woff2', './fonts/inter.woff2'];
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE)
    .then(c => c.addAll(FICHIERS.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
