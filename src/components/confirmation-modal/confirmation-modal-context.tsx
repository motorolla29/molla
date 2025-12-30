'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

export interface ConfirmationModalData {
  id: string;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmationModalContextType {
  modal: ConfirmationModalData | null;
  showConfirmation: (data: Omit<ConfirmationModalData, 'id'>) => void;
  hideConfirmation: () => void;
}

const ConfirmationModalContext = createContext<
  ConfirmationModalContextType | undefined
>(undefined);

export function ConfirmationModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [modal, setModal] = useState<ConfirmationModalData | null>(null);

  const showConfirmation = useCallback(
    (data: Omit<ConfirmationModalData, 'id'>) => {
      const id =
        Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newModal: ConfirmationModalData = {
        id,
        confirmText: 'Подтвердить',
        cancelText: 'Отмена',
        ...data,
      };

      setModal(newModal);
    },
    []
  );

  const hideConfirmation = useCallback(() => {
    setModal(null);
  }, []);

  return (
    <ConfirmationModalContext.Provider
      value={{ modal, showConfirmation, hideConfirmation }}
    >
      {children}
    </ConfirmationModalContext.Provider>
  );
}

export function useConfirmationModal() {
  const context = useContext(ConfirmationModalContext);
  if (context === undefined) {
    throw new Error(
      'useConfirmationModal must be used within a ConfirmationModalProvider'
    );
  }

  const { showConfirmation } = context;

  return {
    ...context,
    confirm: (
      message: string,
      onConfirm: () => void,
      options?: {
        title?: string;
        confirmText?: string;
        cancelText?: string;
        onCancel?: () => void;
      }
    ) =>
      showConfirmation({
        message,
        onConfirm,
        ...options,
      }),
  };
}
