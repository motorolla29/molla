'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Компонент для централизованного управления scroll restoration
 * Отключает scroll restoration только для главной страницы
 */
export default function ScrollRestorationManager() {
  const pathname = usePathname();

  useEffect(() => {
    // Проверяем, находимся ли мы на главной странице
    const isHomePage = pathname === '/';

    if (isHomePage) {
      // Сохраняем предыдущее значение scroll restoration
      const previousScrollRestoration = window.history.scrollRestoration;

      // Отключаем scroll restoration для главной страницы
      window.history.scrollRestoration = 'manual';

      // Восстанавливаем значение при уходе со страницы
      return () => {
        window.history.scrollRestoration = previousScrollRestoration;
      };
    }
  }, [pathname]);

  return null;
}