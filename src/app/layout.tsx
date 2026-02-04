import type { Metadata, Viewport } from 'next';
import LocationInitializer from '@/components/location-initializer/location-initializer';
import AuthInitializer from '@/components/auth-initializer/auth-initializer';
import GlobalActivityTracker from '@/components/global-activity-tracker/global-activity-tracker';
import GlobalEventListener from '@/components/global-event-listener/global-event-listener';
import ServiceWorkerRegister from '@/components/service-worker-register/service-worker-register';
import { ToastProvider } from '@/components/toast/toast-context';
import ToastContainer from '@/components/toast/toast-container';
import ToastHandler from '@/components/toast/toast-handler';
import { ConfirmationModalProvider } from '@/components/confirmation-modal/confirmation-modal-context';
import ConfirmationModalContainer from '@/components/confirmation-modal/confirmation-modal-container';
import '@/styles/globals.css';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Molla - Доска объявлений',
  description: 'Найдите товары, услуги и недвижимость в вашем городе',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#FE9A00',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <LocationInitializer />
        <AuthInitializer />
        <GlobalActivityTracker />
        <GlobalEventListener />
        <ServiceWorkerRegister />
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
