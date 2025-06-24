'use client';

import MapSlot from '@/components/map-slot/map-slot';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import HomePageFreshAndRecommendedAdsBlock from '@/components/home-page-fresh-and-recommended-ads-block/home-page-fresh-and-recommended-ads-block';
import { mockAds } from '@/data/mockAds';
import TopSearchPanelMobile from '@/components/top-search-panel-mobile/top-search-panel-mobile';

export default function Home() {
  return (
    <div className="min-h-screen">
      <TopSearchPanel />
      <TopSearchPanelMobile />
      <div className="mx-4 my-4 space-y-6">
        <MapSlot ads={mockAds} />
      </div>
      <HomePageFreshAndRecommendedAdsBlock />
    </div>
  );
}
