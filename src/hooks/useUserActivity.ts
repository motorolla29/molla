'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export function useUserActivity() {
  const { user } = useAuthStore();
  const lastUpdateRef = useRef<number>(0);

  const updateLastSeen = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    // Обновляем не чаще чем раз в 60 секунд (редко, поскольку есть глобальный трекер)
    if (now - lastUpdateRef.current < 60000) return;

    try {
      lastUpdateRef.current = now;
      await fetch('/api/users/online', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to update lastSeenAt:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Обновляем при монтировании
    updateLastSeen();

    // Слушаем события активности
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => {
      updateLastSeen();
    };

    // Добавляем обработчики
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Обновляем каждые 10 минут автоматически (редко, поскольку есть глобальный трекер)
    const interval = setInterval(updateLastSeen, 10 * 60 * 1000);

    // Обновляем перед закрытием страницы
    const handleBeforeUnload = () => {
      // Синхронный запрос для гарантии выполнения
      navigator.sendBeacon('/api/users/online', JSON.stringify({}));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, updateLastSeen]);
}