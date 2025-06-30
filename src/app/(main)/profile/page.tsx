'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export default function Profile() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // Если не авторизован — сразу редиректим на /auth
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth');
    }
  }, [isLoggedIn, router]);

  // Пока идёт перенаправление, ничего не рендерим
  if (!isLoggedIn) return null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Профиль</h1>
      {/* Здесь всё содержимое страницы профиля */}
    </div>
  );
}
