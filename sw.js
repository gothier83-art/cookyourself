/* CookYourself : cache hors ligne. Seuls les fichiers de l'appli sont mis en cache ; les appels extérieurs passent par le réseau.
   Les clés de stockage internes gardent le préfixe « ungeste » pour ne pas perdre les données déjà notées.
   À chaque mise à jour : changer CACHE. Les fichiers sont relus sur le serveur (cache: 'reload'),
   jamais dans le cache du navigateur, sinon une ancienne version pourrait rester. */
const CACHE = 'cookyourself-v46';
const FICHIERS = ['./', './manifest.webmanifest', './icon.svg', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './ciqual.js', './recettes.js', './recettes-proteines.js', './config.js', './droits.js', './compte.js', './entrainement.js', './bilan.js', './atelier.js', './atelier.css', './fonts/inter-tight.woff2', './fonts/space-grotesk.woff2', './confidentialite', './fonts/fredoka.woff2', './fonts/inter.woff2'];
/* Une réponse redirigée (Cloudflare : /app/index.html → /app/) ne peut pas être servie par le service worker :
   on la recopie sans le drapeau « redirigée » avant de la mettre en cache ou de la servir. */
function propre(r){ if (!r || !r.redirected) return Promise.resolve(r); return r.blob().then(b => new Response(b, { status: r.status, statusText: r.statusText, headers: r.headers })); }
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE)
    .then(c => Promise.all(FICHIERS.map(f => fetch(new Request(f, { cache: 'reload' })).then(propre).then(r => { if (r && r.ok) return c.put(f, r); }))))
    .then(() => self.skipWaiting())
));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  /* Pages (navigation) : le réseau d'abord, le cache seulement hors ligne. Le navigateur gère lui-même les redirections. */
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('./').then(propre)));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r ? propre(r) : fetch(e.request)));
});
