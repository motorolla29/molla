import LocationInitializer from '@/components/location-initializer/location-initializer';
import AuthInitializer from '@/components/auth-initializer/auth-initializer';
import { ToastProvider } from '@/components/toast/toast-context';
import ToastContainer from '@/components/toast/toast-container';
import ToastHandler from '@/components/toast/toast-handler';
import { ConfirmationModalProvider } from '@/components/confirmation-modal/confirmation-modal-context';
import ConfirmationModalContainer from '@/components/confirmation-modal/confirmation-modal-container';
import '@/styles/globals.css';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <LocationInitializer />
        <AuthInitializer />
        <ConfirmationModalProvider>
          <ToastProvider>
            {children}
            <ToastContainer />
            <ConfirmationModalContainer />
            <Suspense>
              <ToastHandler />
            </Suspense>
          </ToastProvider>
        </ConfirmationModalProvider>
      </body>
    </html>
  );
}
