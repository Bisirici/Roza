// Ağ-öncelikli (network-first) servis çalışanı — oyunu internetsiz açılabilir yapar,
// ama internet varken her zaman güncel dosyaları gösterir (cache-first'in aksine).
// Dosyalar değiştiğinde CACHE_NAME'i artırmayı unutma; eski istemcilerin önbelleği böyle temizlenir.
const CACHE_NAME = 'roza-oyun-v3';
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './questions.js',
    './messages.js',
    './audio-engine.js',
    './achievements.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CORE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Sadece kendi origin'imizdeki GET isteklerini önbellekle; harici (CDN vb.) istekleri ağa bırak.
    if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
