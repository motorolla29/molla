'use client';

import { useEffect, useState, Suspense } from 'react';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { AdBase } from '@/types/ad';
import FavoriteAdsList from '@/components/favorite-ads-list/favorite-ads-list';

export default function FavoritesPage() {
  const favorites = useFavoritesStore((s) => s.favorites);
  const isStoreLoading = useFavoritesStore((s) => s.isLoading);
  const hasHydrated = useFavoritesStore((s) => s.hasHydrated);

  // Скролл вверх при загрузке страницы избранного (для мобильных браузеров)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Снэпшот избранных: фиксируем список один раз после первой успешной загрузки/гидрации
  const [favoritesSnapshot, setFavoritesSnapshot] = useState<AdBase[]>([]);
  const [hasSnapshot, setHasSnapshot] = useState(false);

  useEffect(() => {
    // Если снэпшот уже зафиксирован – ничего не делаем
    if (hasSnapshot) return;
    // Ждём окончания persist‑гидрации
    if (!hasHydrated) return;
    // Ждём окончания загрузки из API для авторизованного пользователя
    if (isStoreLoading) return;

    // Фиксируем текущее состояние избранных (может быть и пустым массивом)
    setFavoritesSnapshot([...favorites]);
    setHasSnapshot(true);
  }, [favorites, hasHydrated, isStoreLoading, hasSnapshot]);

  const adsToRender = hasSnapshot ? favoritesSnapshot : favorites;
  // Лоадер показываем до появления первого снэпшота:
  //  - для неавторизованного: пока не завершилась гидрация избранного из localStorage
  //  - для авторизованного: пока идёт первая загрузка с сервера
  const isLoading = !hasSnapshot && (!hasHydrated || isStoreLoading);

  return (
    <Suspense>
      <div className="container text-neutral-800 mx-auto px-4 pb-10">
        <h1 className="flex items-center justify-between text-xl sm:text-2xl w-fit font-medium mt-4 mb-6">
          <span>Избранное</span>
          {!isLoading && (
            <span className="text-xs sm:text-sm font-bold text-neutral-500 ml-2">
              {adsToRender.length}
            </span>
          )}
        </h1>
        <FavoriteAdsList ads={adsToRender} isLoading={isLoading} />
      </div>
    </Suspense>
  );
}
