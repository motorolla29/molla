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

  if (isAuthChecking || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p>Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
