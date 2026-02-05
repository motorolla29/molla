'use client';

import { create } from 'zustand';

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
  // actions
  init: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

export const usePushNotificationStore = create<PushNotificationState>(
  (set, get) => ({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    isLoading: false,
    error: null,

    // Инициализация при старте приложения:
    // - проверяем поддержку
    // - синхронизируем существующую подписку браузера с сервером
    async init() {
      const isSupported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

      set((prev) => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied',
      }));

      if (isSupported) {
        await get().checkSubscriptionStatus();
      }
    },

    async checkSubscriptionStatus() {
      if (!get().isSupported) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        set((prev) => ({
          ...prev,
          isSubscribed: !!subscription,
          permission: Notification.permission,
        }));

        if (subscription) {
          // Если в браузере уже есть подписка, синхронизируем её с сервером
          try {
            const syncResponse = await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(subscription),
            });

            if (!syncResponse.ok) {
              if (syncResponse.status !== 401) {
                console.error('[Push] server sync failed', syncResponse.status);
              }
            }
          } catch (syncError) {
            console.error('[Push] server sync error', syncError);
          }
        } else if (Notification.permission === 'granted') {
          // Разрешение уже выдано, но подписки нет — создаём её автоматически
          await get().subscribe();
        }
      } catch (error) {
        console.error('[Push] Error checking subscription', error);
        set((prev) => ({
          ...prev,
          error: 'Ошибка проверки подписки',
        }));
      }
    },

    async requestPermission() {
      const { isSupported } = get();

      if (!isSupported) {
        set((prev) => ({
          ...prev,
          error: 'Push-уведомления не поддерживаются в этом браузере',
        }));
        return false;
      }

      try {
        const permission = await Notification.requestPermission();

        set((prev) => ({
          ...prev,
          permission,
        }));

        return permission === 'granted';
      } catch (error) {
        console.error('[Push] Error requesting permission', error);
        set((prev) => ({
          ...prev,
          error: 'Ошибка запроса разрешения',
        }));
        return false;
      }
    },

    async subscribe() {
      const { isSupported, permission } = get();
      if (!isSupported) return false;

      set((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Запрашиваем разрешение если ещё не запрошено
        if (permission === 'default') {
          const granted = await get().requestPermission();
          if (!granted) {
            set((prev) => ({
              ...prev,
              isLoading: false,
              error: 'Разрешение на уведомления не получено',
            }));
            return false;
          }
        }

        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
        }

        const response = await fetch('/api/push/vapid-public-key');
        const { publicKey } = await response.json();
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const subscribeResponse = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        });

        if (!subscribeResponse.ok) {
          console.error(
            '[Push] subscribe server error',
            subscribeResponse.status
          );
          throw new Error('Ошибка сохранения подписки');
        }

        set((prev) => ({
          ...prev,
          isSubscribed: true,
          isLoading: false,
        }));
        return true;
      } catch (error) {
        console.error('[Push] Error subscribing to push', error);
        set((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Ошибка подписки',
        }));
        return false;
      }
    },

    async unsubscribe() {
      const { isSupported } = get();
      if (!isSupported) return false;

      set((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await subscription.unsubscribe();
        }

        await fetch('/api/push/subscribe', {
          method: 'DELETE',
        });

        set((prev) => ({
          ...prev,
          isSubscribed: false,
          isLoading: false,
        }));
        return true;
      } catch (error) {
        console.error('[Push] Error unsubscribing', error);
        set((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Ошибка отписки',
        }));
        return false;
      }
    },
  })
);

// Вспомогательная функция для конвертации VAPID ключа
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
