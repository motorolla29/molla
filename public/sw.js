// Service Worker для PWA, Push-уведомлений и Offline режима.
// Подход: небольшой precache для offline shell + runtime cache для статики и ключевых GET /api.

const SW_VERSION = 'v9';
const CACHE_PREFIX = 'molla';
const OFFLINE_CACHE = `${CACHE_PREFIX}-offline-${SW_VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}-static-${SW_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-${SW_VERSION}`;
// Важно: не кешируем произвольный HTML страниц runtime-ом.
// Иначе после нового деплоя в кэше может остаться старый HTML, который ссылается
// на новые (другие) чанки Next.js, и офлайн будет падать с ChunkLoadError.
// Офлайн-опыт делаем предсказуемым: либо precache shell-страниц, либо /offline.

const OFFLINE_URL = '/offline';

// Базовые assets (иконки, манифест) — всегда precache.
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-badge-72.png',
  '/icons/favicon-96x96.png',
  '/logo/molla-logo.svg',
  '/icons/ничего-не-найдено-100.png',
  '/icons/empty-favs-image.svg',
  '/icons/oshibka_404.svg',
  '/icons/goods.png',
  '/icons/services.png',
  '/icons/realestate.png',
  '/icons/auto.png',
  '/icons/goods-map-marker.png',
  '/icons/services-map-marker.png',
  '/icons/realestate-map-marker.png',
  '/icons/auto-map-marker.png',
];

// Ключевые страницы для офлайна.
// Здесь предкешируем только действительно работающие офлайн разделы.
// Личный кабинет (/personal/*) считаем online-only и всегда ведём на /offline при отсутствии сети,
// поэтому их HTML предкешировать не нужно (это также убирает возможные 401/редиректы в precache).
const PRECACHE_PAGES = ['/', '/favorites'];

const PRECACHE_URLS = [...PRECACHE_ASSETS, ...PRECACHE_PAGES];

const sameOrigin = (url) => url.origin === self.location.origin;

const isStaticAsset = (pathname) =>
  pathname.startsWith('/_next/') ||
  pathname.startsWith('/icons/') ||
  pathname.startsWith('/images/') ||
  pathname.startsWith('/logo/') ||
  pathname === '/favicon.ico';

// Кешируем только нужные GET /api (явный allowlist), чтобы не схватить лишнее.
const isApiCacheAllowed = (pathname) => {
  if (!pathname.startsWith('/api/')) return false;

  const allowExact = new Set([
    // Профиль
    '/api/auth/me',

    // Главная: ленты
    '/api/ads',
    '/api/ads/fresh',
    '/api/ads/recommended',
    '/api/ads/viewed',

    // Карта (если используется на главной/каталогах)
    '/api/map-markers',
    '/api/cluster-ads',

    // Уведомления
    '/api/notifications',

    // Избранное
    '/api/favorites',

    // Отзывы
    '/api/reviews',

    // Мои объявления
    '/api/user/ads',
  ]);

  if (allowExact.has(pathname)) return true;

  // Детальная карточка объявления
  if (pathname.startsWith('/api/ads/')) return true;

  // Чужие объявления пользователя (в карточке продавца)
  if (pathname.startsWith('/api/users/') && pathname.endsWith('/ads'))
    return true;

  return false;
};

async function cachePutSafe(cacheName, request, response) {
  // Не кладём непрозрачные/битые ответы и редиректы.
  if (!response || !response.ok || response.type === 'opaque') return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

function normalizePathname(pathname) {
  return pathname.replace(/\/$/, '') || '/';
}

const PRECACHE_PAGES_SET = new Set(PRECACHE_PAGES.map(normalizePathname));

function isHtmlRequest(request) {
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/html')) return false;
  // Запросы Next.js App Router за RSC-пейлоудом содержат text/x-component,
  // их нельзя считать навигацией документа, иначе мы вернём HTML offline-страницы
  // туда, где ожидается RSC/JSON, и получим "Application error".
  if (accept.includes('text/x-component')) return false;
  return true;
}

async function cacheMatch(cacheName, request) {
  const cache = await caches.open(cacheName);
  return await cache.match(request);
}

// Поиск в кэше по pathname (fallback при несовпадении URL из-за query/trailing slash)
async function cacheMatchByPath(cacheName, pathname) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const normalized = pathname.replace(/\/$/, '') || '/';
  for (const req of keys) {
    const u = new URL(req.url);
    const kPath = u.pathname.replace(/\/$/, '') || '/';
    if (kPath === normalized) return await cache.match(req);
  }
  return null;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    await cachePutSafe(cacheName, request, response);
    return response;
  } catch (e) {
    const cached = await cacheMatch(cacheName, request);
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await cacheMatch(cacheName, request);
  if (cached) return cached;
  const response = await fetch(request);
  await cachePutSafe(cacheName, request, response);
  return response;
}

// Установка Service Worker
// Precache выполняется в фоне и не блокирует первую загрузку страницы.
// Ошибки по отдельным URL (например, 401 для /personal/*) не ломают установку.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(OFFLINE_CACHE);
      const results = await Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(url)),
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn('[SW] Precache: некоторые URL не закэшированы', failed);
      }
      await self.skipWaiting();
    })(),
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith(`${CACHE_PREFIX}-`) &&
              !key.endsWith(`-${SW_VERSION}`),
          )
          .map((key) => caches.delete(key)),
      );
      await clients.claim();
    })(),
  );
});

// Fetch: offline shell + runtime caching
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!sameOrigin(url)) return;

  // Навигация (HTML): mode 'navigate' или destination 'document'
  // (Next.js client-side может делать fetch с destination 'document')
  // В Chrome (и особенно в некоторых сценариях PWA/перезагрузки) destination может быть пустым,
  // поэтому дополнительно опираемся на Accept: text/html.
  const isDocument =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    isHtmlRequest(request);

  if (
    isDocument &&
    !url.pathname.startsWith('/_next') &&
    !url.pathname.startsWith('/api')
  ) {
    event.respondWith(
      (async () => {
        try {
          // Всегда пробуем сеть для документа (актуальный HTML под текущие чанки).
          return await fetch(request);
        } catch (e) {
          const pathname = normalizePathname(url.pathname);

          // Если документ входит в precache pages — отдаём его HTML из OFFLINE_CACHE.
          if (PRECACHE_PAGES_SET.has(pathname)) {
            const cached = await cacheMatchByPath(OFFLINE_CACHE, pathname);
            if (cached) return cached;
          }

          // Иначе всегда показываем offline-экран (предсказуемо, без ERR_FAILED).
          const offline = await cacheMatch(OFFLINE_CACHE, OFFLINE_URL);
          if (offline) return offline;
          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })(),
    );
    return;
  }

  // Статика: cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API GET: network-first (чтобы данные были свежими), fallback на cache.
  if (url.pathname.startsWith('/api/')) {
    if (!isApiCacheAllowed(url.pathname)) {
      // Для denylist оставляем поведение "как сейчас": только сеть.
      event.respondWith(fetch(request));
      return;
    }
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }
});

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'У вас новое уведомление',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-badge-72.png',
    data: data.data || {},
    timestamp: data.timestamp || Date.now(),
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Посмотреть',
      },
      {
        action: 'dismiss',
        title: 'Закрыть',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Molla', options),
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  const action = event.action;

  // Кнопка "Закрыть" — просто закрываем и ничего не открываем
  if (action === 'dismiss') {
    event.notification.close();
    return;
  }

  // Клик по самому уведомлению или кнопке "Посмотреть"
  event.notification.close();

  const data = event.notification.data || {};

  // Определяем куда перейти в зависимости от типа уведомления
  let url = '/';

  if (data.chatId) {
    url = `/personal/messenger/channel/${data.chatId}`;
  } else if (data.type === 'profile_update') {
    url = '/personal/profile';
  } else if (data.type === 'review_created') {
    url = '/personal/rating';
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Проверяем, есть ли уже открытое окно
        for (let client of windowClients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }

        // Если нет, открываем новое окно
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {});
