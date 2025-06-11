import Footer from '@/components/footer/footer';
import Header from '@/components/header/header';
import '@/styles/globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Molla' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Header />
        <div className="container mx-auto min-h-screen">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
