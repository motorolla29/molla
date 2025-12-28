'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const SCROLL_THRESHOLD = 400; // Порог появления кнопки в пикселях

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    // Проверяем начальное положение
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-20 right-4 sm:bottom-24 sm:right-6 lg:bottom-6 lg:right-6 z-40 p-3 sm:p-4 bg-violet-500 hover:bg-violet-600 text-white rounded-full shadow-lg transition-all duration-300 ease-in-out transform ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
      }`}
      aria-label="Прокрутить наверх"
    >
      <ChevronUp size={24} className="sm:w-7 sm:h-7" />
    </button>
  );
}
