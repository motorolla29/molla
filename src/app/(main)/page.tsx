'use client';

import MapSlot from '@/components/map-slot/map-slot';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import TopSearchPanelMobile from '@/components/top-search-panel-mobile/top-search-panel-mobile';
import HomePageFreshAndRecommendedAdsBlock from '@/components/home-page-fresh-and-recommended-ads-block/home-page-fresh-and-recommended-ads-block';
import { useState, Suspense, useEffect } from 'react';
import FiltersMobile from '@/components/filters-mobile/filters-mobile';
import LocationModal from '@/components/location-modal/location-modal';
import { useLocationStore } from '@/store/useLocationStore';

export default function Home() {
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { cityLabel, cityName, cityNamePreposition, lat, lon, setLocation } =
    useLocationStore();

  // Инициализация searchTerm из URL для главной страницы
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const searchParam = urlSearchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    } else {
      setSearchTerm('');
    }
  }, []);
  return (
    <Suspense>
      <div className="min-h-screen">
        <div className="sticky top-12 lg:top-15 z-10 bg-white">
          <div className="mx-4">
            <TopSearchPanel
              categoryKey={null}
              categoryName={null}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onLocationModalOpen={() => setShowLocationModal(true)}
            />
            <TopSearchPanelMobile
              categoryKey={null}
              categoryName={null}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setFiltersVisible={setMobileFiltersVisible}
            />
          </div>
        </div>
        <div className="mx-4 my-4 space-y-6">
          <MapSlot ads={[]} />
        </div>
        <HomePageFreshAndRecommendedAdsBlock />
        {/* Модал/Overlay с фильтрами во весь экран для мобильных */}
        <FiltersMobile
          isVisible={mobileFiltersVisible}
          category={null}
          cityLabel={cityLabel}
          cityName={cityName}
          cityNamePrep={cityNamePreposition}
          lat={lat}
          lon={lon}
          searchTerm={searchTerm}
          setFiltersVisible={(bool: boolean) => setMobileFiltersVisible(bool)}
        />

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
