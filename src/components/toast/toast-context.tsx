'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { ReactNode as ReactNodeType } from 'react';

export interface ToastData {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  icon?: ReactNodeType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastData[];
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { showToast } = context;

  return {
    ...context,
    success: (
      message: string,
      options?: { icon?: ReactNodeType; duration?: number }
    ) => showToast({ type: 'success', message, ...options }),
    error: (
      message: string,
      options?: { icon?: ReactNodeType; duration?: number }
    ) => showToast({ type: 'error', message, ...options }),
    warning: (
      message: string,
      options?: { icon?: ReactNodeType; duration?: number }
    ) => showToast({ type: 'warning', message, ...options }),
    info: (
      message: string,
      options?: { icon?: ReactNodeType; duration?: number }
    ) => showToast({ type: 'info', message, ...options }),
    show: (
      message: string,
      options?: {
        type?: 'success' | 'error' | 'warning' | 'info';
        icon?: ReactNodeType;
        duration?: number;
      }
    ) => showToast({ message, ...options }),
  };
}
