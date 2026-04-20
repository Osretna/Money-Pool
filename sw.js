const cacheName = 'jamaiya-v1';
const assets = ['./', './index.html', './style.css', './app.js', './logo.png'];

// تثبيت التطبيق وتخزين الملفات للعمل بدون انترنت
self.addEventListener('install', e => {
  e.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});

// تشغيل التطبيق من الكاش
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});