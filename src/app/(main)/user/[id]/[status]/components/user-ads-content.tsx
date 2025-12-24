'use client';

import { useState, useEffect } from 'react';
import PaginatedAds from '@/components/paginated-ads/paginated-ads';

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
    initialStatus
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Вкладки */}
      <div className="flex items-center px-6 py-4 border-b border-gray-100">
        <button
          onClick={() => handleTabChange('active')}
          className={`relative px-4 py-2 text-sm sm:text-base font-semibold border-b-2 border-transparent transition-colors ${
            currentStatus === 'active'
              ? 'border-violet-400 text-violet-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Активные
          {!!adsCounts?.active && adsCounts.active > 0 && (
            <span className="absolute -top-px -right-px sm:-top-[3px] sm:-right-[3px] bg-violet-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 flex items-center justify-center px-[6px]">
              {adsCounts.active}
            </span>
          )}
        </button>
        <button
          onClick={() => handleTabChange('archived')}
          className={`relative ml-6 px-4 py-2 text-sm sm:text-base font-semibold border-b-2 border-transparent transition-colors ${
            currentStatus === 'archived'
              ? 'border-violet-400 text-violet-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Завершенные
          {!!adsCounts?.archived && adsCounts.archived > 0 && (
            <span className="absolute -top-px -right-px sm:-top-[3px] sm:-right-[3px] bg-gray-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full min-w-[16px] h-4 sm:min-w-[20px] sm:h-5 flex items-center justify-center px-[6px]">
              {adsCounts.archived}
            </span>
          )}
        </button>
      </div>

      {/* Контент вкладки */}
      <div className="p-6">
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
