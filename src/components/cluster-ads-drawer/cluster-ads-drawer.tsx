'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AdBase } from '@/types/ad';
import { FidgetSpinner } from 'react-loader-spinner';
import GalleryAdCard from '../gallery-ad-card/gallery-ad-card';

interface ClusterAdsDrawerProps {
  adIds: string[];
  onClose: () => void;
  cityLabel?: string;
}

const drawerVariants = {
  hidden: {
    opacity: 0,
    x: '-100%',
  },
  visible: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: '100%',
  },
};

// Варианты для больших экранов (lg+) - слева направо
const drawerVariantsDesktop = {
  hidden: {
    opacity: 0,
    x: '-100%',
  },
  visible: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: '-100%',
  },
};

// Варианты для мобильных - снизу вверх
const drawerVariantsMobile = {
  hidden: {
    opacity: 0,
    y: '100%',
  },
  visible: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: '100%',
  },
};

function ClusterAdsSkeleton({ count }: { count: number }) {
  return (
    <div className="pb-4 grid grid-cols-2 gap-4 min-[450px]:grid-cols-3 min-[768px]:grid-cols-4 min-[1024px]:grid-cols-1 min-[1250px]:grid-cols-2 overflow-auto animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col w-full overflow-hidden h-full min-w-0 bg-white rounded-lg"
        >
          <div className="relative w-full aspect-square mb-2 overflow-hidden rounded-lg bg-gray-200"></div>
          <div className="flex-1 flex-col min-w-0 mt-1">
            <div className="h-5 bg-gray-200 rounded-lg w-full mb-2"></div>
            <div className="h-4.5 bg-gray-200 rounded-lg w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded-lg w-1/3 mb-3"></div>
          </div>
        </div>
      ))}
    </div>
  );
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
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const prevAdIdsRef = useRef<string[]>([]);

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
    [adIds],
  );

  // Управление видимостью drawer и загрузка данных
  useEffect(() => {
    if (adIds.length > 0) {
      setIsVisible(true);
      // Проверяем, изменились ли adIds
      const adIdsChanged = JSON.stringify(adIds.sort()) !== JSON.stringify(prevAdIdsRef.current.sort());

      if (adIdsChanged) {
        fetchAds();
        prevAdIdsRef.current = [...adIds];
      }
    } else {
      // Сбрасываем состояние когда drawer закрыт
      setLoading(false);
      setLoadingMore(false);
      setAds([]);
      setHasMore(true);
      prevAdIdsRef.current = [];
      setIsVisible(false);
    }
  }, [adIds, fetchAds]);

  // Определение размера экрана
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Обработчик закрытия с анимацией
  const handleClose = () => {
    setIsVisible(false);
    // Даем время на анимацию выхода, потом вызываем onClose
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Настройка Intersection Observer для бесконечной прокрутки
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchAds(true, ads.length);
        }
      },
      { threshold: 0.1 },
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
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="cluster-drawer"
          className="absolute bg-white shadow-lg overflow-auto z-10 bottom-12 left-0 w-full h-2/5 lg:top-0 lg:bottom-0 lg:left-0 lg:w-1/4 lg:h-full custom-scrollbar"
          variants={isDesktop ? drawerVariantsDesktop : drawerVariantsMobile}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="flex justify-between items-center px-4 py-2 sm:p-4 shadow-md sticky top-0 bg-violet-100 z-10">
            <h2 className="text-base sm:text-lg font-semibold">
              {isSingleAd ? 'Объявление' : `Объявления (${adIds.length})`}
            </h2>
            <button
              onClick={handleClose}
              className="text-2xl hover:bg-[#d3caef] rounded p-1"
              title="Закрыть"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4">
            {loading && <ClusterAdsSkeleton count={isSingleAd ? 1 : 3} />}

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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
