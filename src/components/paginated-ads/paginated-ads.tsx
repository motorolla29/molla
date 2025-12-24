'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

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
    loadAds(1, false);
    setLoading(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <FidgetSpinner
          visible={true}
          height="60"
          width="60"
          ariaLabel="fidget-spinner-loading"
          wrapperStyle={{}}
          wrapperClass="fidget-spinner-wrapper"
        />
      </div>
    );
  }

  if (ads.length === 0) {
    const statusText = status === 'active' ? 'активных' : 'завершенных';
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-sm sm:text-base mb-2">
          У пользователя нет {statusText} объявлений
        </div>
      </div>
    );
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
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-violet-500 text-white rounded-xl hover:bg-violet-600 disabled:bg-violet-300 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base shadow-sm"
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
      {!hasMore && showEndMessage && ads.length > 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm">Это все объявления</div>
        </div>
      )}
    </div>
  );
}
