'use client';

import { useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { MobileSearchModal } from './mobile-search-modal';
import Portal from '@/components/portal/portal';

interface TopSearchPanelMobileProps {
  categoryName: string | null;
  categoryKey: string | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  setFiltersVisible: (value: boolean) => void;
}

export default function TopSearchPanelMobile({
  categoryName,
  categoryKey,
  searchTerm,
  setSearchTerm,
  setFiltersVisible,
}: TopSearchPanelMobileProps) {
  const { cityNamePreposition } = useLocationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const placeholder = `Найти ${
    categoryName ? categoryName.toLocaleLowerCase() : 'объявления'
  }${cityNamePreposition ? ` в ${cityNamePreposition}...` : '...'}`;

  return (
    <>
      {/* Мобильный хедер с исходным стилем инпута */}
      <div className="lg:hidden bg-white mx-auto py-3 flex items-center gap-2 sticky top-12 z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsModalOpen(true);
          }}
          className="flex-1 relative min-w-0"
        >
          <button
            type="submit"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Найти"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={searchTerm}
            onFocus={() => setIsModalOpen(true)}
            readOnly
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border outline-none border-gray-300 rounded-full focus:border-violet-300 truncate"
          />
        </form>

        {/* Кнопка фильтры справа */}
        <button
          onClick={() => setFiltersVisible(true)}
          className="p-2 bg-violet-100 rounded-md cursor-pointer shrink-0"
          aria-label="Фильтры"
        >
          <AdjustmentsHorizontalIcon className="w-6 h-6 text-neutral-800" />
        </button>
      </div>

      <Portal>
        <MobileSearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          categoryName={categoryName}
          categoryKey={categoryKey}
          initialQuery={searchTerm}
          onSearchApplied={(value) => setSearchTerm(value)}
        />
      </Portal>
    </>
  );
}
