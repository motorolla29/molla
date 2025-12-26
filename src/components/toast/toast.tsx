'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({
  id,
  type = 'info',
  icon,
  message,
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const toastRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const onCloseRef = useRef(onClose);

  // Обновляем ref при изменении onClose
  onCloseRef.current = onClose;

  // Анимация появления
  useEffect(() => {
    // Небольшая задержка для гарантии отображения начального состояния
    const animationTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // Автоматическое закрытие
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      clearTimeout(animationTimer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Пустой массив зависимостей - запускается только при монтировании

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onCloseRef.current(id);
    }, 300); // Время анимации выхода
  };

  // Иконки по типу
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#4fa94d]" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
      case 'warning':
        return (
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
        );
      case 'info':
      default:
        return <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
    }
  };

  // Цвета и стили по типу
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#4fa94d]/10 backdrop-blur-sm border border-[#4fa94d]/20',
          text: 'text-gray-900',
        };
      case 'error':
        return {
          bg: 'bg-red-50/90 backdrop-blur-sm border border-red-200/50',
          text: 'text-red-900',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50/90 backdrop-blur-sm border border-yellow-200/50',
          text: 'text-yellow-900',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50/90 backdrop-blur-sm border border-blue-200/50',
          text: 'text-blue-900',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      ref={toastRef}
      className={`
        relative max-w-sm w-full mx-3 sm:mx-4 mb-3 p-3 sm:p-4 rounded-2xl shadow-xl
        transform transition-all duration-500 ease-out
        ${styles.bg}
        ${
          isVisible && !isExiting
            ? 'translate-y-0 opacity-100'
            : isExiting
            ? 'translate-y-full opacity-0'
            : '-translate-y-full opacity-0'
        }
      `}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="shrink-0">{icon || getDefaultIcon()}</div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-xs sm:text-sm font-medium ${styles.text} wrap-break-word`}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
