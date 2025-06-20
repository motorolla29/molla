import LocationInitializer from '@/components/location-initializer/location-initializer';
import '@/styles/globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <LocationInitializer />
        {children}
      </body>
    </html>
  );
}
