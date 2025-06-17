import { useState } from 'react';
import { mockAds } from '@/data/mockAds';
import GalleryAdCard from '../gallery-ad-card/gallery-ad-card';

export default function HomePageFreshAndRecommendedAdsBlock() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'fresh'>(
    'recommend'
  );
  const [ads, setAds] = useState(mockAds);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mx-4 mb-10">
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('recommend')}
          className={`px-4 py-2 font-semibold hover:cursor-pointer border-b-2 border-transparent ${
            activeTab === 'recommend'
              ? 'border-violet-600 text-violet-600'
              : 'text-stone-400 hover:text-gray-400'
          }`}
        >
          Рекомендации
        </button>
        <button
          onClick={() => setActiveTab('fresh')}
          className={`ml-4 px-4 py-2 font-semibold hover:cursor-pointer border-b-2 border-transparent ${
            activeTab === 'fresh'
              ? 'border-violet-600 text-violet-600'
              : 'text-stone-400 hover:text-gray-400'
          }`}
        >
          Свежие
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
        {ads.map((ad) => {
          return (
            <div key={ad.id} className="h-full">
              <GalleryAdCard ad={ad} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
