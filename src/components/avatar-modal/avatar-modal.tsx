'use client';

import { useEffect } from 'react';
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
      unlockScroll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-md bg-white rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
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
        </button>

        {/* Аватар в большом размере */}
        <img
          src={`https://ik.imagekit.io/motorolla29/molla/user-avatars/${avatar}`}
          alt={name}
          className="w-full h-auto max-w-xl max-h-[80vh] mx-auto rounded-lg object-cover"
        />
      </div>
    </div>
  );
}
