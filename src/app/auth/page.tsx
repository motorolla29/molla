'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/profile');
    }
  }, [isLoggedIn]);

  return (
    <div>
      <h1>Вход в аккаунт</h1>
      {/* форма входа */}
    </div>
  );
}
