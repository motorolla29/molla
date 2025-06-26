'use client';

import { useLocationStore } from '@/store/useLocationStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LocationModal from '../location-modal/location-modal';
import { categoryOptions } from '@/const';

interface AsideFiltersProps {
  category: string | null;
}

export default function AsideFilters({ category }: AsideFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    cityLabel: storeCityLabel,
    cityName: storeCityName,
    cityNamePreposition: storeCityPrep,
    lat: storeLat,
    lon: storeLon,
    setLocation,
  } = useLocationStore();

  // Локальное состояние для мобильных фильтров
  const [cityLabel, setCityLabel] = useState<string | null>(
    storeCityLabel ?? null
  );
  const [cityName, setCityName] = useState<string | null>(
    storeCityName ?? null
  );
  const [cityPrep, setCityPrep] = useState<string | null>(
    storeCityPrep ?? null
  );
  const [lat, setLat] = useState<number | null>(storeLat ?? null);
  const [lon, setLon] = useState<number | null>(storeLon ?? null);
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

  // Синхронизация с глобальным стором
  useEffect(() => {
    setCityLabel(storeCityLabel ?? null);
    setCityName(storeCityName ?? null);
    setCityPrep(storeCityPrep ?? null);
    setLat(storeLat ?? null);
    setLon(storeLon ?? null);
  }, [storeCityLabel, storeCityName, storeCityPrep, storeLat, storeLon]);

  const displayCity =
    cityLabel === 'russia' ? 'Все города' : cityName || 'Город не выбран';

  const buildPath = () => {
    const segments = [];
    if (cityLabel) segments.push(cityLabel);
    if (categoryKey) segments.push(categoryKey);
    return '/' + segments.join('/');
  };

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
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());

    // удаляем только фильтры
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('vip');
    params.delete('time');
    // НЕ трогаем search и sort

    const path = buildPath();
    const qs = params.toString();
    router.push(path + (qs ? `?${qs}` : ''));
  };

  return (
    <aside className="hidden lg:flex w-1/3 h-fit flex-col flex-shrink-0 bg-amber-100 p-4 rounded-xl xl:w-1/4">
      {/* Город */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Город</h2>
        <button
          onClick={() => setShowLocationModal(true)}
          className="w-full flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 bg-white hover:bg-gray-50"
        >
          <span className="truncate">{displayCity}</span>
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
      {/* Цена */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Цена</h2>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="От"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-1/2 bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-amber-500"
            min={0}
          />
          <input
            type="number"
            placeholder="До"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-1/2 bg-white border border-gray-300 rounded-md p-2 focus:outline-none focus:border-amber-500"
            min={0}
          />
        </div>
      </div>
      {/* Категория */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Категория</h2>
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
      {/* VIP */}
      <div className="flex items-center mb-4">
        <input
          id="vip-aside"
          type="checkbox"
          checked={isVip}
          onChange={(e) => setIsVip(e.target.checked)}
          className="h-4 w-4 text-violet-500 border-gray-300 rounded"
        />
        <label htmlFor="vip-aside" className="ml-2 select-none cursor-pointer">
          Только VIP объявления
        </label>
      </div>
      {/* Время */}
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Размещено</h2>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="timeFilterAside"
              value="all"
              checked={timeFilter === 'all'}
              onChange={() => setTimeFilter('all')}
              className="h-4 w-4 text-violet-500 border-gray-300"
            />
            <span className="ml-2">За всё время</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="timeFilterAside"
              value="7"
              checked={timeFilter === '7'}
              onChange={() => setTimeFilter('7')}
              className="h-4 w-4 text-violet-500 border-gray-300"
            />
            <span className="ml-2">За 7 дней</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="timeFilterAside"
              value="24"
              checked={timeFilter === '24'}
              onChange={() => setTimeFilter('24')}
              className="h-4 w-4 text-violet-500 border-gray-300"
            />
            <span className="ml-2">За 24 часа</span>
          </label>
        </div>
      </div>
      {/* Кнопки */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={handleApply}
          className="text-white bg-violet-400 rounded-md hover:bg-violet-500 w-full h-10"
        >
          Применить
        </button>
        <button
          onClick={handleReset}
          className="text-stone-800 bg-stone-200 rounded-md w-full h-10"
        >
          Сбросить фильтры
        </button>
      </div>
      {/* Модал выбора города */}
      {showLocationModal && (
        <LocationModal
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
      )}
    </aside>
  );
}
