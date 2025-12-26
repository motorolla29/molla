'use client';

import { useToast } from './toast-context';
import Toast from './toast';

export default function ToastContainer() {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed top-4 left-0 right-0 z-50 pointer-events-none mx-4">
      <div className="flex flex-col items-center">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            icon={toast.icon}
            message={toast.message}
            duration={toast.duration}
            onClose={hideToast}
          />
        ))}
      </div>
    </div>
  );
}
