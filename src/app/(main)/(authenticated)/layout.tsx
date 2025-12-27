'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoggedIn, isAuthChecking } = useAuthStore();

  // Показываем loading пока проверяется авторизация
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
