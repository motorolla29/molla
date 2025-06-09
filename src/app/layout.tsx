import '@/styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Molla' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="w-screen bg-stone-900 h-[2rem]"></div>
        <div className="container mx-auto">{children}</div>
      </body>
    </html>
  );
}
