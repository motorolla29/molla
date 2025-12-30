'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Currency } from '@/types/ad';

interface AdCurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
}

const currencyOptions = [
  { key: 'RUB' as Currency, label: '₽ RUB', symbol: '₽' },
  { key: 'USD' as Currency, label: '$ USD', symbol: '$' },
  { key: 'EUR' as Currency, label: '€ EUR', symbol: '€' },
];

export default function AdCurrencySelector({
  value,
  onChange,
}: AdCurrencySelectorProps) {
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

  const selectedCurrency = currencyOptions.find((opt) => opt.key === value);

  // Варианты анимации для выпадающего списка
  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: -5,
      scale: 0.98,
    },
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs sm:text-sm font-medium mb-1">
        Валюта
      </label>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm sm:text-base bg-white flex items-center justify-between"
      >
        <div className="flex items-center">
          {selectedCurrency ? (
            <span>{selectedCurrency.label}</span>
          ) : (
            <span className="text-gray-500">Выберите валюту</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 ml-2 transition-transform ${
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

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: 0.2,
              ease: 'easeOut',
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
          >
            {currencyOptions.map((opt, index) => (
              <motion.button
                key={opt.key}
                type="button"
                onClick={() => {
                  onChange(opt.key);
                  setIsDropdownOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center border-b border-gray-100 last:border-b-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.05, // Небольшая задержка для каждого элемента
                  duration: 0.15,
                  ease: 'easeOut',
                }}
              >
                <span className="text-sm sm:text-base text-gray-900">
                  {opt.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
