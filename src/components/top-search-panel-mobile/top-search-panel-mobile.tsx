'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocationStore } from '@/store/useLocationStore';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

interface TopSearchPanelMobileProps {
  categoryName: string | null;
  categoryKey: string | null;
  setFiltersVisible: (value: boolean) => void;
}

export default function TopSearchPanelMobile({
  categoryName,
  categoryKey,
  setFiltersVisible,
}: TopSearchPanelMobileProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const { cityLabel, cityNamePreposition } = useLocationStore();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmed) {
      params.set('search', trimmed); // заменит или добавит параметр search
    } else {
      params.delete('search'); // если строка пуста — удаляем параметр
    }

    const basePath = categoryKey
      ? `/${cityLabel}/${categoryKey}`
      : `/${cityLabel}`;

    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <>
      <div className="lg:hidden bg-white mx-auto py-3 flex items-center gap-2 sticky top-12 z-9">
        {/* Строка поиска с иконкой внутри */}
        <form onSubmit={handleSearchSubmit} className="flex-1 relative min-w-0">
          {/* Иконка поиска слева */}
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
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Найти ${
              categoryName ? categoryName.toLocaleLowerCase() : 'объявления'
            }${cityNamePreposition ? ` в ${cityNamePreposition}...` : '...'}`}
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
          <AdjustmentsHorizontalIcon className="w-6 h-6 text-neutral-800" />
        </button>
      </div>
    </>
  );
}
