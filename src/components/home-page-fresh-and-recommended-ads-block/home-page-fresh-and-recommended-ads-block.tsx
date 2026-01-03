import { useState } from 'react';
import InfiniteScrollAds from '../infinite-scroll-ads/infinite-scroll-ads';

export default function HomePageFreshAndRecommendedAdsBlock() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'fresh'>(
    'recommend'
  );

  return (
    <div className="bg-white mx-4 mb-6">
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('recommend')}
          className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent ${
            activeTab === 'recommend'
              ? 'border-violet-400 text-violet-400'
              : 'text-neutral-400 hover:text-gray-400'
          }`}
        >
          Рекомендации
        </button>
        <button
          onClick={() => setActiveTab('fresh')}
          className={`ml-2 sm:ml-4 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent ${
            activeTab === 'fresh'
              ? 'border-violet-400 text-violet-400'
              : 'text-neutral-400 hover:text-gray-400'
          }`}
        >
          Свежие
        </button>
      </div>

      <InfiniteScrollAds
        cityLabel="russia"
        sort={activeTab === 'fresh' ? 'new' : undefined}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-4 pb-6"
        showEndMessage={true}
      />
    </div>
  );
}
