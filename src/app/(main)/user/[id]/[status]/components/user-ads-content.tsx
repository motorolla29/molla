'use client';

import { useState, useEffect } from 'react';
import PaginatedAds from '@/components/paginated-ads/paginated-ads';
import ScrollableTabs, {
  type ScrollableTabItem,
} from '@/components/tabs/scrollable-tabs';

interface UserAdsContentProps {
  userId: string;
  currentStatus: 'active' | 'archived';
  adsCounts?: { active: number; archived: number };
}

export default function UserAdsContent({
  userId,
  currentStatus: initialStatus,
  adsCounts,
}: UserAdsContentProps) {
  const [currentStatus, setCurrentStatus] = useState<'active' | 'archived'>(
    initialStatus,
  );

  // Синхронизируем состояние с URL при первой загрузке
  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  const handleTabChange = async (newStatus: 'active' | 'archived') => {
    if (newStatus === currentStatus) return;

    setCurrentStatus(newStatus);

    // Обновляем URL через history API без перезагрузки страницы
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/user/${userId}/${newStatus}`);
    }
  };

  const items: ScrollableTabItem[] = [
    {
      id: 'active',
      label: 'Активные',
      count: adsCounts?.active ?? 0,
      countClassName: 'bg-violet-500 text-white',
    },
    {
      id: 'archived',
      label: 'Завершенные',
      count: adsCounts?.archived ?? 0,
      countClassName: 'bg-gray-500 text-white',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Вкладки */}
      <div className="max-[350px]:px-2 px-6 pt-4 border-b border-gray-100">
        <ScrollableTabs
          items={items}
          activeId={currentStatus}
          onChange={(id) => handleTabChange(id as 'active' | 'archived')}
          showBaseLine={false}
          itemSpacingClassName="ml-2 sm:ml-4"
          activeTextClassName="text-violet-700"
          inactiveTextClassName="text-gray-500 hover:text-gray-700"
          indicatorClassName="pointer-events-none absolute bottom-0 h-[2px] bg-violet-400 rounded-full transition-[left,width] duration-300 ease-out"
          scrollClassName="flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-thumb-rounded-full scrollbar-track-transparent pt-1 pb-4"
        />
      </div>

      {/* Контент вкладки */}
      <div className="max-[350px]:p-2 p-6">
        <PaginatedAds
          userId={userId}
          status={currentStatus}
          showEndMessage={true}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          limit={12}
        />
      </div>
    </div>
  );
}
