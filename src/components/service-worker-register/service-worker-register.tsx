'use client';

import { useEffect } from 'react';

/**
 * Глобальная регистрация service worker для PWA и push-уведомлений.
 * Регистрирует `/sw.js` один раз при первом входе в приложение.
 */
const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        // Всегда регистрируем (и обновляем) sw.js, иначе после изменений SW/кэша
        // клиент может оставаться на старой версии и не получать offline fallback.
        const reg = await navigator.serviceWorker.register('/sw.js');
        await reg.update().catch(() => {});
        await navigator.serviceWorker.ready;
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    register();
  }, []);

  return null;
};

export default ServiceWorkerRegister;
