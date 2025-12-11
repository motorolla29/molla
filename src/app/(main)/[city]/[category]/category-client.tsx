'use client';

import { useEffect, useState, Suspense } from 'react';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
import Link from 'next/link';
import TopPanel from '@/components/gallery-top-panel/gallery-top-panel';
import AsideFilters from '@/components/aside-filters/aside-filters';
import { mockAds } from '@/data/mockAds';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import TopSearchPanelMobile from '@/components/top-search-panel-mobile/top-search-panel-mobile';
import FiltersMobile from '@/components/filters-mobile/filters-mobile';
import { useSearchParams } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';
import { FidgetSpinner } from 'react-loader-spinner';
import GalleryTopPanel from '@/components/gallery-top-panel/gallery-top-panel';
import AdCardsGallery from '@/components/ad-cards-gallery/ad-cards-gallery';
import AdCardsDefault from '@/components/ad-cards-default/ad-cards-default';
import { AdBase } from '@/types/ad';
import MapSlot from '@/components/map-slot/map-slot';

interface CategoryClientProps {
  cityLabel: string;
  cityName: string;
  cityNamePrep: string;
  categoryKey: string;
  categoryLabel: string;
  lat: number | null;
  lon: number | null;
}

export default function CategoryClient({
  cityLabel,
  cityName,
  cityNamePrep,
  categoryKey,
  categoryLabel,
  lat = null,
  lon = null,
}: CategoryClientProps) {
  const [ads, setAds] = useState<AdBase[]>([]);
  const [viewType, setViewType] = useState('default');
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  const setLocation = useLocationStore((s) => s.setLocation);

  useEffect(() => {
    setLocation(cityLabel, cityName, cityNamePrep, lat, lon);
  }, [cityLabel, cityName, cityNamePrep, lat, lon, setLocation]);

  useEffect(() => {
    async function fetchAds() {
      setLoading(true);
      const params = new URLSearchParams();

      const res = await fetch(`/api/ads?${params.toString()}`);
      if (res.ok) {
        const data: AdBase[] = await res.json();
        setAds(data);
      } else {
        setAds([]);
        setAds(mockAds);
      }
      setLoading(false);
    }
    fetchAds();
  }, [cityLabel, categoryKey, searchParams]);

  return (
    <Suspense>
      <div className="container text-neutral-800 mx-auto px-4 pb-6">
        <TopSearchPanel
          categoryName={categoryLabel}
          categoryKey={categoryKey}
        />
        <TopSearchPanelMobile
          categoryName={categoryLabel}
          categoryKey={categoryKey}
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
            <li>
              <Link
                href={`/${cityLabel}`}
                className="text-blue-500 hover:underline"
              >
                {cityName}
              </Link>
            </li>
            <li>›</li>
            <li className="text-gray-500">{categoryLabel}</li>
          </ol>
        </nav>

        <h1 className="text-xl sm:text-3xl font-medium mb-5">
          {categoryLabel} в {cityNamePrep}
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
          <AsideFilters category={categoryKey} />

          {/* Основной блок */}
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
              </>
            )}
          </main>
        </div>
        {/* Модал/Overlay с фильтрами во весь экран для мобильных */}
        {mobileFiltersVisible && (
          <FiltersMobile
            category={categoryKey}
            setFiltersVisible={(bool: boolean) => setMobileFiltersVisible(bool)}
          />
        )}
      </div>
    </Suspense>
  );
}
