import '@/styles/globals.css';
import Footer from '@/components/footer/footer';
import Header from '@/components/header/header';
import HeaderMobile from '@/components/header-mobile/header-mobile';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col justify-between">
      <Header />
      <HeaderMobile />
      <div className="h-screen flex flex-col items-center justify-center text-neutral-600">
        {/* было: <img
          className="w-20 sm:w-24 mb-2 "
          src="https://ik.imagekit.io/motorolla29/molla/icons/oshibka_404.svg"
          alt="404"
        /> */}
        <img
          src={`${process.env.CLOUD_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_CLOUD_PUBLIC_BASE_URL || 'https://molla.s3.cloud.ru'}/icons/oshibka_404.svg`}
          alt="404"
          className="w-20 sm:w-24 mb-2"
        />
        <h1 className="text-sm sm:text-base mb-5">Тут ничего нет.</h1>
        <Link
          href="/"
          className="text-xs sm:text-sm text-white bg-violet-400 px-5 py-2 rounded-xl hover:bg-violet-500 active:bg-violet-600"
        >
          На главную
        </Link>
      </div>
      <Footer />
    </div>
  );
}
