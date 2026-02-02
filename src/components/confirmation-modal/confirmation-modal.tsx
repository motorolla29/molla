'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { lockScroll, unlockScroll } from '@/utils/scroll-lock';

export interface ConfirmationModalProps {
  id: string;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconBgColor?: string;
  iconColor?: string;
  iconSize?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export default function ConfirmationModal({
  id,
  title = 'Подтверждение действия',
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  icon: Icon = AlertTriangle,
  iconBgColor = 'bg-orange-100',
  iconColor = 'text-orange-500',
  iconSize = 'w-6 h-6 sm:w-8 sm:h-8',
  onConfirm,
  onCancel,
  onClose,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Блокировка скролла
  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  const handleClose = () => {
    onClose();
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className="relative w-full max-w-md sm:max-w-md mx-auto bg-white rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Иконка */}
        <motion.div
          className="flex justify-center -mt-6 sm:-mt-8 mb-3 sm:mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
        >
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 ${iconBgColor} rounded-full flex items-center justify-center border-4 border-white shadow-lg`}
          >
            <Icon className={iconSize + ' ' + iconColor} />
          </div>
        </motion.div>

        {/* Контент */}
        <motion.div
          className="px-4 sm:px-6 pb-4 sm:pb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="text-center">
            <motion.h3
              className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h3>
            <motion.p
              className="text-xs sm:text-sm text-gray-600 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              {message}
            </motion.p>
          </div>

          {/* Кнопки */}
          <motion.div
            className="flex gap-2 sm:gap-3 mt-4 sm:mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={handleCancel}
              className="
                flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700
                bg-gray-100 hover:bg-gray-200
                rounded-lg sm:rounded-xl transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-300
              "
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="
                flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white
                bg-violet-500 hover:bg-violet-600
                rounded-lg sm:rounded-xl transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-violet-300
              "
            >
              {confirmText}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
