'use client';

import Link from 'next/link';
import { ArrowLeft, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div id="offline-page" className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-neutral-100 z-10 shadow-md">
        <div className="h-15 flex items-center justify-between px-4">
          <div className="w-12 flex items-center justify-start">
            <a
              href="/"
              className="retry-link flex items-center p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Вернуться назад"
            >
              <ArrowLeft className="h-6 w-6 max-sm:h-5 max-sm:w-5" />
            </a>
          </div>
          <Link className="flex h-[60%] max-sm:h-[50%]" href="/">
            <img src="/logo/molla-logo.svg" alt="Molla" />
          </Link>
          <div className="w-12" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-red-100">
            <WifiOff className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Вы офлайн
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Проверьте соединение и попробуйте ещё раз.
          </p>
          <a
            href="/"
            className="retry-link w-full max-w-fit inline-flex items-center justify-center rounded-xl bg-violet-500 px-6 py-3 text-sm sm:text-base font-semibold text-white hover:bg-violet-600 active:bg-violet-700 active:outline-none transition-colors"
          >
            Попробовать ещё раз
          </a>
        </div>
      </main>
    </div>
  );
}
