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
        const existing = await navigator.serviceWorker.getRegistration();
        if (!existing) {
          await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    register();
  }, []);

  return null;
};

export default ServiceWorkerRegister;
