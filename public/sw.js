const CACHE_NAME = 'academy-finance-v2.1';
const STATIC_CACHE = 'academy-static-v2.1';
const DATA_CACHE = 'academy-data-v2.1';

// الملفات الثابتة التي نريد cache لها
const staticUrlsToCache = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(staticUrlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event with smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // تجاهل طلبات Chrome extension
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // استراتيجية مختلفة حسب نوع الطلب
  if (request.method === 'GET') {
    // للملفات الثابتة: cache first
    if (isStaticAsset(request.url)) {
      event.respondWith(cacheFirst(request));
    }
    // لصفحات HTML: network first مع cache fallback
    else if (isPageRequest(request)) {
      event.respondWith(networkFirstWithCache(request));
    }
    // للبيانات من APIs: network first بدون cache طويل
    else if (isDataRequest(request)) {
      event.respondWith(networkOnly(request));
    }
    // للباقي: network first
    else {
      event.respondWith(networkFirst(request));
    }
  }
});

// التحقق من نوع الطلب
function isStaticAsset(url) {
  return url.includes('/icons/') || 
         url.includes('/favicon') || 
         url.includes('/manifest.json') ||
         url.includes('/_next/static/') ||
         url.endsWith('.css') ||
         url.endsWith('.js') ||
         url.endsWith('.png') ||
         url.endsWith('.jpg') ||
         url.endsWith('.svg');
}

function isPageRequest(request) {
  return request.destination === 'document' || 
         request.headers.get('accept')?.includes('text/html');
}

function isDataRequest(request) {
  return request.url.includes('/api/') || 
         request.url.includes('supabase.co');
}

// استراتيجيات Cache
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithCache(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      // احتفظ بالصفحة لمدة قصيرة فقط
      cache.put(request, response.clone());
      // امسح الصفحات القديمة بعد ساعة
      setTimeout(() => {
        cache.delete(request);
      }, 60 * 60 * 1000); // ساعة واحدة
    }
    return response;
  } catch (error) {
    console.log('Network first failed, trying cache');
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - No cached version available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('Network only failed:', error);
    return new Response('Network Error', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Activate event - تنظيف الـ caches القديمة
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // احذف أي cache قديم
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DATA_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated and ready');
      return self.clients.claim();
    })
  );
});

// رسالة لتحديث الـ cache عند الطلب
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('Clearing all caches...');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
  
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    console.log('Force updating service worker...');
    self.skipWaiting();
  }
});