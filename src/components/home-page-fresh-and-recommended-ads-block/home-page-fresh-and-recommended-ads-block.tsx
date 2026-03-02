import { useEffect, useRef, useState } from 'react';
import InfiniteScrollAds from '../infinite-scroll-ads/infinite-scroll-ads';
import { getOrCreateUserToken } from '@/utils';
import { useViewedAdsStore } from '@/store/useViewedAdsStore';

type HomeTabs = 'recommend' | 'fresh' | 'viewed';

export default function HomePageFreshAndRecommendedAdsBlock() {
  const [activeTab, setActiveTab] = useState<HomeTabs>('recommend');
  const [hasViewedAds, setHasViewedAds] = useState<boolean | null>(null);
  const localViewedCount = useViewedAdsStore((state) => state.viewedIds.size);

  const recommendRef = useRef<HTMLButtonElement | null>(null);
  const freshRef = useRef<HTMLButtonElement | null>(null);
  const viewedRef = useRef<HTMLButtonElement | null>(null);
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({
    left: 0,
    width: 0,
  });

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

  // Обновляем позицию анимированного индикатора под активной вкладкой
  useEffect(() => {
    const tabList = tabListRef.current;
    if (!tabList) return;

    let el: HTMLButtonElement | null = null;
    if (activeTab === 'recommend') el = recommendRef.current;
    else if (activeTab === 'fresh') el = freshRef.current;
    else if (activeTab === 'viewed') el = viewedRef.current;

    if (el) {
      const left = el.offsetLeft;
      const width = el.offsetWidth;
      setIndicatorStyle({ left, width });
    }
  }, [activeTab, hasViewedAds]);

  const handleTabClick = (
    tab: HomeTabs,
    ref?: React.RefObject<HTMLButtonElement>,
  ) => {
    setActiveTab(tab);
    if (ref?.current) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  const showViewedTab = hasViewedAds === true;

  return (
    <div className="bg-white mx-4 mb-6">
      <div className="relative mb-6">
        <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full scrollbar-track-transparent pb-1">
          <div
            ref={tabListRef}
            className="relative flex items-center w-max min-w-full"
          >
            <button
              ref={recommendRef}
              onClick={() => handleTabClick('recommend', recommendRef)}
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                activeTab === 'recommend'
                  ? 'text-violet-400'
                  : 'text-neutral-400 hover:text-gray-400'
              }`}
            >
              Рекомендации
            </button>
            <button
              ref={freshRef}
              onClick={() => handleTabClick('fresh', freshRef)}
              className={`ml-2 sm:ml-4 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                activeTab === 'fresh'
                  ? 'text-violet-400'
                  : 'text-neutral-400 hover:text-gray-400'
              }`}
            >
              Свежие
            </button>
            {showViewedTab && (
              <button
                ref={viewedRef}
                onClick={() => handleTabClick('viewed', viewedRef)}
                className={`ml-2 sm:ml-4 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer whitespace-nowrap transition-colors duration-150 ${
                  activeTab === 'viewed'
                    ? 'text-violet-400'
                    : 'text-neutral-400 hover:text-gray-400'
                }`}
              >
                Вы смотрели
              </button>
            )}

            {/* Анимированный нижний бордер, который "ездит" поверх серого */}
            <div
              className="pointer-events-none absolute bottom-0 h-[2px] bg-violet-400 rounded-full transition-[left,width] duration-300 ease-out z-1"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
          </div>
        </div>

        {/* серый нижний бордер */}
        <div className="pointer-events-none absolute bottom-1 h-px w-full bg-gray-200 rounded-full" />
      </div>

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
