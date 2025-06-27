'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DefaultAdCard from '@/components/default-ad-card/default-ad-card';
import { useAuthStore } from '@/store/useAuthStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { AdBase } from '@/types/ad';
import FavoriteAdsList from '@/components/favorite-ads-list/favorite-ads-list';

export default function FavoritesPage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const favorites = useFavoritesStore((s) => s.favorites);

  // При загрузке — если не в системе, идём на /auth
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth');
    }
  }, [isLoggedIn, router]);

  // Пока идёт проверка auth, можно ничего не рендерить
  if (!isLoggedIn) return null;

  return (
    <div className="container text-stone-800 mx-auto px-4">
      <h1 className="relative text-xl w-fit sm:text-3xl font-medium mt-4 mb-6">
        Избранное
        <span className="absolute text-lg font-bold text-neutral-500 -right-6 top-0">
          {favorites.length}
        </span>
      </h1>
      <FavoriteAdsList ads={favorites} />
    </div>
  );
}
