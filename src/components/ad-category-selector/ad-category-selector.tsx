'use client';

import { useEffect, useRef, useState } from 'react';
import { CategoryKey } from '@/types/ad';
import { categoryOptions } from '@/const';

interface AdCategorySelectorProps {
  value: CategoryKey | '';
  onChange: (category: CategoryKey | '') => void;
}

export default function AdCategorySelector({
  value,
  onChange,
}: AdCategorySelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const selectedCategory = categoryOptions.find((opt) => opt.key === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs sm:text-sm font-medium mb-1">Категория</label>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base bg-white flex items-center justify-between"
      >
        <div className="flex items-center">
          {selectedCategory ? (
            <>
              <img
                src={`https://ik.imagekit.io/motorolla29/molla/icons/${selectedCategory.key}.png`}
                alt="cat-icon"
                className="w-5 h-5 mr-2"
              />
              <span>{selectedCategory.label}</span>
            </>
          ) : (
            <span className="text-gray-500">Выберите категорию</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {categoryOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                onChange(opt.key);
                setIsDropdownOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center border-b border-gray-100 last:border-b-0"
            >
              <img
                src={`https://ik.imagekit.io/motorolla29/molla/icons/${opt.key}.png`}
                alt="cat-icon"
                className="w-5 h-5 mr-2"
              />
              <span className="text-sm sm:text-base text-gray-900">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
