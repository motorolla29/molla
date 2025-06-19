import { useEffect, useRef, useState } from 'react';
import { categoryOptions } from '@/const';
import Link from 'next/link';
import { useLocationStore } from '@/store/useLocationStore';
import LocationModal from '../location-modal/location-modal';
import { MapPinIcon } from '@heroicons/react/24/outline';

export default function TopSearchPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { cityName, setLocation } = useLocationStore();
  const dropdownRef = useRef<HTMLDivElement>(null); // <== ссылка на dropdown

  // Закрытие по клику вне dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterDropdown]);

  return (
    <div className="bg-white sticky px-4 top-10 z-10">
      <div className="mx-auto py-3 flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowFilterDropdown((prev) => !prev)}
            className="p-2 rounded-md hover:bg-violet-100 cursor-pointer"
            aria-label="Фильтры"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 fill-stone-800"
            >
              <path
                fillRule="evenodd"
                d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {showFilterDropdown && (
            <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="p-2 text-sm font-medium text-gray-700">
                Выберете категорию
              </div>
              <div className="flex flex-col pb-3">
                {categoryOptions.map((opt) => (
                  <div key={opt.key} className="flex items-center px-2">
                    <img
                      src={`https://ik.imagekit.io/motorolla29/molla/icons/${opt.key}.png`}
                      alt="cat-icon"
                      className="w-6 h-6 aspect-auto mr-1"
                    />
                    <span className="flex items-center text-stone-800 px-1 py-1 hover:bg-gray-50 rounded-sm cursor-pointer">
                      {opt.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Поисковая строка */}
        <div className="flex-1 relative min-w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Найти объявления..."
            className="w-full pl-4 pr-24 py-2 border outline-none border-gray-300 rounded-full focus:border-violet-300"
          />
          <button
            onClick={() => {}}
            className="absolute outline-none right-0 top-0 h-full px-4 cursor-pointer bg-violet-400 text-white rounded-full hover:bg-violet-500"
          >
            Найти
          </button>
        </div>
        <button
          onClick={() => setShowLocationModal(true)}
          className="ml-2 text-md flex items-center font-semibold text-neutral-500 hover:opacity-80 cursor-pointer"
        >
          <MapPinIcon className="size-6" />
          <span className="ml-1 leading-none line-clamp-2 min-w-0 max-w-[200px]">
            {cityName}
          </span>
        </button>
        <div className="ml-8">
          <Link
            href={'/ad/create'}
            className="flex justify-center items-center ml-4 px-4 py-2 text-white bg-amber-500 rounded-md hover:bg-amber-600"
          >
            Разместить объявление
          </Link>
        </div>
      </div>
      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onSelect={(label, nameNom, namePrep, lat, lon) => {
            setLocation(label, nameNom, namePrep, lat, lon);
            setShowLocationModal(false);
          }}
        />
      )}
    </div>
  );
}
