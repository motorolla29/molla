'use client';

import MapSlot from '@/components/map-slot/map-slot';
import TopSearchPanel from '@/components/top-search-panel/top-search-panel';
import HomePageFreshAndRecommendedAdsBlock from '@/components/home-page-fresh-and-recommended-ads-block/home-page-fresh-and-recommended-ads-block';
import { mockAds } from '@/data/mockAds';

export default function Home() {
  return (
    <div className="min-h-screen">
      <TopSearchPanel />
      <div className="px-4 py-6 space-y-6">
        <MapSlot ads={mockAds} />
      </div>
      <HomePageFreshAndRecommendedAdsBlock />
    </div>
  );
}
