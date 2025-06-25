import { useEffect, useRef, useState } from 'react';
import { categoryOptions } from '@/const';
import Link from 'next/link';
import { useLocationStore } from '@/store/useLocationStore';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsVerticalIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import FiltersMobile from '../filters-mobile/filters-mobile';

interface TopSearchPanelMobileProps {
  setFiltersVisible: (value: boolean) => void;
}

export default function TopSearchPanelMobile({
  setFiltersVisible,
}: TopSearchPanelMobileProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const { cityLabel } = useLocationStore();
  const dropdownRef = useRef<HTMLDivElement>(null); // <== ссылка на dropdown

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Логика поиска: можете перенаправить на страницу результатов:
    // например: router.push(`/${cityLabel}/search?term=${encodeURIComponent(searchTerm)}`)
    console.log('Search for:', searchTerm, 'in city', cityLabel);
  };

  return (
    <>
      <div className="lg:hidden bg-white mx-auto py-3 flex items-center gap-2 sticky top-10 z-9">
        {/* Строка поиска с иконкой внутри */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative min-w-0">
          {/* Иконка поиска слева */}
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Найти объявления..."
            className="w-full pl-10 pr-4 py-2 border outline-none border-gray-300 rounded-full focus:border-violet-300"
          />
          {/* Если нужен крестик для очистки */}
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Очистить"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </form>

        {/* Кнопка фильтры справа */}
        <button
          onClick={() => setFiltersVisible(true)}
          className="p-2 bg-violet-100 rounded-md cursor-pointer flex-shrink-0"
          aria-label="Фильтры"
        >
          <AdjustmentsHorizontalIcon className="w-6 h-6 text-stone-800" />
        </button>
      </div>
    </>
  );
}
