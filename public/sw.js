// Service Worker для PWA и Push-уведомлений

// Установка Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
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
    badge: data.badge || '/icons/icon-72.png',
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
    self.registration.showNotification(data.title || 'Molla', options)
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
      })
  );
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {});
