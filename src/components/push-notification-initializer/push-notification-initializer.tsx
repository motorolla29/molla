'use client';

import { useEffect } from 'react';
import { usePushNotificationStore } from '@/store/usePushNotificationStore';

export default function PushNotificationInitializer() {
  const init = usePushNotificationStore((state) => state.init);

  useEffect(() => {
    // Глобальная инициализация push-системы при старте приложения
    void init();
  }, [init]);

  return null;
}
