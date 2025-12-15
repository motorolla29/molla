import LocationInitializer from '@/components/location-initializer/location-initializer';
import AuthInitializer from '@/components/auth-initializer/auth-initializer';
import '@/styles/globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <LocationInitializer />
        <AuthInitializer />
        {children}
      </body>
    </html>
  );
}
