import { useState } from 'react';
import { categoryOptions } from '@/const';
import Link from 'next/link';

export default function TopSearchPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  return (
    <div className="bg-white sticky px-4 top-10 z-10">
      <div className="mx-auto py-3 flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown((prev) => !prev)}
            className="p-2 rounded-md hover:bg-violet-100"
            aria-label="Фильтры"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 cursor-pointer fill-stone-800"
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
        <div className="flex-1 relative">
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

        <div>
          <Link
            href={'/ad/create'}
            className="flex justify-center items-center ml-2 px-4 py-2 text-white bg-amber-500 rounded-md hover:bg-amber-600"
          >
            Разместить объявление
          </Link>
        </div>
      </div>
    </div>
  );
}
