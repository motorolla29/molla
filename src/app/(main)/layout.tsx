import Footer from '@/components/footer/footer';
import HeaderMobile from '@/components/header-mobile/header-mobile';
import Header from '@/components/header/header';
import MobileBottomNav from '@/components/mobile-bottom-nav/mobile-bottom-nav';
import ScrollToTopButton from '@/components/scroll-to-top-button/scroll-to-top-button';
import ScrollRestorationManager from '@/components/scroll-restoration-manager/scroll-restoration-manager';
import type { ReactNode } from 'react';

export const metadata = { title: 'Molla' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollRestorationManager />
      <Header />
      <HeaderMobile />
      <div className="container mx-auto min-h-[calc(100vh-48px-48px)] lg:min-h-[calc(100vh-60px)] flex">
        {/* 48px - header mobile height, 48px - mobile bottom panel height, 60px - header desktop height */}
        <div className="flex-1">{children}</div>
      </div>
      <ScrollToTopButton />
      <MobileBottomNav />
      <Footer />
    </>
  );
}
