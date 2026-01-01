'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function NotFound() {
  // Скролл вверх при загрузке страницы 404 (для мобильных браузеров)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-[calc(100vh-48px-48px)] lg:min-h-[calc(100vh-60px)] flex flex-col items-center justify-center text-neutral-600">
      {/* 48px - header mobile height, 48px - mobile bottom panel height, 60px - header desktop height */}
      <img
        className="w-20 sm:w-24 mb-2 "
        src="https://ik.imagekit.io/motorolla29/molla/icons/oshibka_404.svg"
        alt="404"
      />
      <h1 className="text-sm sm:text-base mb-5">Тут ничего нет.</h1>
      <Link
        href="/"
        className="text-xs sm:text-sm text-white bg-violet-400 px-5 py-2 rounded-xl hover:bg-violet-500 active:bg-violet-600"
      >
        На главную
      </Link>
    </div>
  );
}
