'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AdBase } from '@/types/ad';
import GalleryAdCard from '../gallery-ad-card/gallery-ad-card';
import AdCardsDefault from '../ad-cards-default/ad-cards-default';
import { FidgetSpinner } from 'react-loader-spinner';

interface InfiniteScrollAdsProps {
  // Параметры для API запроса
  cityLabel?: string;
  category?: string;
  searchParams?: URLSearchParams;
  sort?: string;

  // Количество объявлений на странице
  limit?: number;

  // Тип отображения объявлений
  viewType?: 'gallery' | 'default';

  // CSS классы для контейнера
  className?: string;

  // Показывать ли сообщение "Это все объявления"
  showEndMessage?: boolean;
}

export default function InfiniteScrollAds({
  cityLabel,
  category,
  searchParams,
  sort,
  limit = 24,
  viewType = 'gallery',
  className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8',
  showEndMessage = true,
}: InfiniteScrollAdsProps) {
  const [ads, setAds] = useState<AdBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<HTMLDivElement>(null);

  // Функция для загрузки объявлений
  const fetchAds = useCallback(
    async (isLoadMore = false, skip = 0) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setAds([]);
        setHasMore(true);
      }

      // Строим параметры запроса
      const params = new URLSearchParams(searchParams?.toString() || '');

      // Добавляем базовые параметры
      if (cityLabel) params.set('cityLabel', cityLabel);
      if (category) params.set('category', category);
      if (sort) params.set('sort', sort);

      // Добавляем пагинацию
      params.set('skip', skip.toString());
      params.set('limit', limit.toString());

      try {
        const res = await fetch(`/api/ads?${params.toString()}`);
        if (res.ok) {
          const data: AdBase[] = await res.json();

          if (isLoadMore) {
            setAds((prevAds) => [...prevAds, ...data]);
          } else {
            setAds(data);
          }

          // Если загружено меньше limit объявлений, значит это последняя страница
          setHasMore(data.length === limit);
        } else {
          console.error('Failed to fetch ads:', res.statusText);
          if (!isLoadMore) {
            setAds([]);
          }
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
        if (!isLoadMore) {
          setAds([]);
        }
      }

      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    },
    [cityLabel, category, searchParams, sort, limit]
  );

  // Загрузка начальных данных
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Настройка Intersection Observer для бесконечной прокрутки
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchAds(true, ads.length);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loadingMore, loading, ads.length, fetchAds]);

  return (
    <>
      {/* Спиннер начальной загрузки */}
      <div
        className={`flex justify-center items-center transition-opacity duration-200 ${
          loading
            ? 'py-12 opacity-100'
            : 'h-0 opacity-0 pointer-events-none overflow-hidden'
        }`}
      >
        <FidgetSpinner
          ariaLabel="fidget-spinner-loading"
          width={'100%'}
          height={'100%'}
          wrapperClass="w-16 sm:w-20"
          backgroundColor="#A684FF"
          ballColors={['#D5FF4D', '#FE9A00', '#737373']}
        />
      </div>

      {!loading && ads.length > 0 ? (
        <div className={className}>
          {ads.map((ad) =>
            viewType === 'gallery' ? (
              <div key={ad.id} className="h-full">
                <GalleryAdCard ad={ad} />
              </div>
            ) : (
              <AdCardsDefault key={ad.id} ads={[ad]} />
            )
          )}
        </div>
      ) : (
        !loading && (
          <div className="w-full flex flex-col justify-center items-center text-neutral-500">
            <div className="flex flex-col justify-center items-center max-w-75 my-6 sm:my-10">
              <img
                className="w-16 sm:w-20"
                src="https://ik.imagekit.io/motorolla29/molla/icons/%D0%BD%D0%B8%D1%87%D0%B5%D0%B3%D0%BE-%D0%BD%D0%B5-%D0%BD%D0%B0%D0%B9%D0%B4%D0%B5%D0%BD%D0%BE-100.png"
                alt="nothing-found"
              />
              <p className="text-sm sm:text-base text-center">
                Нет объявлений по выбранным параметрам.
              </p>
            </div>
          </div>
        )
      )}

      {/* Элемент для Intersection Observer */}
      {!loading && hasMore && (
        <div
          ref={observerRef}
          className={`flex justify-center items-center transition-opacity duration-200 ${
            loadingMore
              ? 'py-8 opacity-100'
              : 'h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="transition-opacity duration-200 opacity-100">
            <FidgetSpinner
              ariaLabel="fidget-spinner-loading"
              width={'100%'}
              height={'100%'}
              wrapperClass="w-16 sm:w-20"
              backgroundColor="#A684FF"
              ballColors={['#D5FF4D', '#FE9A00', '#737373']}
            />
          </div>
        </div>
      )}

      {/* Сообщение о конце списка */}
      {!loading && showEndMessage && !hasMore && ads.length > 0 && (
        <div className="text-center py-4 text-neutral-500">
          <p className="text-sm">Это все объявления</p>
        </div>
      )}
    </>
  );
}
