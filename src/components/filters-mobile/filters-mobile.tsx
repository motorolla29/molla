'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import LocationModal from '../location-modal/location-modal';
import { categoryOptions } from '@/const';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';

interface FiltersMobileProps {
  setFiltersVisible: (bool: boolean) => void;
  category: string | null;
  cityLabel: string | null;
  cityName: string | null;
  cityNamePrep: string | null;
  lat: number | null;
  lon: number | null;
}

export default function FiltersMobile({
  setFiltersVisible,
  category,
  cityLabel: pageCityLabel,
  cityName: pageCityName,
  cityNamePrep: pageCityNamePrep,
  lat: pageLat,
  lon: pageLon,
}: FiltersMobileProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasUrlFilters = ['minPrice', 'maxPrice', 'vip', 'time'].some((key) =>
    searchParams.has(key)
  );
  const {
    cityLabel: storeCityLabel,
    cityName: storeCityName,
    cityNamePreposition: storeCityPrep,
    lat: storeLat,
    lon: storeLon,
    setLocation,
  } = useLocationStore();

  // Локальное состояние фильтров - инициализируем из пропов страницы:
  const [cityLabel, setCityLabel] = useState<string | null>(
    pageCityLabel ?? null
  );
  const [cityName, setCityName] = useState<string | null>(pageCityName ?? null);
  const [cityPrep, setCityPrep] = useState<string | null>(
    pageCityNamePrep ?? null
  );
  const [lat, setLat] = useState<number | null>(pageLat ?? null);
  const [lon, setLon] = useState<number | null>(pageLon ?? null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [categoryKey, setCategoryKey] = useState<string | null>(category);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | '7' | '24'>('all');

  // Инициализация из URL при монтировании
  useEffect(() => {
    const sp = Object.fromEntries(searchParams.entries());
    if (sp.minPrice) setMinPrice(sp.minPrice);
    if (sp.maxPrice) setMaxPrice(sp.maxPrice);
    if (sp.categoryKey) setCategoryKey(sp.categoryKey);
    if (sp.vip) setIsVip(true);
    if (sp.time === '7' || sp.time === '24') {
      setTimeFilter(sp.time);
    } else {
      setTimeFilter('all');
    }
    // Город из стора уже синхронизирован в useEffect ниже
  }, []);

  // Синхронизация с пропами страницы
  useEffect(() => {
    setCityLabel(pageCityLabel ?? null);
    setCityName(pageCityName ?? null);
    setCityPrep(pageCityNamePrep ?? null);
    setLat(pageLat ?? null);
    setLon(pageLon ?? null);
  }, [pageCityLabel, pageCityName, pageCityNamePrep, pageLat, pageLon]);

  const displayCity =
    cityLabel === 'russia' ? 'Все города' : cityName || 'Город не выбран';

  const buildPath = () => {
    const segments = [];
    if (cityLabel) segments.push(cityLabel);
    if (categoryKey) segments.push(categoryKey);
    return '/' + segments.join('/');
  };

  // Блокировка скролла фона
  useEffect(() => {
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, []);

  const handleApply = () => {
    // обновляем стор локации
    if (cityLabel && cityName && cityPrep) {
      setLocation(cityLabel, cityName, cityPrep, lat, lon);
    }
    // Формируем query-параметры только для фильтров, не затрагивая routing-параметры
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (isVip) params.set('vip', '1');
    if (timeFilter && timeFilter !== 'all') params.set('time', timeFilter);
    const queryString = params.toString();
    const path = buildPath();
    router.push(path + (queryString ? `?${params.toString()}` : ''));
    setFiltersVisible(false);
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    setIsVip(false);
    setTimeFilter('all');
    setCategoryKey(null); // Сбрасываем категорию
    const params = new URLSearchParams(searchParams.toString());

    // удаляем только фильтры
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('vip');
    params.delete('time');
    // НЕ трогаем search и sort

    // При сбросе переходим на страницу города без категории
    const cityPath = cityLabel ? `/${cityLabel}` : '/russia';
    const qs = params.toString();
    router.push(cityPath + (qs ? `?${qs}` : ''));
    setFiltersVisible(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col pb-[env(safe-area-inset-bottom)]">
      {/* Хедер */}
      <div className="flex items-center justify-between p-4 shadow-md">
        <h2 className="text-lg font-medium">Фильтры</h2>
        <button onClick={() => setFiltersVisible(false)} className="p-2">
          <XMarkIcon className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Содержимое: прокручиваемая область */}
      <div className="flex-1 overflow-auto p-4 space-y-6 mb-10">
        {/* Фильтр по городу */}
        <div>
          <h3 className="text-md font-semibold mb-2">Город</h3>
          <button
            onClick={() => setShowLocationModal(true)}
            className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50"
          >
            <span className="truncate">{displayCity}</span>
            {/* Стрелка вправо */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Фильтр по цене */}
        <div>
          <h3 className="text-md font-semibold mb-2">Цена</h3>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="От"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="flex-1 min-w-0 bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-amber-500"
              min={0}
            />
            <input
              type="number"
              placeholder="До"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="flex-1 min-w-0 bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-amber-500"
              min={0}
            />
          </div>
        </div>

        {/* Выбор категории (1 из 4) */}
        <div>
          <h3 className="text-md font-semibold mb-2">Категория</h3>
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.slice(0, 4).map((opt) => {
              const selected = categoryKey === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setCategoryKey(selected ? null : opt.key)}
                  className={`flex items-center px-3 py-2 border rounded-md ${
                    selected
                      ? 'bg-violet-100 border-violet-400'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={`https://ik.imagekit.io/motorolla29/molla/icons/${opt.key}.png`}
                    alt={opt.label}
                    className="w-5 h-5 mr-2"
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* VIP объявления */}
        <div className="flex items-center">
          <input
            id="vip-checkbox"
            type="checkbox"
            checked={isVip}
            onChange={(e) => setIsVip(e.target.checked)}
            className="h-4 w-4 text-violet-500 border-gray-300 rounded"
          />
          <label htmlFor="vip-checkbox" className="ml-2 select-none">
            Только VIP объявления
          </label>
        </div>

        {/* Фильтр по времени размещения */}
        <div>
          <h3 className="text-md font-semibold mb-2">Размещено</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="timeFilter"
                value="all"
                checked={timeFilter === 'all'}
                onChange={() => setTimeFilter('all')}
                className="h-4 w-4 text-violet-500 border-gray-300"
              />
              <span className="ml-2 select-none">За все время</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="timeFilter"
                value="7"
                checked={timeFilter === '7'}
                onChange={() => setTimeFilter('7')}
                className="h-4 w-4 text-violet-500 border-gray-300"
              />
              <span className="ml-2 select-none">За 7 дней</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="timeFilter"
                value="24"
                checked={timeFilter === '24'}
                onChange={() => setTimeFilter('24')}
                className="h-4 w-4 text-violet-500 border-gray-300"
              />
              <span className="ml-2 select-none">За 24 часа</span>
            </label>
          </div>
        </div>
        {/* Футер с кнопками */}
        <div className="p-4 border-t border-violet-400/50 bg-white">
          <button
            onClick={handleApply}
            className="w-full py-2 text-white rounded-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700"
          >
            Применить
          </button>
          {(hasUrlFilters || null) && (
            <button
              onClick={handleReset}
              className="w-full py-2 mt-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      </div>

      {/* Модал выбора города */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={(label, nameNom, namePrep, selLat, selLon) => {
          setCityLabel(label);
          setCityName(nameNom);
          setCityPrep(namePrep);
          setLat(selLat);
          setLon(selLon);
          setShowLocationModal(false);
        }}
      />
    </div>
  );
}
