'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AdBase } from '@/types/ad';
import Link from 'next/link';
import { FidgetSpinner } from 'react-loader-spinner';

interface ClusterAdsDrawerProps {
  adIds: string[];
  onClose: () => void;
  cityLabel?: string;
}

export default function ClusterAdsDrawer({
  adIds,
  onClose,
  cityLabel,
}: ClusterAdsDrawerProps) {
  const [ads, setAds] = useState<AdBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  const initialLimit = 24; // Показываем первые 24 объявления сразу
  const loadMoreLimit = 24; // Загружаем по 24 при прокрутке

  // Функция загрузки объявлений кластера
  const fetchAds = useCallback(
    async (isLoadMore = false, skip = 0) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setAds([]);
        setHasMore(true);
      }

      try {
        const limit = isLoadMore ? loadMoreLimit : initialLimit;
        const params = new URLSearchParams({
          ids: adIds.join(','),
          skip: skip.toString(),
          limit: limit.toString(),
        });

        const res = await fetch(`/api/cluster-ads?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const newAds: AdBase[] = data.ads;

          if (isLoadMore) {
            setAds((prevAds) => [...prevAds, ...newAds]);
          } else {
            setAds(newAds);
          }

          setHasMore(data.hasMore);
        } else {
          console.error('Failed to fetch cluster ads:', res.statusText);
          if (!isLoadMore) {
            setAds([]);
          }
        }
      } catch (error) {
        console.error('Error fetching cluster ads:', error);
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
    [adIds]
  );

  // Загрузка начальных данных
  useEffect(() => {
    if (adIds.length > 0) {
      fetchAds();
    }
  }, [adIds, fetchAds]);

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
    <div className="absolute bg-white shadow-lg overflow-auto z-10 bottom-0 left-0 w-full h-1/2 lg:top-0 lg:bottom-0 lg:left-0 lg:w-1/4 lg:h-full custom-scrollbar">
      <div className="flex justify-between items-center p-4 shadow-md sticky top-0 bg-violet-100 z-10">
        <h2 className="text-lg font-medium">Объявления ({adIds.length})</h2>
        <button
          onClick={onClose}
          className="text-2xl hover:bg-[#d3caef] rounded p-1"
          title="Закрыть"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FidgetSpinner
              ariaLabel="fidget-spinner-loading"
              width="100%"
              height="100%"
              wrapperClass="w-16"
              backgroundColor="#A684FF"
              ballColors={['#D5FF4D', '#FE9A00', '#737373']}
            />
          </div>
        ) : ads.length > 0 ? (
          <>
            <div className="p-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1 xl:grid-cols-2 overflow-auto">
              {ads.map((ad) => (
                <Link
                  href={`/${ad.cityLabel}/${ad.category}/${ad.id}`}
                  target="_blank"
                  key={ad.id}
                  className="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:opacity-85"
                >
                  <div className="h-32 overflow-hidden">
                    <img
                      src={`https://ik.imagekit.io/motorolla29/molla/mock-photos/${
                        ad.photos.length ? ad.photos[0] : 'default.jpg'
                      }`}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold truncate">
                      {ad.title}
                    </h3>
                    {ad.price != null && (
                      <p className="mt-1 text-sm text-green-600">
                        {ad.price.toLocaleString('ru-RU')} ₽
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Элемент для Intersection Observer - под всем блоком карточек */}
            {hasMore && (
              <div
                ref={observerRef}
                className="flex justify-center items-center py-4 px-4"
              >
                {loadingMore ? (
                  <FidgetSpinner
                    ariaLabel="fidget-spinner-loading"
                    width="100%"
                    height="100%"
                    wrapperClass="w-16"
                    backgroundColor="#A684FF"
                    ballColors={['#D5FF4D', '#FE9A00', '#737373']}
                  />
                ) : (
                  <div className="h-4" />
                )}
              </div>
            )}

            {/* Сообщение о конце списка - под всем блоком карточек */}
            {!hasMore && ads.length > 0 && (
              <div className="text-center py-4 px-4 text-neutral-500">
                <p className="text-sm">Это все объявления в кластере</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <p>Объявления не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}
