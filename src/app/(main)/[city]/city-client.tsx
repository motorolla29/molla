'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import AsideFilters from '@/components/aside-filters/aside-filters';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import TopSearchPanelMobile from '@/components/top-search-panel-mobile/top-search-panel-mobile';
import LocationModal from '@/components/location-modal/location-modal';
import FiltersMobile from '@/components/filters-mobile/filters-mobile';
import { useSearchParams } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';
import GalleryTopPanel from '@/components/gallery-top-panel/gallery-top-panel';
import MapSlot from '@/components/map-slot/map-slot';
import InfiniteScrollAds from '@/components/infinite-scroll-ads/infinite-scroll-ads';

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
  const [viewType, setViewType] = useState<'gallery' | 'default'>('default');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const handleViewTypeChange = (type: 'gallery' | 'default') => {
    setViewType(type);
  };
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
          categoryKey={null}
          categoryName={null}
          onLocationModalOpen={() => setShowLocationModal(true)}
        />
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

        <div className="flex gap-6 max-w-full flex-wrap lg:flex-nowrap">
          {/* Sidebar - фильтры*/}
          <AsideFilters category={null} />

          {/* Основной блок с объявлениями */}

          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <MapSlot ads={[]} />
            </div>
            <GalleryTopPanel
              viewType={viewType}
              setViewType={handleViewTypeChange}
            />

            <InfiniteScrollAds
              cityLabel={cityLabel}
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
            category={null}
            setFiltersVisible={(bool: boolean) => setMobileFiltersVisible(bool)}
          />
        )}

        {/* Модальное окно выбора локации */}
        {showLocationModal && (
          <LocationModal
            onClose={() => setShowLocationModal(false)}
            onSelect={(label, nameNom, namePrep, lat, lon) => {
              setLocation(label, nameNom, namePrep, lat, lon);
              setShowLocationModal(false);
            }}
          />
        )}
      </div>
    </Suspense>
  );
}
