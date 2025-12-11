'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
import { categoryOptions, getCategoryLabelByKey } from '@/const';
import { FidgetSpinner } from 'react-loader-spinner';
import Link from 'next/link';
import { mockAds } from '@/data/mockAds';
import AsideFilters from '@/components/aside-filters/aside-filters';
import TopPanel from '@/components/gallery-top-panel/gallery-top-panel';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import TopSearchPanelMobile from '@/components/top-search-panel-mobile/top-search-panel-mobile';
import FiltersMobile from '@/components/filters-mobile/filters-mobile';
import { useSearchParams } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';
import GalleryTopPanel from '@/components/gallery-top-panel/gallery-top-panel';
import { AdBase } from '@/types/ad';
import MapSlot from '@/components/map-slot/map-slot';
import AdCardsGallery from '@/components/ad-cards-gallery/ad-cards-gallery';
import AdCardsDefault from '@/components/ad-cards-default/ad-cards-default';

interface CityClientProps {
  cityLabel: string;
  cityName: string;
  cityNamePrep: string;
  lat: number | null;
  lon: number | null;
}

export default function CityClient({
  cityLabel,
  cityName,
  cityNamePrep,
  lat = null,
  lon = null,
}: CityClientProps) {
  const [ads, setAds] = useState<AdBase[]>([]);
  const [viewType, setViewType] = useState('default');
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  const setLocation = useLocationStore((s) => s.setLocation);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocation(cityLabel, cityName, cityNamePrep, lat, lon);
  }, [cityLabel, cityName, cityNamePrep, lat, lon, setLocation]);

  // Функция для загрузки объявлений
  const fetchAds = async (isLoadMore = false, skip = 0) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setAds([]);
      setHasMore(true);
    }

    // Строим параметры запроса на основе searchParams
    const params = new URLSearchParams();

    // Добавляем параметры фильтрации
    const sp = Object.fromEntries(searchParams.entries());
    Object.entries(sp).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    // Добавляем город
    params.set('cityLabel', cityLabel);

    // Добавляем пагинацию
    params.set('skip', skip.toString());
    params.set('limit', '24');

    try {
      const res = await fetch(`/api/ads?${params.toString()}`);
      if (res.ok) {
        const data: AdBase[] = await res.json();

        if (isLoadMore) {
          setAds((prevAds) => [...prevAds, ...data]);
        } else {
          setAds(data);
        }

        // Если загружено меньше 24 объявлений, значит это последняя страница
        setHasMore(data.length === 24);
      } else {
        console.error('Failed to fetch ads:', res.statusText);
        if (!isLoadMore) {
          setAds(mockAds); // Fallback to mock data only for initial load
        }
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      if (!isLoadMore) {
        setAds(mockAds); // Fallback to mock data only for initial load
      }
    }

    if (isLoadMore) {
      setLoadingMore(false);
    } else {
      setLoading(false);
    }
  };

  // Функция для загрузки следующих объявлений
  const loadMoreAds = () => {
    if (!loadingMore && hasMore) {
      fetchAds(true, ads.length);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [cityLabel, searchParams]);

  // Настройка Intersection Observer для бесконечной прокрутки
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreAds();
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
  }, [hasMore, loadingMore, ads.length]);

  return (
    <Suspense>
      <div className="container text-neutral-800 mx-auto px-4 pb-6">
        <TopSearchPanel categoryKey={null} categoryName={null} />
        <TopSearchPanelMobile
          categoryKey={null}
          categoryName={null}
          setFiltersVisible={(bool: boolean) => setMobileFiltersVisible(bool)}
        />
        {/* Breadcrumbs */}
        <nav className="text-xs sm:text-sm mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="text-blue-500 hover:underline">
                Главная
              </Link>
            </li>
            <li>›</li>
            <li className="text-gray-500">Объявления в {cityNamePrep}</li>
          </ol>
        </nav>

        <h1 className="text-xl sm:text-3xl font-medium mb-5">
          Объявления в {cityNamePrep}
          {searchParams.get('search') && (
            <span className="text-neutral-400">
              {' '}
              (по запросу «
              <span className="text-neutral-800">
                {searchParams.get('search')}
              </span>
              »):
            </span>
          )}
        </h1>

        <div className="flex gap-6">
          {/* Sidebar - фильтры*/}
          <AsideFilters category={null} />

          {/* Основной блок с объявлениями */}

          <main className="flex-1">
            <div className="mb-6">
              <MapSlot ads={ads} />
            </div>
            <GalleryTopPanel viewType={viewType} setViewType={setViewType} />

            {loading ? (
              <div className="w-full flex justify-center mt-30 sm:mt-20">
                <FidgetSpinner
                  ariaLabel="fidget-spinner-loading"
                  width={'100%'}
                  height={'100%'}
                  wrapperClass="w-16 sm:w-20"
                  backgroundColor="#A684FF"
                  ballColors={['#D5FF4D', '#FE9A00', '#737373']}
                />
              </div>
            ) : ads.length === 0 ? (
              <div className="w-full flex flex-col justify-center items-center mt-20 text-neutral-500">
                <div className="flex flex-col justify-center items-center max-w-75">
                  <img
                    className="w-16 md:w-20"
                    src="https://ik.imagekit.io/motorolla29/molla/icons/%D0%BD%D0%B8%D1%87%D0%B5%D0%B3%D0%BE-%D0%BD%D0%B5-%D0%BD%D0%B0%D0%B9%D0%B4%D0%B5%D0%BD%D0%BE-100.png"
                    alt="nothing-found"
                  />
                  <p className="text-sm md:text-base font-semibold text-center">
                    Нет объявлений по выбранным параметрам.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {viewType === 'gallery' ? (
                  <AdCardsGallery ads={ads} />
                ) : (
                  <AdCardsDefault ads={ads} />
                )}

                {/* Элемент для Intersection Observer */}
                {hasMore && (
                  <div
                    ref={observerRef}
                    className="flex justify-center items-center py-8"
                  >
                    {loadingMore ? (
                      <FidgetSpinner
                        ariaLabel="fidget-spinner-loading"
                        width={'100%'}
                        height={'100%'}
                        wrapperClass="w-16 sm:w-20"
                        backgroundColor="#A684FF"
                        ballColors={['#D5FF4D', '#FE9A00', '#737373']}
                      />
                    ) : (
                      <div className="h-4" />
                    )}
                  </div>
                )}

                {/* Сообщение о конце списка */}
                {!hasMore && ads.length > 0 && (
                  <div className="text-center py-8 text-neutral-500">
                    <p className="text-sm">Это все объявления</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
        {/* Модал/Overlay с фильтрами во весь экран для мобильных */}
        {mobileFiltersVisible && (
          <FiltersMobile
            category={null}
            setFiltersVisible={(bool: boolean) => setMobileFiltersVisible(bool)}
          />
        )}
      </div>
    </Suspense>
  );
}
