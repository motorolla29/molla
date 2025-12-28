import Footer from '@/components/footer/footer';
import HeaderMobile from '@/components/header-mobile/header-mobile';
import Header from '@/components/header/header';
import MobileBottomNav from '@/components/mobile-bottom-nav/mobile-bottom-nav';
import ScrollToTopButton from '@/components/scroll-to-top-button/scroll-to-top-button';
import type { ReactNode } from 'react';

export const metadata = { title: 'Molla' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <HeaderMobile />
      <div className="container mx-auto min-h-screen">{children}</div>
      <ScrollToTopButton />
      <MobileBottomNav />
      <Footer />
    </>
  );
}
