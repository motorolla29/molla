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
import MapSlot from '@/components/map-slot/map-slot';
import LocationModal from '@/components/location-modal/location-modal';

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
  const [viewType, setViewType] = useState<'gallery' | 'default'>('default');
  const handleViewTypeChange = (type: 'gallery' | 'default') => {
    setViewType(type);
  };
  const searchParams = useSearchParams();
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
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
          onLocationModalOpen={() => setShowLocationModal(true)}
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

        <div className="flex gap-6 max-w-full flex-wrap lg:flex-nowrap">
          <AsideFilters
            category={categoryKey}
            cityLabel={cityLabel}
            cityName={cityName}
            cityNamePrep={cityNamePrep}
            lat={lat}
            lon={lon}
          />

          {/* Основной блок */}
          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <MapSlot ads={[]} cityLabel={cityLabel} category={categoryKey} lat={lat} lon={lon} />
            </div>
            <GalleryTopPanel
              viewType={viewType}
              setViewType={handleViewTypeChange}
            />

            <InfiniteScrollAds
              cityLabel={cityLabel}
              category={categoryKey}
              searchParams={searchParams}
              viewType={viewType}
              className={
                viewType === 'gallery'
                  ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-6'
                  : 'pb-3'
              }
            />
          </main>
        </div>
        {/* Модал/Overlay с фильтрами во весь экран для мобильных */}
        {mobileFiltersVisible && (
          <FiltersMobile
            category={categoryKey}
            cityLabel={cityLabel}
            cityName={cityName}
            cityNamePrep={cityNamePrep}
            lat={lat}
            lon={lon}
            setFiltersVisible={(bool: boolean) => setMobileFiltersVisible(bool)}
          />
        )}

        {/* Модальное окно выбора локации */}
        <LocationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSelect={(label, nameNom, namePrep, lat, lon) => {
            setLocation(label, nameNom, namePrep, lat, lon);
            setShowLocationModal(false);
          }}
          saveToStorage={true}
        />
      </div>
    </Suspense>
  );
}
