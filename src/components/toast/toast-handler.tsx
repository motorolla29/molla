'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from './toast-context';

export default function ToastHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show } = useToast();

  // Стабилизируем функцию show с помощью ref
  const showRef = useRef(show);
  showRef.current = show;

  // Проверяем только наличие toast параметра
  const toastParam = searchParams.get('toast');

  useEffect(() => {
    if (toastParam) {
      // Удаляем параметр из URL без перезагрузки
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('toast');

      const newUrl = newSearchParams.toString()
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname;

      // Обновляем URL без перезагрузки
      router.replace(newUrl, { scroll: false });

      // Показываем соответствующий тост
      switch (toastParam) {
        case 'ad-deleted':
          showRef.current('Объявление удалено', {
            type: 'info',
          });
          break;
        case 'archived':
          showRef.current('Объявление перенесено в архив', {
            type: 'info',
          });
          break;
        case 'published':
          showRef.current('Объявление снова опубликовано', {
            type: 'success',
          });
          break;
        default:
          break;
      }
    }
  }, [toastParam, router]); // Зависим только от toastParam и router

  return null; // Этот компонент ничего не рендерит
}
