'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import AsideFilters from '@/components/aside-filters/aside-filters';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import TopSearchPanelMobile from '@/components/top-search-panel-mobile/top-search-panel-mobile';
import FiltersMobile from '@/components/filters-mobile/filters-mobile';
import { useSearchParams } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';
import GalleryTopPanel from '@/components/gallery-top-panel/gallery-top-panel';
import InfiniteScrollAds from '@/components/infinite-scroll-ads/infinite-scroll-ads';
import AdCardsDefault from '@/components/ad-cards-default/ad-cards-default';
import GalleryAdCard from '@/components/gallery-ad-card/gallery-ad-card';
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
  const [viewType, setViewType] = useState('default');
  const searchParams = useSearchParams();
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  const setLocation = useLocationStore((s) => s.setLocation);

  useEffect(() => {
    setLocation(cityLabel, cityName, cityNamePrep, lat, lon);
  }, [cityLabel, cityName, cityNamePrep, lat, lon, setLocation]);

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
              <MapSlot ads={[]} cityLabel={cityLabel} category={categoryKey} />
            </div>
            <GalleryTopPanel viewType={viewType} setViewType={setViewType} />

            <InfiniteScrollAds
              cityLabel={cityLabel}
              category={categoryKey}
              searchParams={searchParams}
              renderAd={(ad) =>
                viewType === 'gallery' ? (
                  <div key={ad.id} className="h-full">
                    <GalleryAdCard ad={ad} />
                  </div>
                ) : (
                  <AdCardsDefault key={ad.id} ads={[ad]} />
                )
              }
              className={
                viewType === 'gallery'
                  ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'space-y-6'
              }
            />
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
