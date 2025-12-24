'use client';

import { useState, useEffect, useRef } from 'react';
import { AdBase } from '@/types/ad';
import GalleryAdCard from '../gallery-ad-card/gallery-ad-card';
import { FidgetSpinner } from 'react-loader-spinner';

interface PaginatedAdsProps {
  // ID пользователя для получения его объявлений
  userId: string;

  // Статус объявлений ('active' | 'archived')
  status: 'active' | 'archived';

  // Количество объявлений на странице
  limit?: number;

  // CSS классы для контейнера сетки
  className?: string;

  // Показывать ли сообщение "Это все объявления"
  showEndMessage?: boolean;
}

export default function PaginatedAds({
  userId,
  status,
  limit = 12,
  className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4',
  showEndMessage = true,
}: PaginatedAdsProps) {
  const [ads, setAds] = useState<AdBase[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка объявлений
  const loadAds = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const params = new URLSearchParams();
      params.set('status', status);
      params.set('page', pageNum.toString());
      params.set('limit', limit.toString());

      const response = await fetch(
        `/api/users/${userId}/ads?${params.toString()}`
      );
      const data = await response.json();

      if (data.ads && Array.isArray(data.ads)) {
        if (append) {
          setAds((prev) => [...prev, ...data.ads]);
        } else {
          setAds(data.ads);
        }

        // Проверяем, есть ли еще объявления
        setHasMore(data.pagination?.hasMore || data.ads.length === limit);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      setHasMore(false);
    }
  };

  // Первоначальная загрузка
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        await loadAds(1, false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, status]);

  // Загрузка следующей страницы
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadAds(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  if (ads.length === 0 && !isLoading && !loadingMore) {
    const statusText = status === 'active' ? 'активных' : 'завершенных';
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-sm sm:text-base mb-2">
          У пользователя нет {statusText} объявлений
        </div>
      </div>
    );
  }

  // Показываем скелетон во время загрузки
  if (isLoading) {
    return <AdsCardsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Сетка объявлений */}
      <div className={className}>
        {ads.map((ad) => (
          <GalleryAdCard key={ad.id} ad={ad} />
        ))}
      </div>

      {/* Кнопка "Показать еще" */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-6 mb-2 px-5 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs sm:text-sm shadow-sm"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <FidgetSpinner
                  visible={true}
                  height="20"
                  width="20"
                  ariaLabel="fidget-spinner-loading"
                  wrapperStyle={{}}
                  wrapperClass="fidget-spinner-wrapper"
                />
                Загрузка...
              </div>
            ) : (
              'Показать еще'
            )}
          </button>
        </div>
      )}

      {/* Сообщение о конце списка */}
      {!hasMore && showEndMessage && ads.length > 0 && !isLoading && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm">Это все объявления</div>
        </div>
      )}
    </div>
  );
}

// Скелетон для карточек объявлений
function AdsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col w-full overflow-hidden h-full min-w-0"
        >
          <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-lg bg-gray-200"></div>
          <div className="flex-1 flex-col min-w-0">
            <div className="h-4 bg-gray-200 rounded-md w-2/3 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded-md w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
