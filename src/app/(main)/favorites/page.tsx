'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { AdBase } from '@/types/ad';
import FavoriteAdsList from '@/components/favorite-ads-list/favorite-ads-list';

export default function FavoritesPage() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const favoritesFromStore = useFavoritesStore((s) => s.favorites);

  // Локальная копия избранных объявлений - инициализируется только при первой загрузке
  const [favoritesSnapshot, setFavoritesSnapshot] = useState<AdBase[]>([]);

  // При загрузке — если не в системе, идём на /auth
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth');
    }
  }, [isLoggedIn, router]);

  // Инициализируем локальную копию избранных только при первом рендере страницы
  useEffect(() => {
    if (favoritesSnapshot.length === 0 && favoritesFromStore.length > 0) {
      setFavoritesSnapshot([...favoritesFromStore]);
    }
  }, []); // Пустой массив зависимостей - выполняется только при первом рендере

  // Пока идёт проверка auth, можно ничего не рендерить
  if (!isLoggedIn) return null;

  return (
    <Suspense>
      <div className="container text-neutral-800 mx-auto px-4">
        <h1 className="relative text-xl w-fit sm:text-2xl font-medium mt-4 mb-6">
          Избранное
          <span className="absolute text-sm sm:text-lg font-bold text-neutral-500 -right-3 sm:-right-4 top-0">
            {favoritesSnapshot.length}
          </span>
        </h1>
        <FavoriteAdsList ads={favoritesSnapshot} />
      </div>
    </Suspense>
  );
}
