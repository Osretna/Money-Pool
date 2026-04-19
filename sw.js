const cacheName = 'assoc-v1';
const assets = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/logo.png',
  '/manifest.json'
];

// تثبيت ملفات الكاش
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(assets);
    })
  );
});

// استدعاء الملفات حتى عند انقطاع الانترنت
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(res => {
            return res || fetch(e.request);
        })
    );
});