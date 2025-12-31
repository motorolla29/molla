'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadCitiesData } from '@/utils';
import { CityRaw } from '@/types/city-raw';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (
    cityLabel: string,
    cityName: string,
    cityNamePreposition: string,
    lat: number | null,
    lon: number | null
  ) => void;
  currentCity?: string | null;
}

export default function CitySelectorModal({
  isOpen,
  onClose,
  onSelect,
  currentCity,
}: CitySelectorModalProps) {
  const [cities, setCities] = useState<CityRaw[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Загружаем города при открытии модала
  useEffect(() => {
    if (isOpen) {
      loadCities();
      // Фокус на поле ввода
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // Очищаем поиск при открытии
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Блокируем скролл страницы при открытом модальном окне
  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    return () => {
      // Ждем завершения анимации выхода перед разблокировкой скролла
      setTimeout(() => {
        unlockScroll();
      }, 200);
    };
  }, [isOpen]);

  // Закрытие по клику вне модального окна
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadCities = async () => {
    try {
      setIsLoading(true);
      const citiesData = await loadCitiesData();
      setCities(citiesData);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Фильтруем города по поисковому запросу
  const filteredCities = cities
    .filter((city) => {
      if (!searchTerm.trim()) {
        // Показываем крупные города (население > 500к) или столицы
        return (
          (city.population && city.population > 500000) ||
          city.isCapital === true
        );
      }
      const cityName = city.namecase?.nominative || city.name || '';
      return cityName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      // Сортируем по населению (по убыванию) только для крупных городов
      if (!searchTerm.trim()) {
        return (b.population || 0) - (a.population || 0);
      }
      return 0; // Для поиска оставляем порядок как есть
    })
    .slice(0, 20); // Ограничиваем до 20 результатов для производительности

  const handleCitySelect = (city: CityRaw) => {
    const cityName = city.namecase?.nominative || city.name || '';
    const cityNamePreposition =
      city.namecase?.prepositional ||
      city.namecase?.nominative ||
      city.name ||
      '';
    const coords = city.coords;

    onSelect(
      city.label || '',
      cityName,
      cityNamePreposition,
      coords?.lat || null,
      coords?.lon || null
    );
    onClose();
  };

  // Варианты анимации для заднего фона
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Варианты анимации для модального окна
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
      y: 15,
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.div
            ref={modalRef}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar-2"
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
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Выберите город
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              {/* Текущий город */}
              {currentCity && (
                <div className="mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Текущий город:
                  </span>
                  <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-sm sm:text-base text-gray-900">
                    {currentCity}
                  </div>
                </div>
              )}

              {/* Поле поиска */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Начните вводить название города..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base text-gray-900 placeholder-gray-500"
                />

                {isLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Список городов */}
              {filteredCities.length > 0 && (
                <div className="mt-3 max-h-64 overflow-y-auto custom-scrollbar-2">
                  <div className="space-y-1">
                    {filteredCities.map((city, index) => {
                      const cityName =
                        city.namecase?.nominative || city.name || '';
                      return (
                        <button
                          type="button"
                          key={`${city.label}-${index}`}
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                        >
                          <span className="text-sm sm:text-base text-gray-900 font-medium">
                            {cityName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Нет результатов */}
              {!isLoading &&
                searchTerm.trim() &&
                filteredCities.length === 0 && (
                  <div className="mt-4 text-center py-6 sm:py-8">
                    <div className="text-gray-400 text-sm">
                      Город "{searchTerm}" не найден
                    </div>
                    <div className="text-gray-300 text-xs mt-1">
                      Попробуйте изменить запрос
                    </div>
                  </div>
                )}

              {/* Начальное состояние */}
              {!searchTerm.trim() && !isLoading && (
                <div className="mt-4 text-center py-6 sm:py-8">
                  <div className="text-gray-400 text-sm">Популярные города</div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
