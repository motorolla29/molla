'use client';

import MapSlot from '@/components/map-slot/map-slot';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import TopSearchPanelMobile from '@/components/top-search-panel-mobile/top-search-panel-mobile';
import HomePageFreshAndRecommendedAdsBlock from '@/components/home-page-fresh-and-recommended-ads-block/home-page-fresh-and-recommended-ads-block';
import { mockAds } from '@/data/mockAds';
import { useState, Suspense } from 'react';
import FiltersMobile from '@/components/filters-mobile/filters-mobile';

export default function Home() {
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  return (
    <Suspense>
      <div className="min-h-screen">
        <div className="sticky top-10 lg:top-15 z-9 bg-white">
          <div className="mx-4">
            <TopSearchPanel categoryKey={null} categoryName={null} />
            <TopSearchPanelMobile
              categoryKey={null}
              categoryName={null}
              setFiltersVisible={setMobileFiltersVisible}
            />
          </div>
        </div>
        <div className="mx-4 my-4 space-y-6">
          <MapSlot ads={mockAds} />
        </div>
        <HomePageFreshAndRecommendedAdsBlock />
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
