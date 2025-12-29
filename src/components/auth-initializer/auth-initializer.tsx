'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrCreateUserToken } from '@/utils';

export default function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Генерируем или получаем userToken при инициализации
    getOrCreateUserToken();
    initialize();
  }, [initialize]);

  return null;
}
