'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoggedIn, isAuthChecking } = useAuthStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Показываем loading пока проверяется авторизация
  if (isAuthChecking || !isLoggedIn) {
    return (
      <div className="min-h-full flex grow items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
