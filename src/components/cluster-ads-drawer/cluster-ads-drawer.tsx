'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AdBase } from '@/types/ad';
import { FidgetSpinner } from 'react-loader-spinner';
import GalleryAdCard from '../gallery-ad-card/gallery-ad-card';

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
  const isSingleAd = adIds.length === 1;
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
    <div className="absolute bg-white shadow-lg overflow-auto z-10 bottom-12 left-0 w-full h-2/5 lg:top-0 lg:bottom-0 lg:left-0 lg:w-1/4 lg:h-full custom-scrollbar">
      <div className="flex justify-between items-center px-4 py-2 sm:p-4 shadow-md sticky top-0 bg-violet-100 z-10">
        <h2 className="text-base sm:text-lg font-medium">
          {isSingleAd ? 'Объявление' : `Объявления (${adIds.length})`}
        </h2>
        <button
          onClick={onClose}
          className="text-2xl hover:bg-[#d3caef] rounded p-1"
          title="Закрыть"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="p-4">
        <div
          className={`flex justify-center items-center transition-opacity duration-200 ${
            loading ? 'opacity-100 py-12' : 'h-0 opacity-0 pointer-events-none'
          }`}
        >
          <FidgetSpinner
            ariaLabel="fidget-spinner-loading"
            width="100%"
            height="100%"
            wrapperClass="w-14 sm:w-16"
            backgroundColor="#A684FF"
            ballColors={['#D5FF4D', '#FE9A00', '#737373']}
          />
        </div>

        {!loading &&
          (ads.length > 0 ? (
            <>
              <div className="pb-4 grid grid-cols-2 gap-4 min-[450px]:grid-cols-3 min-[768px]:grid-cols-4 min-[1024px]:grid-cols-1 min-[1250px]:grid-cols-2 overflow-auto">
                {ads.map((ad) => (
                  <GalleryAdCard key={ad.id} ad={ad} />
                ))}
              </div>

              {/* Элемент для Intersection Observer - под всем блоком карточек */}
              {hasMore && !isSingleAd && (
                <div
                  ref={observerRef}
                  className={`flex justify-center items-center transition-opacity duration-200 ${
                    loadingMore
                      ? 'py-2 sm:py-4 px-2 sm:px-4 opacity-100'
                      : 'h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="transition-opacity duration-200 opacity-100">
                    <FidgetSpinner
                      ariaLabel="fidget-spinner-loading"
                      width="100%"
                      height="100%"
                      wrapperClass="w-14 sm:w-16"
                      backgroundColor="#A684FF"
                      ballColors={['#D5FF4D', '#FE9A00', '#737373']}
                    />
                  </div>
                </div>
              )}

              {/* Сообщение о конце списка - под всем блоком карточек */}
              {!hasMore && ads.length > 0 && !isSingleAd && (
                <div className="text-center py-4 lg:py-8 px-2 sm:px-4 text-neutral-500">
                  <p className="text-xs sm:text-sm">
                    Это все объявления в кластере
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 sm:py-12 text-neutral-500">
              <p className="text-sm sm:text-base">Объявления не найдены</p>
            </div>
          ))}
      </div>
    </div>
  );
}
