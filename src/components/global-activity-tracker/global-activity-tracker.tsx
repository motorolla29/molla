'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useCallback, useRef } from 'react';

export default function GlobalActivityTracker() {
  const { user } = useAuthStore();
  const lastUpdateRef = useRef<number>(0);

  const updateLastSeen = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    // Обновляем не чаще чем раз в 30 секунд
    if (now - lastUpdateRef.current < 30000) return;

    try {
      lastUpdateRef.current = now;
      await fetch('/api/users/online', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      // Тихо игнорируем ошибки, чтобы не засорять консоль
      console.debug('Failed to update lastSeenAt:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Обновляем сразу при загрузке страницы
    updateLastSeen();

    // Обновляем при любой активности
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    const handleActivity = () => {
      updateLastSeen();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Обновляем каждые 30 секунд автоматически
    //const interval = setInterval(updateLastSeen, 30000);

    // Обновляем перед закрытием страницы
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/users/online', JSON.stringify({}));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Обновляем при возвращении на вкладку
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLastSeen();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      //clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, updateLastSeen]);

  return null; // Этот компонент ничего не рендерит
}