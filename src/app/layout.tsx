import LocationInitializer from '@/components/location-initializer/location-initializer';
import AuthInitializer from '@/components/auth-initializer/auth-initializer';
import ScrollToTop from '@/components/scroll-to-top/scroll-to-top';
import { ToastProvider } from '@/components/toast/toast-context';
import ToastContainer from '@/components/toast/toast-container';
import ToastHandler from '@/components/toast/toast-handler';
import '@/styles/globals.css';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ScrollToTop />
        <LocationInitializer />
        <AuthInitializer />
        <ToastProvider>
          {children}
          <ToastContainer />
          <Suspense>
            <ToastHandler />
          </Suspense>
        </ToastProvider>
      </body>
    </html>
  );
}
