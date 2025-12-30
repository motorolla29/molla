'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmationModalProps {
  id: string;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({
  title = 'Подтверждение действия',
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  onClose,
}: ConfirmationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Анимация появления
  useEffect(() => {
    const animationTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // Блокировка скролла
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(animationTimer);
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Время анимации выхода
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    handleClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/50 backdrop-blur-sm
        transition-opacity duration-300
        ${isVisible && !isExiting ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`
          relative w-full max-w-md mx-auto
          bg-white rounded-2xl shadow-2xl
          transform transition-all duration-300 ease-out
          ${
            isVisible && !isExiting
              ? 'translate-y-0 opacity-100 scale-100'
              : isExiting
              ? 'translate-y-4 opacity-0 scale-95'
              : 'translate-y-4 opacity-0 scale-95'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Иконка предупреждения */}
        <div className="flex justify-center -mt-8 mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        {/* Контент */}
        <div className="px-6 pb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="
                flex-1 px-4 py-3 text-sm font-medium text-gray-700
                bg-gray-100 hover:bg-gray-200
                rounded-xl transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-300
              "
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="
                flex-1 px-4 py-3 text-sm font-medium text-white
                bg-violet-500 hover:bg-violet-600
                rounded-xl transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-violet-300
              "
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
