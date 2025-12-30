'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatar?: string;
  name: string;
}

export default function AvatarModal({
  isOpen,
  onClose,
  avatar,
  name,
}: AvatarModalProps) {
  // Блокируем скролл страницы при открытом модальном окне
  useEffect(() => {
    if (!isOpen) return;

    lockScroll();

    return () => {
      // Ждем завершения анимации выхода перед разблокировкой скролла
      setTimeout(() => {
        unlockScroll();
      }, 250);
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={onClose}
        >
          <motion.div
            className="relative max-w-md rounded-xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{
              duration: 0.35,
              ease: 'easeOut',
              type: 'spring',
              damping: 20,
              stiffness: 200,
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

            {/* Аватар в большом размере */}
            <img
              src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${avatar}`}
              alt={name}
              className="w-full h-auto max-w-xl max-h-[80vh] mx-auto rounded-lg object-cover"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
