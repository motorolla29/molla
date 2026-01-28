'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
  scrollAlreadyLocked?: boolean;
}

export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  altText = 'Изображение',
  scrollAlreadyLocked = false,
}: ImageModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Сбрасываем состояние загрузки при открытии
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
    }
  }, [isOpen]);

  // Блокируем скролл страницы при открытом модальном окне
  // Только если скролл не заблокирован на уровне выше (например, в чате на мобильном)
  useEffect(() => {
    if (!isOpen || scrollAlreadyLocked) return;

    lockScroll();

    return () => {
      // Ждем завершения анимации выхода перед разблокировкой скролла
      setTimeout(() => {
        unlockScroll();
      }, 200);
    };
  }, [isOpen, scrollAlreadyLocked]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-6 pb-12 lg:py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.div
            className="relative max-w-4xl h-fit max-h-[80dvh] lg:max-h-[90dvh] min-w-[200px] min-h-[200px] rounded-xl shadow-2xl select-none flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{
              duration: 0.35,
              ease: 'easeOut',
              type: 'spring',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <motion.button
              onClick={onClose}
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
              initial={{ opacity: 0, scale: 0.25, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: 360 }}
              exit={{ opacity: 0, scale: 0.25, rotate: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              aria-label="Закрыть"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>

            {/* Спиннер загрузки */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100/20 rounded-lg">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Изображение в большом размере */}
            <img
              src={imageUrl}
              alt={altText}
              className={`w-full h-auto max-h-[80dvh] lg:max-h-[90dvh] rounded-lg object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={(e) => e.stopPropagation()}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // Показываем изображение даже при ошибке
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}