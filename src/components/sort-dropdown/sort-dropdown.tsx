'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const OPTIONS = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'new', label: 'По новизне' },
  { value: 'price_asc', label: 'По стоимости' },
];

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(searchParams.get('sort') || 'default');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sortValue = searchParams.get('sort') || 'default';
    setCurrent(sortValue);
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (val: string) => {
    setCurrent(val);
    setOpen(false);

    const params = new URLSearchParams(Array.from(searchParams.entries())); // сохранить другие параметры
    if (val === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', val);
    }

    const queryString = params.toString();
    const path = `${window.location.pathname}${
      queryString ? '?' + queryString : ''
    }`;
    router.push(path);
  };

  const currentLabel =
    OPTIONS.find((opt) => opt.value === current)?.label ?? 'Сортировка';

  return (
    <div className="relative inline-block text-left min-w-38" ref={ref}>
      <button
        type="button"
        className="text-stone-800 inline-flex justify-between items-center w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{currentLabel}</span>
        <svg
          className={`stroke-stone-800 w-4 h-4 ml-2 transform ${
            open ? 'rotate-180' : 'rotate-0'
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

      {open && (
        <ul className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
          {OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                className={`w-full text-left text-nowrap px-4 py-2 hover:bg-gray-100 ${
                  opt.value === current ? 'text-violet-500' : 'text-stone-700 '
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
