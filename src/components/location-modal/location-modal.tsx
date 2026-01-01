'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocationStore } from '@/store/useLocationStore';
import { CityRaw } from '@/types/city-raw';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';

interface Suggestion {
  label: string;
  nameNominative: string;
  namePrepositional: string;
  lat: number;
  lon: number;
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (
    cityLabel: string,
    cityName: string,
    cityNamePreposition: string,
    lat: number | null,
    lon: number | null
  ) => void;
  saveToStorage?: boolean;
  disableScrollLock?: boolean;
}

// Анимации для модального окна
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 10,
  },
};

let citiesData: CityRaw[] | null = null;
async function loadCitiesData(): Promise<CityRaw[]> {
  if (!citiesData) {
    // динамический импорт JSON; Next.js вынесет его в отдельный чанк
    const mod = await import('@/lib/russia-cities.json');
    const data = (mod as any).default ?? (mod as any);
    if (Array.isArray(data)) {
      citiesData = data;
    } else {
      console.error('Ошибка: russia-cities.json не является массивом');
      citiesData = [];
    }
  }
  return citiesData;
}

async function fetchCitySuggestions(query: string): Promise<Suggestion[]> {
  const term = query.trim().toLowerCase();
  if (term.length < 2) return [];

  const data = await loadCitiesData();
  const results: Suggestion[] = [];
  for (const item of data) {
    // Получаем именительный падеж или обычное name
    const nameNom = item.namecase?.nominative ?? item.name;
    if (!nameNom) continue;
    if (nameNom.toLowerCase().startsWith(term)) {
      const label = item.label;
      if (!label) continue;
      const coords = item.coords;
      if (
        coords &&
        typeof coords.lat === 'number' &&
        typeof coords.lon === 'number'
      ) {
        const namePrep = item.namecase?.prepositional ?? nameNom;
        results.push({
          label,
          nameNominative: nameNom,
          namePrepositional: namePrep,
          lat: coords.lat,
          lon: coords.lon,
        });
      }
      if (results.length >= 10) break;
    }
  }
  return results;
}

export default function LocationModal({
  isOpen,
  onClose,
  onSelect,
  saveToStorage = false,
  disableScrollLock = false,
}: LocationModalProps) {
  const {
    cityName: currentCityName,
    cityLabel: currentCityLabel,
    cityNamePreposition: currentCityPrepositional,
    lat: currentLat,
    lon: currentLon,
  } = useLocationStore();

  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewLabel, setPreviewLabel] = useState<string | null>(
    currentCityLabel
  );
  const [previewNameNom, setPreviewNameNom] = useState<string | null>(
    currentCityName
  );
  const [previewNamePrep, setPreviewNamePrep] = useState<string | null>(
    currentCityPrepositional
  );
  const [previewLat, setPreviewLat] = useState<number | null>(
    currentLat ?? null
  );
  const [previewLon, setPreviewLon] = useState<number | null>(
    currentLon ?? null
  );

  const modalRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Предзагрузка JSON фоном (опционально)
  useEffect(() => {
    let canceled = false;
    loadCitiesData().catch((e) => {
      if (!canceled) console.error('Не удалось загрузить список городов', e);
    });
    return () => {
      canceled = true;
    };
  }, []);

  // Блокируем скролл страницы при открытом модальном окне
  useEffect(() => {
    if (!isOpen || disableScrollLock) return;

    lockScroll();

    return () => {
      setTimeout(() => {
        unlockScroll();
      }, 200);
    };
  }, [isOpen, disableScrollLock]);

  // Закрытие по клику вне
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Дебаунс подсказок
  useEffect(() => {
    const term = input.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!term || term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const items = await fetchCitySuggestions(term);
        setSuggestions(items);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('Ошибка при получении подсказок');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input]);

  // Синхронизируем preview состояния с текущими значениями из store
  useEffect(() => {
    setPreviewLabel(currentCityLabel);
    setPreviewNameNom(currentCityName);
    setPreviewNamePrep(currentCityPrepositional);
    setPreviewLat(currentLat ?? null);
    setPreviewLon(currentLon ?? null);
  }, [
    currentCityLabel,
    currentCityName,
    currentCityPrepositional,
    currentLat,
    currentLon,
  ]);

  // Очищаем состояния при закрытии модала
  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setSuggestions([]);
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  // Выбор подсказки
  const handleSelectSuggestion = (item: Suggestion) => {
    setPreviewLabel(item.label);
    setPreviewNameNom(item.nameNominative);
    setPreviewNamePrep(item.namePrepositional);
    setPreviewLat(item.lat);
    setPreviewLon(item.lon);
    setInput('');
    setSuggestions([]);
    setError(null);
  };

  // Применение
  const handleApply = () => {
    if (previewLabel === 'russia' && previewNameNom === 'Все города') {
      const cityLabel = 'russia';
      const cityName = 'Россия';
      const cityNamePreposition = 'России';
      const lat = null;
      const lon = null;

      onSelect(cityLabel, cityName, cityNamePreposition, lat, lon);

      if (saveToStorage) {
        try {
          localStorage.setItem(
            'userLocation',
            JSON.stringify({
              cityLabel,
              cityName,
              cityNamePreposition,
              lat,
              lon,
            })
          );
        } catch (e) {
          console.warn('Не удалось сохранить location в localStorage', e);
        }
      }
    } else if (
      previewLabel &&
      previewNameNom &&
      previewNamePrep &&
      previewLat != null &&
      previewLon != null
    ) {
      onSelect(
        previewLabel,
        previewNameNom,
        previewNamePrep,
        previewLat,
        previewLon
      );

      if (saveToStorage) {
        try {
          localStorage.setItem(
            'userLocation',
            JSON.stringify({
              cityLabel: previewLabel,
              cityName: previewNameNom,
              cityNamePreposition: previewNamePrep,
              lat: previewLat,
              lon: previewLon,
            })
          );
        } catch (e) {
          console.warn('Не удалось сохранить location в localStorage', e);
        }
      }
    }
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            className="bg-white rounded-xl w-full max-w-sm sm:max-w-md mx-3 sm:mx-4 p-3 sm:p-4 shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.35,
              ease: 'easeOut',
              type: 'spring',
              //damping: 20,
              //stiffness: 200,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-medium">
                Выберите город
              </h2>
              <button
                onClick={() => {
                  setPreviewLabel('russia');
                  setPreviewNameNom('Все города');
                  setPreviewNamePrep('России');
                  setPreviewLat(null);
                  setPreviewLon(null);
                  setInput('');
                  setSuggestions([]);
                  setError(null);
                }}
                className="text-sm sm:text-base underline text-violet-400 font-medium hover:text-violet-500"
              >
                Все города
              </button>
            </div>
            {/* Текущий город */}
            <div className="mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm text-neutral-600">
                Текущий город:
              </span>
              <div className="mt-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-md text-sm sm:text-base text-neutral-800">
                {previewLabel === 'russia'
                  ? 'Все города'
                  : previewNameNom || 'Не задан'}
              </div>
            </div>

            {/* Поле ввода */}
            <div className="relative mb-1.5 sm:mb-2">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(null);
                }}
                placeholder="Начните вводить город"
                className="w-full border border-gray-300 rounded-md pl-2 sm:pl-3 pr-8 sm:pr-10 py-1.5 sm:py-2 outline-none text-sm sm:text-base"
              />
              {loading && (
                <div className="absolute right-3 sm:right-4.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-500">
                  ...
                </div>
              )}
              {/* Подсказки */}
              {suggestions.length > 0 && (
                <ul className="absolute w-full top-full max-h-40 sm:max-h-48 overflow-auto border border-gray-200 rounded-md bg-white z-50">
                  {suggestions.map((item, idx) => (
                    <li
                      key={`${item.label}-${idx}`}
                      onClick={() => handleSelectSuggestion(item)}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 cursor-pointer text-sm sm:text-base"
                    >
                      {item.nameNominative}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Ошибка */}
            {error && (
              <p className="text-red-500 text-xs sm:text-sm mb-1.5 sm:mb-2">
                {error}
              </p>
            )}

            {/* Если ничего не найдено */}
            {!loading &&
              input.trim().length >= 2 &&
              suggestions.length === 0 && (
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  Ничего не найдено
                </p>
              )}

            {/* Кнопки */}
            <div className="mt-3 sm:mt-4 flex justify-end gap-1.5 sm:gap-2">
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm sm:text-base"
              >
                Отмена
              </button>
              <button
                onClick={handleApply}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-400 text-white rounded-md hover:bg-violet-500 text-sm sm:text-base"
              >
                Применить
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
