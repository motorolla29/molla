'use client';

import { useEffect, useState, Suspense } from 'react';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { AdBase } from '@/types/ad';
import FavoriteAdsList from '@/components/favorite-ads-list/favorite-ads-list';

export default function FavoritesPage() {
  const favoritesFromStore = useFavoritesStore((s) => s.favorites);

  // Локальная копия избранных объявлений - инициализируется только при первой загрузке
  const [favoritesSnapshot, setFavoritesSnapshot] = useState<AdBase[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasCheckedInitialData, setHasCheckedInitialData] = useState(false);

  // Определяем состояние загрузки
  const isLoading = !isInitialized && !hasCheckedInitialData;

  // Инициализируем локальную копию - проверяем данные сразу и через небольшую задержку
  useEffect(() => {
    // Проверяем данные сразу (для persist состояния)
    if (favoritesFromStore.length > 0 && !isInitialized) {
      setFavoritesSnapshot([...favoritesFromStore]);
      setIsInitialized(true);
      setHasCheckedInitialData(true);
      return;
    }

    // Если данных нет сразу, ждем небольшую задержку и считаем инициализацию завершенной
    const timer = setTimeout(() => {
      if (!isInitialized) {
        setFavoritesSnapshot([...favoritesFromStore]); // Может быть пустым массивом
        setIsInitialized(true);
      }
      setHasCheckedInitialData(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [favoritesFromStore, isInitialized]);

  return (
    <Suspense>
      <div className="container text-neutral-800 mx-auto px-4">
        <h1 className="flex items-center justify-between text-xl sm:text-2xl w-fit font-medium mt-4 mb-6">
          <span>Избранное</span>
          {!isLoading && (
            <span className="text-xs sm:text-sm font-bold text-neutral-500 ml-2">
              {favoritesSnapshot.length}
            </span>
          )}
        </h1>
        <FavoriteAdsList ads={favoritesSnapshot} isLoading={isLoading} />
      </div>
    </Suspense>
  );
}
