import Footer from '@/components/footer/footer';
import Header from '@/components/header/header';
import type { ReactNode } from 'react';

export const metadata = { title: 'Molla' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="container mx-auto min-h-screen">{children}</div>
      <Footer />
    </>
  );
}
