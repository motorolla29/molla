import { useEffect, useState } from 'react';
import InfiniteScrollAds from '../infinite-scroll-ads/infinite-scroll-ads';
import { getOrCreateUserToken } from '@/utils';
import { useViewedAdsStore } from '@/store/useViewedAdsStore';
import ScrollableTabs, {
  type ScrollableTabItem,
} from '@/components/tabs/scrollable-tabs';

type HomeTabs = 'recommend' | 'fresh' | 'viewed';

export default function HomePageFreshAndRecommendedAdsBlock() {
  const [activeTab, setActiveTab] = useState<HomeTabs>('recommend');
  const [hasViewedAds, setHasViewedAds] = useState<boolean | null>(null);
  const localViewedCount = useViewedAdsStore((state) => state.viewedIds.size);

  useEffect(() => {
    let isMounted = true;

    // 1. Быстрый путь: если уже есть локально помеченные объявления — сразу показываем вкладку
    if (localViewedCount > 0) {
      setHasViewedAds(true);
      return () => {
        isMounted = false;
      };
    }

    const checkViewedAds = async () => {
      try {
        const params = new URLSearchParams();
        params.set('limit', '1');

        try {
          const token = getOrCreateUserToken();
          params.set('localUserToken', token);
        } catch {
          // localStorage недоступен — полагаемся только на cookie userId
        }

        const res = await fetch(`/api/ads/viewed?${params.toString()}`);
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          setHasViewedAds(Array.isArray(data) && data.length > 0);
        } else {
          setHasViewedAds(false);
        }
      } catch {
        if (isMounted) setHasViewedAds(false);
      }
    };

    checkViewedAds();

    return () => {
      isMounted = false;
    };
  }, [localViewedCount]);

  const showViewedTab = hasViewedAds === true;

  return (
    <div className="bg-white mx-4 mb-6">
      <ScrollableTabs
        className="mb-6"
        scrollClassName="flex overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full scrollbar-track-transparent pb-1"
        itemSpacingClassName="ml-2 sm:ml-4"
        items={
          [
            { id: 'recommend', label: 'Рекомендации' },
            { id: 'fresh', label: 'Свежие' },
            showViewedTab ? { id: 'viewed', label: 'Вы смотрели' } : null,
          ].filter(Boolean) as ScrollableTabItem[]
        }
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as HomeTabs)}
      />

      <InfiniteScrollAds
        recommended={activeTab === 'recommend'}
        fresh={activeTab === 'fresh'}
        viewed={activeTab === 'viewed'}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-4 pb-6"
        showEndMessage={activeTab !== 'viewed'}
      />
    </div>
  );
}
