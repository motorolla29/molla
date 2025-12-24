'use client';

import { useState } from 'react';
import InfiniteScrollAds from '@/components/infinite-scroll-ads/infinite-scroll-ads';

interface UserAdsTabsProps {
  userId: string;
}

export default function UserAdsTabs({ userId }: UserAdsTabsProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Mock данные для счетчиков
  const activeCount = 5;
  const archivedCount = 2;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Вкладки */}
      <div className="flex items-center px-6 py-4 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('active')}
          className={`relative px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent transition-colors ${
            activeTab === 'active'
              ? 'border-violet-400 text-violet-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Активные
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`relative ml-6 px-4 py-2 text-sm sm:text-base font-semibold hover:cursor-pointer border-b-2 border-transparent transition-colors ${
            activeTab === 'archived'
              ? 'border-violet-400 text-violet-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Завершенные
          {archivedCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {/* Контент вкладки */}
      <div className="p-6">
        <InfiniteScrollAds
          viewType="gallery"
          showEndMessage={true}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
          // Для демонстрации используем общий поиск, в реальности нужно добавить фильтр по userId
          cityLabel="moscow"
          limit={12}
        />
      </div>
    </div>
  );
}
