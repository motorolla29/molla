'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getOrCreateUserToken } from '@/utils';

export default function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    console.log('🔐 AuthInitializer: Начинаю инициализацию');
    // Генерируем или получаем userToken при инициализации
    getOrCreateUserToken();
    console.log('🔐 AuthInitializer: Вызываю initialize()');
    initialize();
  }, [initialize]);

  return null;
}
