'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { isLoggedIn, isAuthChecking, checkAuth } = useAuthStore();

  // При монтировании проверяем авторизацию
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Перенаправляем неавторизованного пользователя на auth только после проверки
  useEffect(() => {
    if (!isAuthChecking && !isLoggedIn) {
      const currentPath = window.location.pathname + window.location.search;
      router.replace(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthChecking, isLoggedIn, router]);

  // Middleware уже проверил авторизацию на сервере, поэтому сразу показываем контент
  // Клиентская проверка нужна только для перенаправления, если токен истек
  return <>{children}</>;
}
