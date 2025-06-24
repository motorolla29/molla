'use client';

import { useEffect, useState } from 'react';
import { useLocationStore } from '@/store/useLocationStore';
import LocationModal from '../location-modal/location-modal';
import { categoryOptions } from '@/const';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';

interface FiltersMobileProps {
  onClose: () => void;
  // при применении фильтров можно передать выбранные значения:
  onApply: (filters: {
    cityLabel: string | null;
    cityName: string | null;
    minPrice: string;
    maxPrice: string;
    categoryKey: string | null;
    isVip: boolean;
    timeFilter: 'all' | '7' | '24';
  }) => void;
}

/**
 * Мобильный экран фильтров.
 * Читает текущее city из стора для инициализации локального состояния.
 * При выборе города через LocationModal обновляет локально.
 * При Apply вызывает onApply с выбранными значениями и закрывает себя.
 */
export default function FiltersMobile({
  onClose,
  onApply,
}: FiltersMobileProps) {
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

  // Локальное состояние фильтров:
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

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | '7' | '24'>('all');

  // При монтировании и при изменении стора синхронизируем начальное состояние
  useEffect(() => {
    setCityLabel(storeCityLabel ?? null);
    setCityName(storeCityName ?? null);
    setCityPrep(storeCityPrep ?? null);
    setLat(storeLat ?? null);
    setLon(storeLon ?? null);
  }, [storeCityLabel, storeCityName, storeCityPrep, storeLat, storeLon]);

  // Блокировка скролла фона
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Сброс локального состояния к начальному (по стору или пустому)
  const handleReset = () => {
    setCityLabel(storeCityLabel ?? null);
    setCityName(storeCityName ?? null);
    setCityPrep(storeCityPrep ?? null);
    setLat(storeLat ?? null);
    setLon(storeLon ?? null);
    setMinPrice('');
    setMaxPrice('');
    setCategoryKey(null);
    setIsVip(false);
    setTimeFilter('all');
  };

  // Применение: сохраняем город в сторе и вызываем onApply с текущими фильтрами
  const handleApply = () => {
    if (cityLabel && cityName && cityPrep) {
      // обновляем стор локации
      setLocation(cityLabel, cityName, cityPrep, lat, lon);
    }
    onApply({
      cityLabel,
      cityName,
      minPrice,
      maxPrice,
      categoryKey,
      isVip,
      timeFilter,
    });
    onClose();
  };

  // Отображаемое имя города: если null, показываем «Город не выбран» или «Все города»
  const displayCity =
    cityLabel === 'russia' ? 'Все города' : cityName || 'Город не выбран';

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col pb-[env(safe-area-inset-bottom)]">
      {/* Хедер */}
      <div className="flex items-center justify-between p-4 shadow-md">
        <h2 className="text-lg font-medium">Фильтры</h2>
        <button onClick={onClose} className="p-2">
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
              className="flex-1 min-w-0 bg-white border border-gray-300 rounded-md p-2"
              min={0}
            />
            <input
              type="number"
              placeholder="До"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="flex-1 min-w-0 bg-white border border-gray-300 rounded-md p-2"
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
            className="w-full py-2 bg-violet-400 text-white rounded-full hover:bg-violet-500"
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
    </div>
  );
}
